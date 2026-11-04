"use client";

import React, { useCallback, useEffect, useState } from "react";
import { City, StudyProgram, Vacancy } from "@/lib/types";
import { fetchMasterData, fetchVacancies as fetchKemnakerVacancies } from "@/lib/kemnaker-client";
import { VacancyDetailModal } from "./VacancyDetailModal";

const SAVED_VACANCIES_KEY = "mhc_saved_vacancies_v1";

const EDU_LABELS: Record<string, string> = {
  diploma: "Diploma (D3/D4)",
  bachelor: "Sarjana (S1)",
  profession: "Profesi",
};

export function VacancyExplorer() {
  const [cities, setCities] = useState<City[]>([]);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
  const [masterError, setMasterError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedProdiId, setSelectedProdiId] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [organizerType, setOrganizerType] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [page, setPage] = useState(1);

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [savedVacancies, setSavedVacancies] = useState<Vacancy[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_VACANCIES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedVacancies(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchMasterData()
      .then((res) => {
        setCities(res.cities);
        setStudyPrograms(res.studyPrograms);
      })
      .catch(() => {
        setMasterError("Tidak dapat memuat daftar kota & program studi.");
      });
  }, []);

  const fetchVacancies = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchKemnakerVacancies({
          keyword,
          cityId: selectedCityId,
          studyProgramId: selectedProdiId,
          educationLevel,
          organizerType,
          interviewType,
          page: targetPage,
          limit: 12,
        });
        setVacancies(result.data);
        setMeta(result.meta);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan jaringan saat memuat lowongan."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      keyword,
      selectedCityId,
      selectedProdiId,
      educationLevel,
      organizerType,
      interviewType,
    ]
  );

  useEffect(() => {
    fetchVacancies(page);
  }, [page, fetchVacancies]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSavedOnly(false);
    if (page === 1) {
      fetchVacancies(1);
    } else {
      setPage(1);
    }
  };

  const handleResetFilters = () => {
    setKeyword("");
    setSelectedCityId("");
    setSelectedProdiId("");
    setEducationLevel("");
    setOrganizerType("");
    setInterviewType("");
    setShowSavedOnly(false);
    setPage(1);
  };

  const toggleSaveVacancy = (v: Vacancy) => {
    setSavedVacancies((prev) => {
      const exists = prev.some((item) => item.id === v.id);
      const next = exists
        ? prev.filter((item) => item.id !== v.id)
        : [v, ...prev];
      try {
        localStorage.setItem(SAVED_VACANCIES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const displayedList = showSavedOnly ? savedVacancies : vacancies;

  return (
    <div className="space-y-6">
      {/* Search & Filter Panel */}
      <form
        onSubmit={handleSearchSubmit}
        className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label
              htmlFor="vacancy-keyword"
              className="block text-xs font-bold text-[var(--text-primary)]"
            >
              Kata Kunci Posisi / Perusahaan
            </label>
            <input
              id="vacancy-keyword"
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Contoh: Data Analyst, Akuntansi, BPJS, Rumah Sakit"
              className="w-full min-h-11 px-3.5 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-sm text-[var(--text-primary)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-11 px-5 py-2.5 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-on-primary)] text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            {loading ? "Memuat Lowongan..." : "Cari Lowongan"}
          </button>
          <button
            type="button"
            onClick={() => setShowSavedOnly((prev) => !prev)}
            className={`min-h-11 px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-bold cursor-pointer ${
              showSavedOnly
                ? "bg-[var(--brand-soft)] border-[var(--brand-primary)] text-[var(--brand-primary)]"
                : "bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
            }`}
          >
            Tersimpan ({savedVacancies.length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-[var(--border-default)]">
          <div className="space-y-1">
            <label
              htmlFor="filter-city"
              className="block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Kota / Kabupaten
            </label>
            <select
              id="filter-city"
              value={selectedCityId}
              onChange={(e) => {
                setSelectedCityId(e.target.value);
                setShowSavedOnly(false);
                setPage(1);
              }}
              className="w-full min-h-11 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] cursor-pointer"
            >
              <option value="">Semua Kota ({cities.length})</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="filter-prodi"
              className="block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Program Studi
            </label>
            <select
              id="filter-prodi"
              value={selectedProdiId}
              onChange={(e) => {
                setSelectedProdiId(e.target.value);
                setShowSavedOnly(false);
                setPage(1);
              }}
              className="w-full min-h-11 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] cursor-pointer"
            >
              <option value="">Semua Prodi ({studyPrograms.length})</option>
              {studyPrograms.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="filter-edu"
              className="block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Jenjang Pendidikan
            </label>
            <select
              id="filter-edu"
              value={educationLevel}
              onChange={(e) => {
                setEducationLevel(e.target.value);
                setShowSavedOnly(false);
                setPage(1);
              }}
              className="w-full min-h-11 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] cursor-pointer"
            >
              <option value="">Semua Jenjang</option>
              <option value="diploma">Diploma (D3/D4)</option>
              <option value="bachelor">Sarjana (S1)</option>
              <option value="profession">Profesi</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="filter-organizer"
              className="block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Jenis Penyelenggara
            </label>
            <select
              id="filter-organizer"
              value={organizerType}
              onChange={(e) => {
                setOrganizerType(e.target.value);
                setShowSavedOnly(false);
                setPage(1);
              }}
              className="w-full min-h-11 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] cursor-pointer"
            >
              <option value="">Semua Penyelenggara</option>
              <option value="company">Perusahaan Swasta / BUMN</option>
              <option value="government">Instansi Pemerintah</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="filter-interview"
              className="block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Metode Wawancara
            </label>
            <select
              id="filter-interview"
              value={interviewType}
              onChange={(e) => {
                setInterviewType(e.target.value);
                setShowSavedOnly(false);
                setPage(1);
              }}
              className="w-full min-h-11 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] cursor-pointer"
            >
              <option value="">Semua Metode</option>
              <option value="online">Daring (Online)</option>
              <option value="onsite">Tatap Muka (Onsite)</option>
            </select>
          </div>
        </div>

        {masterError && (
          <p className="text-xs text-[var(--accent-amber)]">{masterError}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[var(--text-secondary)]">
          <span>
            {showSavedOnly
              ? `Menampilkan ${savedVacancies.length} lowongan yang Anda simpan di perangkat ini.`
              : `Ditemukan ${Number(meta.total || 0).toLocaleString(
                  "id-ID"
                )} lowongan aktif di portal resmi Kemnaker.`}
          </span>
          {(keyword ||
            selectedCityId ||
            selectedProdiId ||
            educationLevel ||
            organizerType ||
            interviewType ||
            showSavedOnly) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="min-h-11 px-3 py-1 rounded-md text-xs font-bold underline text-[var(--brand-primary)] cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </form>

      {/* Error State */}
      {error && !showSavedOnly && (
        <div
          role="alert"
          className="rounded-xl bg-[var(--status-rose-soft)] border border-[var(--status-rose)] p-5 text-xs sm:text-sm text-[var(--status-rose)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <p className="font-bold">Gagal Memuat Daftar Lowongan</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchVacancies(page)}
            className="min-h-11 px-4 py-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] text-xs font-bold cursor-pointer shrink-0"
          >
            Coba Muat Ulang
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !showSavedOnly ? (
        <div
          role="status"
          className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-10 text-center space-y-2"
        >
          <p className="text-sm font-bold">
            Mengambil data lowongan langsung dari api.kemnaker.go.id...
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Memuat kuota kursi, jumlah pelamar terkini, dan skor peluang.
          </p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-10 text-center space-y-3">
          <p className="text-sm font-bold">
            {showSavedOnly
              ? "Belum ada lowongan yang Anda simpan."
              : "Tidak ada lowongan yang cocok dengan kriteria pencarian."}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {showSavedOnly
              ? "Klik tombol Simpan pada kartu lowongan untuk memantau rasio persaingan posisi incaran Anda."
              : "Coba gunakan kata kunci yang lebih umum atau hapus filter kota/program studi."}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="min-h-11 px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-[var(--brand-on-primary)] text-xs font-bold cursor-pointer"
          >
            Tampilkan Semua Lowongan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedList.map((v) => {
            const quota = Number(v.quantity_needed) || 0;
            const applicants = Number(v.total_applications) || 0;
            const ratioNum = quota > 0 ? applicants / quota : null;
            const isSaved = savedVacancies.some((item) => item.id === v.id);

            let densityLabel = "Sangat Longgar";
            let densityTone =
              "bg-[var(--status-emerald-soft)] text-[var(--status-emerald)]";
            if (ratioNum !== null) {
              if (ratioNum > 15) {
                densityLabel = "Persaingan Ketat";
                densityTone =
                  "bg-[var(--status-rose-soft)] text-[var(--status-rose)]";
              } else if (ratioNum > 5) {
                densityLabel = "Persaingan Sedang";
                densityTone =
                  "bg-[var(--accent-amber-soft)] text-[var(--accent-amber)]";
              } else if (ratioNum > 2) {
                densityLabel = "Peluang Terbuka";
                densityTone =
                  "bg-[var(--status-sky-soft)] text-[var(--status-sky)]";
              }
            }

            const prodiNames =
              Array.isArray(v.study_programs) && v.study_programs.length > 0
                ? v.study_programs.map((s) => s.name).join(", ")
                : v.study_program?.name || "Berbagai Program Studi";

            return (
              <article
                key={v.id}
                className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 flex flex-col justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[var(--brand-primary)] block truncate">
                        {v.organizer?.name || "Penyelenggara"}
                      </span>
                      <h3 className="text-base font-extrabold leading-snug mt-0.5 break-words">
                        {v.position_name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSaveVacancy(v)}
                      aria-pressed={isSaved}
                      aria-label={
                        isSaved
                          ? `Hapus ${v.position_name} dari simpanan`
                          : `Simpan lowongan ${v.position_name}`
                      }
                      className={`min-h-11 px-3 py-1.5 rounded-lg border text-xs font-bold shrink-0 cursor-pointer ${
                        isSaved
                          ? "bg-[var(--brand-soft)] border-[var(--brand-primary)] text-[var(--brand-primary)]"
                          : "bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {isSaved ? "Tersimpan" : "Simpan"}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                      {v.city?.name || "Indonesia"}
                    </span>
                    {Array.isArray(v.education_levels) &&
                      v.education_levels.map((lvl) => (
                        <span
                          key={lvl}
                          className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-default)]"
                        >
                          {EDU_LABELS[lvl] || lvl}
                        </span>
                      ))}
                    {v.is_disability_friendly && (
                      <span className="px-2 py-0.5 rounded bg-[var(--status-emerald-soft)] text-[var(--status-emerald)] font-semibold">
                        Ramah Disabilitas
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                    <strong>Prodi:</strong> {prodiNames}
                  </p>

                  {/* Competition Ratio Box */}
                  <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold">Analisis Persaingan</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${densityTone}`}
                      >
                        {densityLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--border-default)] text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[var(--text-secondary)] font-sans block">
                          Pelamar
                        </span>
                        <strong className="text-sm">{applicants}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-secondary)] font-sans block">
                          Kuota
                        </span>
                        <strong className="text-sm">{quota} kursi</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-secondary)] font-sans block">
                          Rasio
                        </span>
                        <strong className="text-sm text-[var(--brand-primary)]">
                          {ratioNum !== null ? `${ratioNum.toFixed(1)}x` : "-"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={() => setSelectedVacancy(v)}
                    className="flex-1 min-h-11 px-3 py-2 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-on-primary)] text-xs font-bold cursor-pointer"
                  >
                    Detail & Silabus
                  </button>
                  <a
                    href={`https://maganghub.kemnaker.go.id/magang-nasional/lowongan/${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-11 inline-flex items-center justify-center px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-xs font-bold"
                  >
                    Portal Resmi
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!showSavedOnly && meta.last_page > 1 && (
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-[var(--text-secondary)]">
            Halaman <strong className="font-mono">{meta.current_page}</strong>{" "}
            dari <strong className="font-mono">{meta.last_page}</strong> (Total{" "}
            <strong className="font-mono">
              {Number(meta.total).toLocaleString("id-ID")}
            </strong>{" "}
            lowongan)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-11 px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] text-xs font-bold cursor-pointer disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= meta.last_page || loading}
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              className="min-h-11 px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-[var(--brand-on-primary)] text-xs font-bold cursor-pointer disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      <VacancyDetailModal
        vacancy={selectedVacancy}
        isOpen={Boolean(selectedVacancy)}
        onClose={() => setSelectedVacancy(null)}
      />
    </div>
  );
}

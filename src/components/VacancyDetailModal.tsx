"use client";

import React, { useEffect, useId, useState } from "react";
import { Vacancy } from "@/lib/types";
import { fetchVacancyDetail } from "@/lib/kemnaker-client";

interface VacancyDetailModalProps {
  vacancy: Vacancy | null;
  isOpen: boolean;
  onClose: () => void;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu",
};

const EDU_LABELS: Record<string, string> = {
  diploma: "Diploma (D3/D4)",
  bachelor: "Sarjana (S1)",
  profession: "Profesi",
};

export function VacancyDetailModal({
  vacancy,
  isOpen,
  onClose,
}: VacancyDetailModalProps) {
  const titleId = useId();
  const [detail, setDetail] = useState<Vacancy | null>(vacancy);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "syllabus" | "organizer" | "raw">("overview");

  useEffect(() => {
    setDetail(vacancy);
    setActiveTab("overview");
    if (!isOpen || !vacancy?.id) return;

    let cancelled = false;
    setLoading(true);
    fetchVacancyDetail(vacancy.id)
      .then((data) => {
        if (!cancelled && data) {
          setDetail((prev) => ({ ...(prev || vacancy), ...data }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, vacancy]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !detail) return null;

  const quota = Number(detail.quantity_needed) || 0;
  const applicants = Number(detail.total_applications) || 0;
  const ratio = quota > 0 ? (applicants / quota).toFixed(1) : null;

  const curriculums = Array.isArray(detail.curriculums) ? detail.curriculums : [];
  const materials = curriculums
    .flatMap((c) => c.materials || [])
    .sort((a, b) => (a.month || 1) - (b.month || 1));

  const studyPrograms =
    Array.isArray(detail.study_programs) && detail.study_programs.length > 0
      ? detail.study_programs
      : detail.study_program
        ? [detail.study_program]
        : [];

  const daysOff =
    Array.isArray(detail.days_off) && detail.days_off.length > 0
      ? detail.days_off.map((d) => DAY_LABELS[d.toLowerCase()] || d).join(", ")
      : "Sabtu, Minggu";

  const lat = detail.latitude ? Number(detail.latitude) : NaN;
  const lng = detail.longitude ? Number(detail.longitude) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const mapsSearchUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        detail.address || detail.organizer?.address || detail.city?.name || "Indonesia"
      )}`;

  const portalUrl = `https://maganghub.kemnaker.go.id/magang-nasional/lowongan/${detail.id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xl text-[var(--text-primary)] overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-default)] px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)] mb-1">
              <span className="font-semibold text-[var(--brand-primary)]">
                {detail.organizer?.name || "Penyelenggara Magang"}
              </span>
              <span>•</span>
              <span>{detail.city?.name || "Lokasi Indonesia"}</span>
              {loading && (
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  (Memuat silabus...)
                </span>
              )}
            </div>
            <h2 id={titleId} className="text-lg sm:text-xl font-extrabold break-words">
              {detail.position_name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail lowongan"
            className="min-h-11 min-w-11 shrink-0 inline-flex items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-3 border-b border-[var(--border-default)] bg-[var(--bg-subtle)] flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`min-h-11 px-3.5 py-2 rounded-t-lg text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-[var(--bg-surface)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Ringkasan & Persaingan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("syllabus")}
            className={`min-h-11 px-3.5 py-2 rounded-t-lg text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "syllabus"
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-[var(--bg-surface)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Silabus Bulanan ({materials.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("organizer")}
            className={`min-h-11 px-3.5 py-2 rounded-t-lg text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "organizer"
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-[var(--bg-surface)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Profil Mitra & Lokasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("raw")}
            className={`min-h-11 px-3.5 py-2 rounded-t-lg text-xs sm:text-sm font-mono font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "raw"
                ? "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-[var(--bg-surface)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            JSON API
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-secondary)] block">
                    Kuota Dibutuhkan
                  </span>
                  <span className="text-lg font-extrabold font-mono mt-0.5 block">
                    {quota} kursi
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-secondary)] block">
                    Total Pelamar
                  </span>
                  <span className="text-lg font-extrabold font-mono mt-0.5 block">
                    {applicants} orang
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-secondary)] block">
                    Rasio Persaingan
                  </span>
                  <span className="text-lg font-extrabold font-mono text-[var(--brand-primary)] mt-0.5 block">
                    {ratio ? `${ratio} : 1` : "-"}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-secondary)] block">
                    Skor Peluang API
                  </span>
                  <span className="text-lg font-extrabold font-mono text-[var(--status-emerald)] mt-0.5 block">
                    {detail.competitive_score != null
                      ? `${Math.round(Number(detail.competitive_score))}%`
                      : "-"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold">Deskripsi Tugas & Lingkup Magang</h3>
                <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {detail.task_description ||
                    "Penyelenggara belum mencantumkan deskripsi tugas rinci pada posisi ini."}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Kualifikasi Pendidikan & Prodi
                  </h3>
                  <p className="text-xs sm:text-sm">
                    <strong>Jenjang:</strong>{" "}
                    {Array.isArray(detail.education_levels) &&
                    detail.education_levels.length > 0
                      ? detail.education_levels
                          .map((l) => EDU_LABELS[l] || l)
                          .join(", ")
                      : "Semua Jenjang"}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {studyPrograms.length > 0 ? (
                      studyPrograms.map((sp) => (
                        <span
                          key={sp.id || sp.name}
                          className="px-2.5 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs font-semibold"
                        >
                          {sp.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--text-secondary)]">
                        Terbuka untuk berbagai program studi
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] space-y-2 text-xs sm:text-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Jadwal Kerja & Metode Seleksi
                  </h3>
                  <p>
                    <strong>Hari Kerja:</strong>{" "}
                    {detail.working_days_per_week
                      ? `${detail.working_days_per_week} hari/minggu`
                      : "5 hari/minggu"}
                  </p>
                  <p>
                    <strong>Hari Libur:</strong> {daysOff}
                  </p>
                  <p>
                    <strong>Metode Wawancara:</strong>{" "}
                    {Array.isArray(detail.interview_types) &&
                    detail.interview_types.length > 0
                      ? detail.interview_types
                          .map((t) =>
                            t === "online" ? "Daring (Online)" : "Tatap Muka (Onsite)"
                          )
                          .join(", ")
                      : "Ditentukan Penyelenggara"}
                  </p>
                  <p>
                    <strong>Ramah Disabilitas:</strong>{" "}
                    {detail.is_disability_friendly ? "Ya" : "Tidak disebutkan"}
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === "syllabus" && (
            <div className="space-y-3">
              {curriculums[0]?.name && (
                <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                  <h3 className="text-sm font-bold">{curriculums[0].name}</h3>
                  {curriculums[0].description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">
                      {curriculums[0].description}
                    </p>
                  )}
                </div>
              )}

              {materials.length > 0 ? (
                materials.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold font-mono text-[var(--brand-primary)]">
                        Bulan {item.month || idx + 1}
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        {item.type && (
                          <span className="px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] font-semibold">
                            {item.type === "theory" ? "Teori" : "Praktik"}
                          </span>
                        )}
                        {(item.min_duration_days || item.max_duration_days) && (
                          <span className="font-mono text-[var(--text-secondary)]">
                            {item.min_duration_days || 0} s/d {item.max_duration_days || 0} hari
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold">
                      {item.subject || "Materi Pembelajaran"}
                    </h4>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-center space-y-1">
                  <p className="text-sm font-bold">
                    Silabus Bulanan Belum Diunggah
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Penyelenggara belum melampirkan rincian modul kurikulum bulanan pada endpoint lowongan ini.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "organizer" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] space-y-2">
                <h3 className="text-base font-bold">
                  {detail.organizer?.name || "Penyelenggara"}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Jenis Instansi:{" "}
                  <strong>
                    {detail.organizer?.organizable_type === "government"
                      ? "Instansi Pemerintah / Kementerian"
                      : "Perusahaan Swasta / BUMN"}
                  </strong>
                </p>
                {detail.organizer?.description && (
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pt-2 border-t border-[var(--border-default)]">
                    {detail.organizer.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-secondary)] block">
                    Email Resmi Penyelenggara
                  </span>
                  <span className="font-mono font-semibold break-all mt-1 block">
                    {detail.organizer?.email || "Tidak dicantumkan"}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-secondary)] block">
                    Telepon Narahubung
                  </span>
                  <span className="font-mono font-semibold break-all mt-1 block">
                    {detail.organizer?.phone || "Tidak dicantumkan"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] space-y-3">
                <div>
                  <span className="text-xs text-[var(--text-secondary)] block">
                    Alamat Penugasan
                  </span>
                  <p className="text-sm font-semibold mt-0.5">
                    {detail.address ||
                      detail.organizer?.address ||
                      detail.city?.name ||
                      "Indonesia"}
                  </p>
                  {hasCoords && (
                    <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
                      Koordinat GPS: {lat}, {lng}
                    </p>
                  )}
                </div>
                <a
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-11 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                >
                  Buka Titik Lokasi di Google Maps
                </a>
              </div>
            </div>
          )}

          {activeTab === "raw" && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--text-secondary)]">
                Respons JSON asli dari endpoint{" "}
                <code className="font-mono">
                  /maganghub/vacancy/v2/vacancies/published/{detail.id}
                </code>
                :
              </p>
              <pre className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs font-mono overflow-x-auto max-h-96">
                {JSON.stringify(detail, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[var(--border-default)] px-5 py-3.5 bg-[var(--bg-subtle)]">
          <span className="text-xs font-mono text-[var(--text-muted)] truncate">
            ID: {detail.id}
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs sm:text-sm font-bold text-[var(--text-primary)] cursor-pointer"
            >
              Tutup
            </button>
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 inline-flex items-center justify-center px-5 py-2 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-on-primary)] text-xs sm:text-sm font-bold text-center"
            >
              Buka Halaman Lowongan di MagangHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

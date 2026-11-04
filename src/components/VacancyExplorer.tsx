"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { City, StudyProgram, Vacancy } from "@/lib/types";
import {
  fetchMasterData,
  fetchVacancies as fetchKemnakerVacancies,
} from "@/lib/kemnaker-client";
import { VacancyDetailModal } from "./VacancyDetailModal";

const SAVED_VACANCIES_KEY = "mhc_saved_vacancies_v1";

const EDU_OPTIONS = [
  { value: "diploma", label: "Diploma (D3/D4)" },
  { value: "bachelor", label: "Sarjana (S1)" },
  { value: "profession", label: "Profesi" },
  { value: "master", label: "Magister (S2)" },
  { value: "doctoral", label: "Doktor (S3)" },
];

const INTERVIEW_OPTIONS = [
  { value: "online", label: "Daring (Online)" },
  { value: "onsite", label: "Tatap Muka (Onsite)" },
];

const SORT_OPTIONS = [
  { value: "created_at_desc", label: "Terbaru Ditayangkan (Default)" },
  { value: "total_applications_asc", label: "Pelamar Paling Sedikit (Peluang Emas)" },
  { value: "quantity_needed_desc", label: "Kuota Penerimaan Terbanyak" },
  { value: "total_applications_desc", label: "Pelamar Terbanyak (Paling Populer)" },
  { value: "competitive_score_desc", label: "Skor Peluang Tertinggi" },
  { value: "name_asc", label: "Nama Posisi (A-Z)" },
  { value: "created_at_asc", label: "Terlama Ditayangkan" },
];

interface MultiSelectComboboxProps {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  items: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  badgeTone?: "sky" | "emerald";
}

function MultiSelectCombobox({
  label,
  placeholder,
  searchPlaceholder,
  items,
  selectedIds,
  onChange,
  badgeTone = "sky",
}: MultiSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const comboboxId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items.slice(0, 100);
    const q = searchTerm.toLowerCase();
    return items
      .filter((item) => item.name.toLowerCase().includes(q))
      .slice(0, 100);
  }, [items, searchTerm]);

  const selectedItemMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) {
      if (selectedIds.includes(it.id)) {
        map.set(it.id, it.name);
      }
    }
    return map;
  }, [items, selectedIds]);

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((item) => item !== id));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const toneBadgeClass =
    badgeTone === "emerald"
      ? "bg-[var(--status-emerald-soft)] text-[var(--status-emerald)] border-[var(--status-emerald)]"
      : "bg-[var(--status-sky-soft)] text-[var(--status-sky)] border-[var(--status-sky)]";

  return (
    <div ref={containerRef} className="space-y-1 relative">
      <div className="flex items-center justify-between">
        <label
          htmlFor={comboboxId}
          className="block text-xs font-semibold text-[var(--text-secondary)]"
        >
          {label}
          {selectedIds.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded font-mono text-[10px] bg-[var(--accent-navy)] text-white">
              {selectedIds.length} dipilih
            </span>
          )}
        </label>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] text-[var(--status-rose)] hover:underline cursor-pointer"
          >
            Hapus Pilihan
          </button>
        )}
      </div>

      {/* Trigger Box */}
      <div
        id={comboboxId}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((prev) => !prev);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        className="w-full min-h-11 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] cursor-pointer flex items-center justify-between gap-2 hover:border-[var(--accent-navy)] transition-colors"
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 py-0.5">
          {selectedIds.length === 0 ? (
            <span className="text-[var(--text-muted)] truncate">{placeholder}</span>
          ) : (
            selectedIds.slice(0, 3).map((id) => (
              <span
                key={id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${toneBadgeClass}`}
              >
                <span className="truncate max-w-[140px]">
                  {selectedItemMap.get(id) || id}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => removeSingle(id, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      removeSingle(id, e as unknown as React.MouseEvent);
                    }
                  }}
                  className="hover:opacity-75 font-bold cursor-pointer ml-0.5"
                  title="Hapus"
                >
                  &times;
                </span>
              </span>
            ))
          )}
          {selectedIds.length > 3 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)]">
              +{selectedIds.length - 3} lainnya
            </span>
          )}
        </div>
        <span className="text-[var(--text-muted)] text-[10px] shrink-0 font-mono">
          {isOpen ? "&#9650;" : "&#9660;"}
        </span>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xl overflow-hidden p-2.5 space-y-2 animate-in fade-in duration-100 max-w-full sm:max-w-md">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full min-h-10 px-3 py-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-navy)]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] px-1">
            <span>
              {filteredItems.length} dari {items.length} opsi tersedia
            </span>
            <span className="font-mono text-[10px]">Klik untuk pilih banyak</span>
          </div>

          <div
            role="listbox"
            aria-multiselectable="true"
            className="max-h-56 overflow-y-auto space-y-1 pr-1 text-xs"
          >
            {filteredItems.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">
                Tidak ada data yang cocok dengan &quot;{searchTerm}&quot;
              </p>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleItem(item.id)}
                    className={`min-h-9 px-2.5 py-1.5 rounded-md cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? "bg-[var(--accent-navy)] text-white font-semibold"
                        : "hover:bg-[var(--bg-subtle)] text-[var(--text-primary)]"
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="font-mono text-xs shrink-0">
                      {isSelected ? "&#10003;" : ""}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">
              {selectedIds.length} item dipilih
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="min-h-9 px-3 py-1 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs font-semibold cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function VacancyExplorer() {
  const [cities, setCities] = useState<City[]>([]);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
  const [masterLoading, setMasterLoading] = useState(true);
  const [masterError, setMasterError] = useState<string | null>(null);

  // Filters State
  const [keyword, setKeyword] = useState("");
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [selectedProdiIds, setSelectedProdiIds] = useState<string[]>([]);
  const [selectedEduLevels, setSelectedEduLevels] = useState<string[]>([]);
  const [selectedInterviewTypes, setSelectedInterviewTypes] = useState<string[]>([]);
  const [isDisabilityOnly, setIsDisabilityOnly] = useState(false);
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);

  // Vacancy Data State
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Saved Vacancies
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
    setMasterLoading(true);
    fetchMasterData()
      .then((res) => {
        setCities(res.cities);
        setStudyPrograms(res.studyPrograms);
        setMasterError(null);
      })
      .catch((err) => {
        setMasterError(
          err instanceof Error
            ? err.message
            : "Gagal memuat master data kota & program studi."
        );
      })
      .finally(() => {
        setMasterLoading(false);
      });
  }, []);

  const fetchVacancies = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchKemnakerVacancies({
          keyword,
          cityIds: selectedCityIds,
          studyProgramIds: selectedProdiIds,
          educationLevels: selectedEduLevels,
          interviewTypes: selectedInterviewTypes,
          isDisabilityFriendly: isDisabilityOnly,
          sortBy,
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
      selectedCityIds,
      selectedProdiIds,
      selectedEduLevels,
      selectedInterviewTypes,
      isDisabilityOnly,
      sortBy,
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
    setSelectedCityIds([]);
    setSelectedProdiIds([]);
    setSelectedEduLevels([]);
    setSelectedInterviewTypes([]);
    setIsDisabilityOnly(false);
    setSortBy("created_at_desc");
    setShowSavedOnly(false);
    setPage(1);
  };

  const toggleEduLevel = (val: string) => {
    setSelectedEduLevels((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
    setPage(1);
  };

  const toggleInterviewType = (val: string) => {
    setSelectedInterviewTypes((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
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

  const activeFiltersCount =
    (keyword ? 1 : 0) +
    selectedCityIds.length +
    selectedProdiIds.length +
    selectedEduLevels.length +
    selectedInterviewTypes.length +
    (isDisabilityOnly ? 1 : 0) +
    (sortBy !== "created_at_desc" ? 1 : 0);

  const displayedList = showSavedOnly ? savedVacancies : vacancies;

  return (
    <div className="space-y-6">
      {/* Search & Filter Panel */}
      <form
        onSubmit={handleSearchSubmit}
        className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 sm:p-5 space-y-4 shadow-xs"
      >
        {/* Top Search Bar */}
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
              placeholder="Contoh: Frontend, Staff Administrasi, Puskesmas, Rumah Sakit, BUMN"
              className="w-full min-h-11 px-3.5 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-navy)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-11 px-5 py-2.5 rounded-lg bg-[var(--accent-navy)] hover:bg-[var(--accent-navy-hover)] text-white text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? "Memuat Lowongan..." : "Cari Lowongan"}
          </button>
          <button
            type="button"
            onClick={() => setShowSavedOnly((prev) => !prev)}
            className={`min-h-11 px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-bold cursor-pointer transition-colors shrink-0 ${
              showSavedOnly
                ? "bg-[var(--status-emerald-soft)] border-[var(--status-emerald)] text-[var(--status-emerald)]"
                : "bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-primary)]"
            }`}
          >
            Tersimpan ({savedVacancies.length})
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wider shrink-0">
            Preset Cepat:
          </span>
          <button
            type="button"
            onClick={() => {
              setSortBy("total_applications_asc");
              setPage(1);
            }}
            className={`min-h-8 px-2.5 py-1 rounded-md border text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              sortBy === "total_applications_asc"
                ? "bg-[var(--status-emerald)] text-white border-[var(--status-emerald)]"
                : "bg-[var(--bg-canvas)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            Peluang Emas (Pelamar Sedikit)
          </button>
          <button
            type="button"
            onClick={() => {
              toggleInterviewType("online");
            }}
            className={`min-h-8 px-2.5 py-1 rounded-md border text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              selectedInterviewTypes.includes("online")
                ? "bg-[var(--status-sky)] text-white border-[var(--status-sky)]"
                : "bg-[var(--bg-canvas)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            Wawancara Online
          </button>
          <button
            type="button"
            onClick={() => {
              setIsDisabilityOnly((prev) => !prev);
              setPage(1);
            }}
            className={`min-h-8 px-2.5 py-1 rounded-md border text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              isDisabilityOnly
                ? "bg-[var(--accent-amber)] text-white border-[var(--accent-amber)]"
                : "bg-[var(--bg-canvas)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            Ramah Disabilitas
          </button>
          <button
            type="button"
            onClick={() => toggleEduLevel("bachelor")}
            className={`min-h-8 px-2.5 py-1 rounded-md border text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              selectedEduLevels.includes("bachelor")
                ? "bg-[var(--accent-navy)] text-white border-[var(--accent-navy)]"
                : "bg-[var(--bg-canvas)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            Sarjana (S1)
          </button>
          <button
            type="button"
            onClick={() => toggleEduLevel("diploma")}
            className={`min-h-8 px-2.5 py-1 rounded-md border text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              selectedEduLevels.includes("diploma")
                ? "bg-[var(--accent-navy)] text-white border-[var(--accent-navy)]"
                : "bg-[var(--bg-canvas)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            }`}
          >
            Diploma (D3/D4)
          </button>
        </div>

        {/* Primary Multi-Select Comboboxes: Prodi & Kota */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-default)]">
          <MultiSelectCombobox
            label="Filter Program Studi (Bisa Pilih Banyak)"
            placeholder={
              masterLoading
                ? "Memuat 1.738 daftar prodi..."
                : "Cari & pilih program studi..."
            }
            searchPlaceholder="Ketik nama prodi (misal: Informatika, Hukum, Akuntansi)..."
            items={studyPrograms}
            selectedIds={selectedProdiIds}
            onChange={(ids) => {
              setSelectedProdiIds(ids);
              setShowSavedOnly(false);
              setPage(1);
            }}
            badgeTone="sky"
          />

          <MultiSelectCombobox
            label="Filter Lokasi Kota / Kabupaten (Bisa Pilih Banyak)"
            placeholder={
              masterLoading
                ? "Memuat 515 daftar kota..."
                : "Cari & pilih kota / kabupaten..."
            }
            searchPlaceholder="Ketik nama kota (misal: Jakarta, Bandung, Surabaya, Medan)..."
            items={cities}
            selectedIds={selectedCityIds}
            onChange={(ids) => {
              setSelectedCityIds(ids);
              setShowSavedOnly(false);
              setPage(1);
            }}
            badgeTone="emerald"
          />
        </div>

        {/* Secondary Filter Controls: Jenjang, Wawancara, Urutan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[var(--border-default)]">
          {/* Jenjang Pendidikan Multi-Select */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              Jenjang Pendidikan (Multi-Select)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {EDU_OPTIONS.map((opt) => {
                const isSelected = selectedEduLevels.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleEduLevel(opt.value)}
                    className={`min-h-9 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[var(--accent-navy)] text-white border-[var(--accent-navy)]"
                        : "bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metode Wawancara Multi-Select */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-[var(--text-secondary)]">
              Metode Wawancara (Multi-Select)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {INTERVIEW_OPTIONS.map((opt) => {
                const isSelected = selectedInterviewTypes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleInterviewType(opt.value)}
                    className={`min-h-9 px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[var(--status-sky)] text-white border-[var(--status-sky)]"
                        : "bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urutan (Sort By) */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-sort-by"
              className="block text-xs font-semibold text-[var(--text-secondary)]"
            >
              Urutkan Lowongan Berdasarkan
            </label>
            <select
              id="filter-sort-by"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setShowSavedOnly(false);
                setPage(1);
              }}
              className="w-full min-h-11 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] cursor-pointer focus:outline-hidden focus:border-[var(--accent-navy)]"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {masterError && (
          <p className="text-xs text-[var(--status-rose)]">{masterError}</p>
        )}

        {/* Filter Summary & Reset Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-default)] text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              {showSavedOnly
                ? `Menampilkan ${savedVacancies.length} lowongan tersimpan di perangkat ini.`
                : `Ditemukan ${Number(meta.total || 0).toLocaleString(
                    "id-ID"
                  )} lowongan aktif di portal resmi Kemnaker.`}
            </span>
            {activeFiltersCount > 0 && !showSavedOnly && (
              <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-bold bg-[var(--status-sky-soft)] text-[var(--status-sky)] border border-[var(--status-sky)]">
                {activeFiltersCount} Filter Aktif
              </span>
            )}
          </div>

          {(activeFiltersCount > 0 || showSavedOnly) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="min-h-9 px-3 py-1 rounded-md text-xs font-bold text-[var(--status-rose)] hover:bg-[var(--status-rose-soft)] border border-[var(--status-rose)] cursor-pointer transition-colors"
            >
              Reset Semua Filter ({activeFiltersCount})
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
          <div className="inline-block w-6 h-6 border-2 border-[var(--accent-navy)] border-t-transparent rounded-full animate-spin mb-1" />
          <p className="text-sm font-bold">
            Mengambil data lowongan langsung dari api.kemnaker.go.id...
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Menghitung kuota formasi, total pendaftar, rasio kompetisi, dan skor peluang.
          </p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-10 text-center space-y-3">
          <p className="text-sm font-bold">
            {showSavedOnly
              ? "Belum ada lowongan yang Anda simpan."
              : "Tidak ada lowongan yang cocok dengan kriteria pencarian dan filter aktif."}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {showSavedOnly
              ? "Klik tombol Simpan pada kartu lowongan untuk memantau rasio persaingan posisi incaran Anda."
              : "Coba kurangi kombinasi filter multi-select atau klik Reset Semua Filter di atas."}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="min-h-11 px-4 py-2 rounded-lg bg-[var(--accent-navy)] text-white text-xs font-bold cursor-pointer"
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
              "bg-[var(--status-emerald-soft)] text-[var(--status-emerald)] border-[var(--status-emerald)]";
            if (ratioNum !== null) {
              if (ratioNum > 15) {
                densityLabel = "Persaingan Ketat";
                densityTone =
                  "bg-[var(--status-rose-soft)] text-[var(--status-rose)] border-[var(--status-rose)]";
              } else if (ratioNum > 5) {
                densityLabel = "Persaingan Sedang";
                densityTone =
                  "bg-[var(--accent-amber-soft)] text-[var(--accent-amber)] border-[var(--accent-amber)]";
              } else if (ratioNum > 1) {
                densityLabel = "Peluang Terbuka";
                densityTone =
                  "bg-[var(--status-sky-soft)] text-[var(--status-sky)] border-[var(--status-sky)]";
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
                      <span className="text-xs font-bold text-[var(--accent-navy)] block truncate">
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
                      className={`min-h-11 px-3 py-1.5 rounded-lg border text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                        isSaved
                          ? "bg-[var(--status-emerald-soft)] border-[var(--status-emerald)] text-[var(--status-emerald)]"
                          : "bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                      }`}
                    >
                      {isSaved ? "Tersimpan" : "Simpan"}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    {v.city?.name && (
                      <span className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                        {v.city.name}
                      </span>
                    )}
                    {Array.isArray(v.education_levels) &&
                      v.education_levels.map((edu) => (
                        <span
                          key={edu}
                          className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-default)] capitalize"
                        >
                          {edu}
                        </span>
                      ))}
                    {v.is_disability_friendly && (
                      <span className="px-2 py-0.5 rounded bg-[var(--accent-amber-soft)] border border-[var(--accent-amber)] text-[var(--accent-amber)] font-medium">
                        Disabilitas
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                    <strong className="text-[var(--text-primary)]">Prodi:</strong>{" "}
                    {prodiNames}
                  </p>

                  {/* Competition & Quota Metrics */}
                  <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)] font-semibold">
                        Analisis Persaingan
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${densityTone}`}
                      >
                        {densityLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="p-1 rounded bg-[var(--bg-surface)] border border-[var(--border-default)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">
                          Pelamar
                        </span>
                        <strong className="text-xs sm:text-sm font-mono">
                          {applicants.toLocaleString("id-ID")}
                        </strong>
                      </div>
                      <div className="p-1 rounded bg-[var(--bg-surface)] border border-[var(--border-default)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">
                          Kuota
                        </span>
                        <strong className="text-xs sm:text-sm font-mono">
                          {quota} kursi
                        </strong>
                      </div>
                      <div className="p-1 rounded bg-[var(--bg-surface)] border border-[var(--border-default)]">
                        <span className="text-[10px] text-[var(--text-muted)] block">
                          Rasio
                        </span>
                        <strong className="text-xs sm:text-sm font-mono">
                          {ratioNum !== null ? `${ratioNum.toFixed(1)}x` : "-"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-default)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVacancy(v)}
                    className="min-h-11 flex-1 px-3 py-2 rounded-lg bg-[var(--accent-navy)] text-white hover:bg-[var(--accent-navy-hover)] text-xs font-bold cursor-pointer transition-colors"
                  >
                    Detail &amp; Silabus
                  </button>
                  <a
                    href={`https://maganghub.kemnaker.go.id/magang-nasional/lowongan/${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-11 px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    Portal Resmi
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!showSavedOnly && meta.last_page > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--border-default)]">
          <p className="text-xs text-[var(--text-secondary)]">
            Halaman <strong className="font-mono">{meta.current_page}</strong> dari{" "}
            <strong className="font-mono">{meta.last_page}</strong> (Total{" "}
            <strong className="font-mono">
              {Number(meta.total || 0).toLocaleString("id-ID")}
            </strong>{" "}
            lowongan)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-11 px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-xs font-bold cursor-pointer disabled:opacity-40 transition-colors"
            >
              &larr; Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= meta.last_page || loading}
              onClick={() => setPage((p) => p + 1)}
              className="min-h-11 px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-xs font-bold cursor-pointer disabled:opacity-40 transition-colors"
            >
              Selanjutnya &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <VacancyDetailModal
        vacancy={selectedVacancy}
        isOpen={Boolean(selectedVacancy)}
        onClose={() => setSelectedVacancy(null)}
      />
    </div>
  );
}

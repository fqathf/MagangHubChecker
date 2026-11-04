"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { EnrichedApplication, SavedAccount } from "@/lib/types";

interface ApplicationInspectorProps {
  accounts: SavedAccount[];
  activeAccountId: string | null;
  onSelectAccount: (id: string) => void;
  onOpenAuthModal: () => void;
  onRefreshAccount: (account: SavedAccount) => Promise<void>;
  onDeleteAccount: (id: string) => void;
  refreshing: boolean;
  refreshError: string | null;
}

const FLAG_LABELS: Record<string, string> = {
  is_accredited_graduate: "Lulusan Perguruan Tinggi Terakreditasi",
  isAccreditedGraduate: "Lulusan Perguruan Tinggi Terakreditasi",
  is_fresh_graduate: "Fresh Graduate (Sesuai Batas Kelulusan)",
  isFreshGraduate: "Fresh Graduate (Sesuai Batas Kelulusan)",
  is_data_verified: "Data Terverifikasi PDDIKTI & Dukcapil",
  isDataVerified: "Data Terverifikasi PDDIKTI & Dukcapil",
  has_not_joined_program: "Belum Pernah Mengikuti Magang Nasional",
  hasNotJoinedProgram: "Belum Pernah Mengikuti Magang Nasional",
};

const QUESTIONNAIRE_LABELS: Record<string, string> = {
  fakeIdentity: "Pernah menggunakan identitas palsu / keterangan tidak benar",
  fake_identity: "Pernah menggunakan identitas palsu / keterangan tidak benar",
  bannedOrganization: "Pernah menjadi anggota organisasi terlarang",
  banned_organization: "Pernah menjadi anggota organisasi terlarang",
  legalInvolvement: "Pernah terlibat permasalahan hukum",
  legal_involvement: "Pernah terlibat permasalahan hukum",
  hoaxSpread: "Pernah menyebarkan hoaks / ujaran kebencian",
  hoax_spread: "Pernah menyebarkan hoaks / ujaran kebencian",
  socialMediaComplaint: "Suka mengungkapkan ketidaknyamanan di media sosial",
  social_media_complaint: "Suka mengungkapkan ketidaknyamanan di media sosial",
};

function formatDateTime(val: string | null | undefined): string {
  if (!val) return "Belum tercatat";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getToneClasses(tone: EnrichedApplication["analysis"]["statusTone"]) {
  switch (tone) {
    case "emerald":
      return "bg-[var(--status-emerald-soft)] text-[var(--status-emerald)] border-[var(--status-emerald)]";
    case "amber":
      return "bg-[var(--accent-amber-soft)] text-[var(--accent-amber)] border-[var(--accent-amber)]";
    case "sky":
      return "bg-[var(--status-sky-soft)] text-[var(--status-sky)] border-[var(--status-sky)]";
    case "rose":
      return "bg-[var(--status-rose-soft)] text-[var(--status-rose)] border-[var(--status-rose)]";
    default:
      return "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-strong)]";
  }
}

export function ApplicationInspector({
  accounts,
  activeAccountId,
  onSelectAccount,
  onOpenAuthModal,
  onRefreshAccount,
  onDeleteAccount,
  refreshing,
  refreshError,
}: ApplicationInspectorProps) {
  const rawModalTitleId = useId();
  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === activeAccountId) || accounts[0] || null,
    [accounts, activeAccountId]
  );

  const [batchFilter, setBatchFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [rawModalApp, setRawModalApp] = useState<EnrichedApplication | null>(
    null
  );
  const [showProfileRaw, setShowProfileRaw] = useState(false);

  useEffect(() => {
    if (!rawModalApp && !showProfileRaw) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRawModalApp(null);
        setShowProfileRaw(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rawModalApp, showProfileRaw]);

  const applications = activeAccount?.applications || [];
  const participant = activeAccount?.participant || null;

  const batchList = useMemo(() => {
    const nums = new Set<string>();
    for (const app of applications) {
      if (app.batch_number != null) nums.add(String(app.batch_number));
    }
    return Array.from(nums).sort();
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (batchFilter !== "ALL" && String(app.batch_number) !== batchFilter) {
        return false;
      }
      if (statusFilter === "SIGNAL") {
        return (
          app.analysis.isEarlySignal ||
          app.analysis.hasPostInterviewActivity ||
          app.status === "determined"
        );
      }
      if (statusFilter === "INTERVIEW") {
        return Boolean(app.interview);
      }
      if (statusFilter !== "ALL" && app.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [applications, batchFilter, statusFilter]);

  const stats = useMemo(() => {
    let determinedCount = 0;
    let earlySignalCount = 0;
    let postInterviewCount = 0;
    let interviewCount = 0;

    for (const app of applications) {
      if (app.status === "determined" || app.determined_at) determinedCount++;
      if (app.analysis.isEarlySignal) earlySignalCount++;
      if (app.analysis.hasPostInterviewActivity) postInterviewCount++;
      if (app.interview) interviewCount++;
    }

    return {
      total: applications.length,
      determinedCount,
      earlySignalCount,
      postInterviewCount,
      interviewCount,
    };
  }, [applications]);

  if (!activeAccount) {
    return (
      <section
        aria-label="Status Lamaran Kosong"
        className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-6 sm:p-10 text-center space-y-4"
      >
        <div className="w-12 h-12 mx-auto rounded-lg bg-[var(--brand-soft)] text-[var(--brand-primary)] flex items-center justify-center">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="max-w-lg mx-auto space-y-2">
          <h2 className="text-lg sm:text-xl font-extrabold">
            Belum Ada Sesi Akun SIAPkerja yang Dihubungkan
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Untuk memeriksa status lamaran, mendeteksi field{" "}
            <code className="font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)]">
              selected_at
            </code>{" "}
            (sinyal lolos seleksi mitra), jejak pembaruan pasca-wawancara (
            <code className="font-mono px-1.5 py-0.5 rounded bg-[var(--bg-subtle)]">
              updated_at
            </code>
            ), serta verifikasi PDDIKTI, hubungkan Bearer Token atau akun SIAPkerja Anda.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="min-h-11 px-6 py-2.5 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-on-primary)] text-sm font-bold cursor-pointer"
          >
            Hubungkan Sesi SIAPkerja / Tempel Token
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Multi-Account Control Bar */}
      <section
        aria-label="Manajemen Akun Tersimpan"
        className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
          <label
            htmlFor="saved-account-select"
            className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] shrink-0"
          >
            Akun Aktif:
          </label>
          <select
            id="saved-account-select"
            value={activeAccount.id}
            onChange={(e) => onSelectAccount(e.target.value)}
            className="min-h-11 px-3.5 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-sm font-bold text-[var(--text-primary)] cursor-pointer max-w-full sm:max-w-xs"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.label} ({acc.emailOrNik})
              </option>
            ))}
          </select>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Sinkron terakhir: {formatDateTime(activeAccount.lastSyncedAt)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onRefreshAccount(activeAccount)}
            disabled={refreshing}
            className="min-h-11 px-4 py-2 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-on-primary)] text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            {refreshing ? "Menyinkronkan ke API..." : "Sinkronkan Ulang"}
          </button>
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="min-h-11 px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-xs sm:text-sm font-bold text-[var(--text-primary)] cursor-pointer"
          >
            + Tambah Akun Lain
          </button>
          <button
            type="button"
            onClick={() => onDeleteAccount(activeAccount.id)}
            disabled={refreshing}
            className="min-h-11 px-3.5 py-2 rounded-lg border border-[var(--status-rose)] bg-[var(--status-rose-soft)] text-[var(--status-rose)] text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            Hapus Sesi
          </button>
        </div>
      </section>

      {refreshError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[var(--status-rose-soft)] border border-[var(--status-rose)] text-[var(--status-rose)] text-xs sm:text-sm font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <span>{refreshError}</span>
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="min-h-11 px-4 py-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] text-xs font-bold shrink-0 cursor-pointer"
          >
            Perbarui Token Sesi
          </button>
        </div>
      )}

      {/* Real Metrics Summary Bar */}
      <section
        aria-label="Ringkasan Status Lamaran"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <span className="text-xs font-semibold text-[var(--text-secondary)] block">
            Total Lamaran Tercatat
          </span>
          <span className="text-2xl font-extrabold font-mono mt-1 block">
            {stats.total}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <span className="text-xs font-semibold text-[var(--text-secondary)] block">
            Sinyal Dini (selected_at)
          </span>
          <span className="text-2xl font-extrabold font-mono text-[var(--status-emerald)] mt-1 block">
            {stats.earlySignalCount}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <span className="text-xs font-semibold text-[var(--text-secondary)] block">
            Update Pasca-Wawancara
          </span>
          <span className="text-2xl font-extrabold font-mono text-[var(--accent-amber)] mt-1 block">
            {stats.postInterviewCount}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <span className="text-xs font-semibold text-[var(--text-secondary)] block">
            Ditetapkan Resmi (SK)
          </span>
          <span className="text-2xl font-extrabold font-mono text-[var(--brand-primary)] mt-1 block">
            {stats.determinedCount}
          </span>
        </div>
      </section>

      {/* Participant & PDDIKTI Verification Card */}
      {participant && (
        <section
          aria-label="Profil Peserta dan Verifikasi PDDIKTI"
          className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3.5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold">
                  {participant.name || "Profil Peserta"}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                    participant.is_eligible
                      ? "bg-[var(--status-emerald-soft)] text-[var(--status-emerald)] border-[var(--status-emerald)]"
                      : "bg-[var(--accent-amber-soft)] text-[var(--accent-amber)] border-[var(--accent-amber)]"
                  }`}
                >
                  {participant.is_eligible
                    ? "Eligible Magang Nasional"
                    : `Status: ${participant.status || "Perlu Verifikasi"}`}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {participant.pddikti_verification?.university_name ||
                  "Perguruan Tinggi belum terdata"}{" "}
                •{" "}
                {participant.pddikti_verification?.study_program ||
                  "Program Studi belum terdata"}{" "}
                {participant.pddikti_verification?.graduation_date
                  ? `• Lulus: ${new Date(
                      participant.pddikti_verification.graduation_date
                    ).toLocaleDateString("id-ID")}`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowProfileRaw(true)}
              className="min-h-11 px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] text-xs font-mono font-bold text-[var(--text-primary)] cursor-pointer self-start sm:self-auto"
            >
              JSON /participants/me
            </button>
          </div>

          {participant.eligibility_flags &&
            Object.keys(participant.eligibility_flags).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {Object.entries(participant.eligibility_flags).map(
                  ([flagKey, flagVal]) => (
                    <div
                      key={flagKey}
                      className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-medium">
                        {FLAG_LABELS[flagKey] || flagKey}
                      </span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded ${
                          flagVal
                            ? "bg-[var(--status-emerald-soft)] text-[var(--status-emerald)]"
                            : "bg-[var(--status-rose-soft)] text-[var(--status-rose)]"
                        }`}
                      >
                        {flagVal ? "YA" : "TIDAK"}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
        </section>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-extrabold">
          Daftar Riwayat & Sinyal Lamaran ({filteredApplications.length})
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="filter-batch" className="sr-only">
            Filter Batch
          </label>
          <select
            id="filter-batch"
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="min-h-11 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] cursor-pointer"
          >
            <option value="ALL">Semua Batch</option>
            {batchList.map((b) => (
              <option key={b} value={b}>
                Batch {b}
              </option>
            ))}
          </select>

          <label htmlFor="filter-status" className="sr-only">
            Filter Status
          </label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-11 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] cursor-pointer"
          >
            <option value="ALL">Semua Status ({applications.length})</option>
            <option value="SIGNAL">
              Sinyal Dini / Diusulkan / Ditetapkan
            </option>
            <option value="INTERVIEW">Ada Jadwal Wawancara</option>
            <option value="submitted">Menunggu Seleksi (submitted)</option>
            <option value="selection">Sedang Diseleksi (selection)</option>
            <option value="determined">Ditetapkan (determined)</option>
            <option value="rejected">Belum Terpilih (rejected)</option>
            <option value="canceled">Dibatalkan (canceled)</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-8 text-center space-y-2">
          <p className="text-sm font-bold">
            {applications.length === 0
              ? "Akun ini belum mengirim lamaran di MagangHub."
              : "Tidak ada lamaran yang sesuai dengan filter yang dipilih."}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {applications.length === 0
              ? "Silakan buka tab Eksplorasi Lowongan untuk mencari posisi magang yang sedang dibuka."
              : "Ubah filter Batch atau Status di atas untuk menampilkan seluruh riwayat lamaran."}
          </p>
          {applications.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setBatchFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="min-h-11 px-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] text-xs font-bold cursor-pointer mt-2"
            >
              Reset Filter Lamaran
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const toneClass = getToneClasses(app.analysis.statusTone);
            const hasMeetingLink =
              app.interview?.location &&
              /^https?:\/\//i.test(app.interview.location);

            return (
              <article
                key={app.id}
                className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-5 space-y-4 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[var(--border-default)] pb-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border ${toneClass}`}
                      >
                        {app.analysis.statusLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs font-mono font-semibold">
                        raw: {app.status}
                      </span>
                      {app.batch_number && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs font-semibold">
                          Batch {app.batch_number} ({app.cohort_year})
                        </span>
                      )}
                      {app.analysis.daysUntilAnnouncement !== null && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--brand-soft)] text-[var(--brand-primary)] text-xs font-mono font-bold">
                          {app.analysis.daysUntilAnnouncement > 0
                            ? `H-${app.analysis.daysUntilAnnouncement} Pengumuman`
                            : "Periode Pengumuman"}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold pt-1 break-words">
                      {app.position_name}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--text-secondary)]">
                      {app.company_name}{" "}
                      {app.location ? `• ${app.location}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {app.vacancy_id && (
                      <a
                        href={`https://maganghub.kemnaker.go.id/magang-nasional/lowongan/${app.vacancy_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-11 inline-flex items-center px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-xs font-bold"
                      >
                        Buka Lowongan
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setRawModalApp(app)}
                      className="min-h-11 px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-xs font-mono font-bold cursor-pointer"
                    >
                      Inspeksi JSON
                    </button>
                  </div>
                </div>

                {/* Signal Banner (selected_at / post-interview updated_at / determined) */}
                {app.analysis.signalHeadline && (
                  <div
                    className={`p-4 rounded-lg border ${
                      app.analysis.isEarlySignal || app.status === "determined"
                        ? "bg-[var(--status-emerald-soft)] border-[var(--status-emerald)] text-[var(--status-emerald)]"
                        : "bg-[var(--accent-amber-soft)] border-[var(--accent-amber)] text-[var(--accent-amber)]"
                    } space-y-1`}
                  >
                    <p className="text-xs sm:text-sm font-extrabold">
                      {app.analysis.signalHeadline}
                    </p>
                    <p className="text-xs leading-relaxed text-[var(--text-primary)]">
                      {app.analysis.signalDescription}
                    </p>
                  </div>
                )}

                {/* Interview Schedule */}
                {app.interview && (
                  <div className="p-4 rounded-lg bg-[var(--status-sky-soft)] border border-[var(--status-sky)] space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--status-sky)] block">
                          Jadwal Wawancara Tercatat
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mt-0.5">
                          Waktu:{" "}
                          {formatDateTime(
                            app.interview.scheduled_at ||
                              app.interview.scheduledAt
                          )}{" "}
                          • Metode:{" "}
                          {app.interview.method === "online"
                            ? "Daring (Online)"
                            : "Tatap Muka (Onsite)"}
                        </p>
                      </div>
                      {hasMeetingLink && (
                        <a
                          href={app.interview.location!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-11 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-[var(--brand-on-primary)] text-xs font-bold shrink-0"
                        >
                          Buka Tautan Wawancara
                        </a>
                      )}
                    </div>
                    {app.interview.location && !hasMeetingLink && (
                      <p className="text-xs text-[var(--text-primary)]">
                        <strong>Lokasi Wawancara:</strong>{" "}
                        {app.interview.location}
                      </p>
                    )}
                    {app.interview.note && (
                      <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] whitespace-pre-wrap">
                        <strong>Catatan Penyelenggara:</strong>{" "}
                        {app.interview.note}
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection Reason or Determination Note */}
                {app.rejection_reason && (
                  <div className="p-4 rounded-lg bg-[var(--status-rose-soft)] border border-[var(--status-rose)] space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--status-rose)] block">
                      Catatan Penolakan (rejection_reason)
                    </span>
                    <p className="text-xs sm:text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                      {app.rejection_reason}
                    </p>
                  </div>
                )}

                {app.determination_note && (
                  <div className="p-4 rounded-lg bg-[var(--status-emerald-soft)] border border-[var(--status-emerald)] space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--status-emerald)] block">
                      Catatan Penetapan (determination_note)
                    </span>
                    <p className="text-xs sm:text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                      {app.determination_note}
                    </p>
                  </div>
                )}

                {app.cancellation_reason && (
                  <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs">
                    <strong>Alasan Pembatalan:</strong>{" "}
                    {app.cancellation_reason} (Dibatalkan:{" "}
                    {formatDateTime(app.canceled_at)})
                  </div>
                )}

                {/* Audit Trail Timestamps */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono block">
                      submitted_at
                    </span>
                    <span className="font-semibold mt-0.5 block">
                      {formatDateTime(app.submitted_at)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono block">
                      updated_at
                    </span>
                    <span className="font-semibold mt-0.5 block">
                      {formatDateTime(app.updated_at)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono block">
                      selected_at
                    </span>
                    <span
                      className={`font-semibold mt-0.5 block ${
                        app.selected_at
                          ? "text-[var(--status-emerald)] font-bold"
                          : ""
                      }`}
                    >
                      {formatDateTime(app.selected_at)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono block">
                      determined_at
                    </span>
                    <span
                      className={`font-semibold mt-0.5 block ${
                        app.determined_at
                          ? "text-[var(--brand-primary)] font-bold"
                          : ""
                      }`}
                    >
                      {formatDateTime(app.determined_at)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                    <span className="text-[11px] text-[var(--text-secondary)] font-mono block">
                      determination_date
                    </span>
                    <span className="font-semibold mt-0.5 block">
                      {app.selection_announcement_date
                        ? new Date(
                            app.selection_announcement_date
                          ).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Belum dijadwalkan"}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Raw JSON Application Modal */}
      {rawModalApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby={rawModalTitleId}
          onClick={(e) => {
            if (e.target === e.currentTarget) setRawModalApp(null);
          }}
        >
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xl text-[var(--text-primary)] overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-default)] px-5 py-4">
              <div>
                <h3 id={rawModalTitleId} className="text-base font-bold">
                  Payload JSON Asli: {rawModalApp.position_name}
                </h3>
                <p className="text-xs font-mono text-[var(--text-secondary)]">
                  ID Lamaran: {rawModalApp.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRawModalApp(null)}
                aria-label="Tutup inspector JSON"
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {rawModalApp.questionnaire_answers && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Jawaban Kuesioner Saat Melamar
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(rawModalApp.questionnaire_answers).map(
                      ([k, v]) => (
                        <div
                          key={k}
                          className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-between gap-3 text-xs"
                        >
                          <span>{QUESTIONNAIRE_LABELS[k] || k}</span>
                          <span className="font-mono font-bold">
                            {v ? "Ya" : "Tidak"}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Objek JSON Mentah dari /maganghub/recruitment/v2/applications/me
                </h4>
                <pre className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs font-mono overflow-x-auto">
                  {JSON.stringify(rawModalApp.raw, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw JSON Participant Profile Modal */}
      {showProfileRaw && participant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label="Payload JSON Profil Peserta"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProfileRaw(false);
          }}
        >
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xl text-[var(--text-primary)] overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-default)] px-5 py-4">
              <h3 className="text-base font-bold">
                Payload JSON Asli: /maganghub/onboarding/v2/participants/me
              </h3>
              <button
                type="button"
                onClick={() => setShowProfileRaw(false)}
                aria-label="Tutup JSON profil"
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <pre className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs font-mono overflow-x-auto">
                {JSON.stringify(participant.raw, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { ApplicationInspector } from "@/components/ApplicationInspector";
import { AuthModal } from "@/components/AuthModal";
import { VacancyExplorer } from "@/components/VacancyExplorer";
import { EnrichedApplication, ParticipantProfile, SavedAccount } from "@/lib/types";
import { fetchSiapkerjaSession } from "@/lib/kemnaker-client";

const ACCOUNTS_STORAGE_KEY = "mhc_saved_accounts_v1";
const ACTIVE_ACCOUNT_KEY = "mhc_active_account_id_v1";
const THEME_STORAGE_KEY = "mhc_theme_v1";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"applications" | "vacancies">("applications");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      } else {
        document.documentElement.setAttribute("data-theme", "light");
      }

      const rawAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (rawAccounts) {
        const parsed = JSON.parse(rawAccounts);
        if (Array.isArray(parsed)) {
          setAccounts(parsed);
          const savedActive = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
          if (savedActive && parsed.some((a: SavedAccount) => a.id === savedActive)) {
            setActiveAccountId(savedActive);
          } else if (parsed.length > 0) {
            setActiveAccountId(parsed[0].id);
          }
        }
      }
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
  };

  const saveAccountsToStorage = (nextAccounts: SavedAccount[], nextActiveId: string | null) => {
    setAccounts(nextAccounts);
    setActiveAccountId(nextActiveId);
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(nextAccounts));
      if (nextActiveId) {
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, nextActiveId);
      } else {
        localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
      }
    } catch {}
  };

  const handleSelectAccount = (id: string) => {
    setActiveAccountId(id);
    setRefreshError(null);
    try {
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, id);
    } catch {}
  };

  const handleAuthSuccess = (payload: {
    label: string;
    emailOrNik: string;
    token: string;
    participant: ParticipantProfile | null;
    applications: EnrichedApplication[];
    syncedAt: string;
  }) => {
    const existingIndex = accounts.findIndex(
      (a) =>
        (payload.participant?.id && a.participant?.id === payload.participant.id) ||
        (payload.emailOrNik && a.emailOrNik.toLowerCase() === payload.emailOrNik.toLowerCase())
    );

    let nextAccounts: SavedAccount[];
    let targetId: string;

    if (existingIndex >= 0) {
      targetId = accounts[existingIndex].id;
      const updated: SavedAccount = {
        ...accounts[existingIndex],
        label: payload.label || accounts[existingIndex].label,
        emailOrNik: payload.emailOrNik || accounts[existingIndex].emailOrNik,
        token: payload.token,
        participant: payload.participant,
        applications: payload.applications,
        lastSyncedAt: payload.syncedAt,
      };
      nextAccounts = [...accounts];
      nextAccounts[existingIndex] = updated;
    } else {
      targetId = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newAcc: SavedAccount = {
        id: targetId,
        label: payload.label,
        emailOrNik: payload.emailOrNik,
        token: payload.token,
        participant: payload.participant,
        applications: payload.applications,
        lastSyncedAt: payload.syncedAt,
      };
      nextAccounts = [newAcc, ...accounts];
    }

    saveAccountsToStorage(nextAccounts, targetId);
    setIsAuthModalOpen(false);
    setActiveTab("applications");
    setRefreshError(null);
    showToast(
      `Berhasil menarik ${payload.applications.length} data lamaran untuk ${payload.label}.`
    );
  };

  const handleRefreshAccount = async (account: SavedAccount) => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const session = await fetchSiapkerjaSession(account.token);

      const updated: SavedAccount = {
        ...account,
        participant: session.participant || account.participant,
        applications: session.applications || [],
        lastSyncedAt: session.syncedAt,
      };

      const nextAccounts = accounts.map((a) => (a.id === account.id ? updated : a));
      saveAccountsToStorage(nextAccounts, account.id);
      showToast(`Sinkronisasi selesai (${updated.applications.length} lamaran diperbarui).`);
    } catch (err) {
      setRefreshError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyegarkan data."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteAccount = (id: string) => {
    const target = accounts.find((a) => a.id === id);
    const nextAccounts = accounts.filter((a) => a.id !== id);
    const nextActiveId =
      activeAccountId === id
        ? nextAccounts.length > 0
          ? nextAccounts[0].id
          : null
        : activeAccountId;
    saveAccountsToStorage(nextAccounts, nextActiveId);
    setRefreshError(null);
    if (target) {
      showToast(`Sesi akun "${target.label}" dihapus dari penyimpanan lokal.`);
    }
  };

  const totalEarlySignals = accounts.reduce(
    (sum, acc) =>
      sum + acc.applications.filter((app) => app.analysis.isEarlySignal).length,
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Telkom University Signature Top Red Highlight */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand-primary)] via-[var(--accent-amber)] to-[var(--brand-primary)]" />

      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/95 backdrop-blur-md shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
            {/* Brand & Identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] text-white flex items-center justify-center font-mono font-extrabold text-base tracking-tight shrink-0 shadow-sm border border-black/10">
                MH
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
                    MagangHub Inspector
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)]">
                    EDISI SMB TELKOM
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  Portal Inspeksi Seleksi &amp; Direktori Lowongan Magang Nasional Kemnaker RI
                </p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="min-h-11 px-4 py-2 rounded-lg text-xs font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>+ Hubungkan Akun SIAPkerja</span>
                {accounts.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/25 font-mono text-[10px] font-bold">
                    {accounts.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"
                }
                title={theme === "light" ? "Mode Gelap" : "Mode Terang"}
                className="min-h-11 min-w-11 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-secondary)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="font-mono text-xs font-bold">
                  {theme === "light" ? "DARK" : "LIGHT"}
                </span>
              </button>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav
            aria-label="Navigasi Workspace Utama"
            className="flex items-center gap-2 border-t border-[var(--border-default)] pt-2 pb-2 overflow-x-auto"
          >
            <button
              type="button"
              onClick={() => setActiveTab("applications")}
              aria-current={activeTab === "applications" ? "page" : undefined}
              className={`min-h-11 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "applications"
                  ? "bg-[var(--brand-primary)] text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              <span>Inspektor Status Lamaran</span>
              {accounts.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                    activeTab === "applications"
                      ? "bg-white/20 text-white"
                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]"
                  }`}
                >
                  {accounts.reduce((acc, item) => acc + item.applications.length, 0)}
                </span>
              )}
              {totalEarlySignals > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[var(--status-emerald)] text-white shadow-xs">
                  {totalEarlySignals} SINYAL
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("vacancies")}
              aria-current={activeTab === "vacancies" ? "page" : undefined}
              className={`min-h-11 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "vacancies"
                  ? "bg-[var(--brand-primary)] text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              <span>Eksplorasi Lowongan &amp; Kuota Live</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  activeTab === "vacancies"
                    ? "bg-white/20 text-white"
                    : "bg-[var(--brand-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)]"
                }`}
              >
                API RESMI KEMNAKER
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4"
        >
          <div className="p-3 rounded-lg border border-[var(--status-emerald)] bg-[var(--status-emerald-soft)] text-[var(--status-emerald)] text-xs font-medium flex items-center justify-between gap-3">
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="px-2 py-1 rounded hover:bg-black/5 font-mono text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "applications" ? (
          <ApplicationInspector
            accounts={accounts}
            activeAccountId={activeAccountId}
            onSelectAccount={handleSelectAccount}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onRefreshAccount={handleRefreshAccount}
            onDeleteAccount={handleDeleteAccount}
            refreshing={refreshing}
            refreshError={refreshError}
          />
        ) : (
          <VacancyExplorer />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <div>
            MagangHub Personal Inspector. Seluruh pemeriksaan berkomunikasi langsung dengan endpoint{" "}
            <code className="font-mono text-[var(--text-secondary)]">
              api.kemnaker.go.id
            </code>{" "}
            tanpa penyimpanan server pihak ketiga.
          </div>
          <div className="font-mono text-[11px]">
            100% Gratis &bull; Tanpa Paywall &bull; Lokal &amp; Privat
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

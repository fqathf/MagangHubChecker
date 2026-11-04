"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { EnrichedApplication, ParticipantProfile } from "@/lib/types";
import { fetchSiapkerjaSession } from "@/lib/kemnaker-client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payload: {
    label: string;
    emailOrNik: string;
    token: string;
    participant: ParticipantProfile | null;
    applications: EnrichedApplication[];
    syncedAt: string;
  }) => void;
}

const CONSOLE_SNIPPET = `copy(document.cookie.split('; ').find(r => r.startsWith('naco_access_token='))?.split('=')[1] || '')`;

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [label, setLabel] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(CONSOLE_SNIPPET);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 3000);
    } catch {
      setError("Gagal menyalin perintah otomatis. Silakan blok dan salin kode secara manual.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError("Silakan tempel token naco_access_token terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchSiapkerjaSession(tokenInput.trim());

      const resolvedName =
        label.trim() ||
        data.participant?.name ||
        data.participant?.email ||
        "Akun SIAPkerja";
      const resolvedIdentifier =
        data.participant?.email ||
        data.participant?.nik ||
        label.trim() ||
        "Sesi Bearer Token";

      onSuccess({
        label: resolvedName,
        emailOrNik: resolvedIdentifier,
        token: data.token,
        participant: data.participant,
        applications: data.applications,
        syncedAt: data.syncedAt,
      });

      setTokenInput("");
      setLabel("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memverifikasi token ke server Kemnaker."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <div>
            <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[var(--status-emerald)] block mb-1">
              Autentikasi Langsung (Lokal &amp; Privat)
            </span>
            <h2
              id={titleId}
              className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]"
            >
              Hubungkan Sesi SIAPkerja / MagangHub
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Token hanya disimpan di browser Anda (localStorage) dan dikirim langsung ke endpoint resmi Kemnaker RI.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Tutup dialog autentikasi"
            className="min-h-11 min-w-11 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-canvas)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors disabled:opacity-50"
          >
            &#x2715;
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Step by step guide */}
          <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                Panduan Mengambil Token naco_access_token:
              </span>
              <a
                href="https://maganghub.kemnaker.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[var(--status-sky)] hover:underline inline-flex items-center gap-1"
              >
                Buka Portal MagangHub &rarr;
              </a>
            </div>

            <ol className="text-xs space-y-2 text-[var(--text-secondary)] leading-relaxed list-decimal list-inside pl-1">
              <li>
                <strong className="text-[var(--text-primary)]">Login mandiri</strong> ke portal resmi Kemnaker di{" "}
                <code className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[11px]">
                  maganghub.kemnaker.go.id
                </code>{" "}
                menggunakan akun SIAPkerja Anda.
              </li>
              <li>
                Buka <strong className="text-[var(--text-primary)]">Chrome Developer Tools</strong> dengan menekan tombol{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[11px]">F12</kbd>{" "}
                (atau klik kanan pada halaman &rarr; pilih <em>Inspect / Periksa</em>).
              </li>
              <li>
                Pilih tab <strong className="text-[var(--text-primary)]">Application</strong> pada bilah atas DevTools (jika tidak terlihat, klik ikon panah ganda <kbd className="px-1 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[10px]">&gt;&gt;</kbd>).
              </li>
              <li>
                Di panel sisi kiri di bawah kelompok <strong className="text-[var(--text-primary)]">Storage</strong>, klik panah pada menu <strong className="text-[var(--text-primary)]">Cookies</strong> lalu klik{" "}
                <code className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[11px]">
                  https://maganghub.kemnaker.go.id
                </code>.
              </li>
              <li>
                Cari baris bernama <code className="px-1.5 py-0.5 rounded bg-[var(--accent-amber-soft)] text-[var(--accent-amber)] font-mono font-bold text-[11px]">naco_access_token</code>.
              </li>
              <li>
                Klik ganda kolom <strong className="text-[var(--text-primary)]">Value</strong> dan salin isinya (teks panjang yang berawalan <code className="font-mono text-[11px]">eyJ...</code>).
              </li>
            </ol>

            {/* Quick alternative snippet */}
            <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-[var(--text-muted)]">
                Opsi Cepat: Salin token otomatis melalui tab Console DevTools:
              </span>
              <button
                type="button"
                onClick={handleCopySnippet}
                className="px-2.5 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-[11px] font-mono font-semibold text-[var(--text-primary)] transition-colors inline-flex items-center gap-1.5"
              >
                {copiedSnippet ? "Tersalin ke Clipboard!" : "Salin Perintah Console"}
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="input-label"
                className="block text-xs font-semibold text-[var(--text-primary)]"
              >
                Label Akun (Opsional)
              </label>
              <input
                id="input-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Misal: Akun Utama / Akun Budi"
                className="w-full min-h-11 px-3.5 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-navy)]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="input-token"
                className="block text-xs font-semibold text-[var(--text-primary)]"
              >
                Nilai Cookie <code className="font-mono text-[var(--status-emerald)]">naco_access_token</code>
              </label>
              <textarea
                id="input-token"
                rows={3}
                required
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-navy)] resize-none"
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                Format otomatis dibersihkan jika menyertakan awalan &quot;naco_access_token=&quot; atau &quot;Bearer &quot;.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-lg border border-[var(--status-rose)] bg-[var(--status-rose-soft)] text-[var(--status-rose)] text-xs font-medium leading-relaxed"
              >
                {error}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="min-h-11 px-4 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-secondary)] transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="min-h-11 px-5 py-2 rounded-lg bg-[var(--accent-navy)] text-white hover:bg-[var(--accent-navy-hover)] text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memeriksa Sesi ke Kemnaker...</span>
                  </>
                ) : (
                  <span>Periksa Sesi &amp; Simpan Akun</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

# Design System: MagangHub Inspector (Unslop x Telkom University SMB Edition)

Dokumen ini mendefinisikan arah visual, palet warna, tipografi, dan implementasi metodologi `unslop` yang diselaraskan dengan identitas visual portal **Seleksi Mahasiswa Baru (SMB) Telkom University** ([smb.telkomuniversity.ac.id](https://smb.telkomuniversity.ac.id/)).

---

## 1. Direction (Metodologi Unslop)

- **Product:** Alat inspeksi status seleksi maganghub.kemnaker.go.id dan direktori eksplorasi lowongan magang nasional untuk mahasiswa dan fresh graduate.
- **Character:** *Akademik, presisi, berwibawa, dan tenang* (menghilangkan seluruh AI-slop: tanpa gradien ungu neon, tanpa glow artifisial, tanpa emoji berlebih).
- **World:** Portal penerimaan kampus dan verifikasi seleksi nasional, berlatar abu-abu netral sejuk (*slate neutral*) dengan aksen merah khas Telkom University.
- **Moments:**
  1. **Banner Sinyal Dini (`selected_at`)**: Penanda visual saat kandidat telah dipilih mitra sebelum SK penetapan Kemnaker diumumkan.
  2. **Analisis Rasio Formasi & Silabus Bulanan**: Kartu data bangku kuota dan kurikulum bulanan magang yang disajikan secara terstruktur.
- **Signature:** Garis highlight merah Telkom University di bilah navigasi atas dan kartu berbingkai tipis 1px dengan kontras tinggi.

---

## 2. Palet Warna (Telkom University Red & Clean Slate)

### Mode Terang (Light Mode)
- **Kanvas Utama (`--bg-canvas`):** `#F8FAFC` (Slate sejuk bernuansa portal akademik)
- **Permukaan Kartu (`--bg-surface`):** `#FFFFFF` (Putih murni)
- **Subtle Surface (`--bg-subtle`):** `#F1F5F9` (Abu-abu muda untuk kontrol dan input)
- **Elevated Surface (`--bg-elevated`):** `#E2E8F0`
- **Teks Utama (`--text-primary`):** `#0F172A` (Slate gelap pekat, kontras 15:1 terhadap putih)
- **Teks Sekunder (`--text-secondary`):** `#334155`
- **Teks Muted (`--text-muted`):** `#64748B`
- **Garis Batas (`--border-default`):** `#E2E8F0`
- **Aksen Merah Telkom (`--brand-primary` / `--accent-navy`):** `#B91C1C` (Telkom Crimson Red)
- **Hover Merah Telkom:** `#991B1B`
- **Soft Red Badge (`--brand-soft`):** `#FEF2F2` (dengan border `#FECACA`)

### Mode Gelap (Dark Mode)
- **Kanvas Utama (`--bg-canvas`):** `#090D16` (Obsidian slate netral)
- **Permukaan Kartu (`--bg-surface`):** `#111827`
- **Subtle Surface (`--bg-subtle`):** `#1E293B`
- **Teks Utama (`--text-primary`):** `#F8FAFC`
- **Teks Sekunder (`--text-secondary`):** `#CBD5E1`
- **Teks Muted (`--text-muted`):** `#94A3B8`
- **Garis Batas (`--border-default`):** `#1E293B`
- **Aksen Merah Telkom (`--brand-primary`):** `#EF4444` (Vibrant crimson dengan kontras tinggi)

---

## 3. Prinsip Unslopping yang Diterapkan

1. **Zero AI Slop Tells:** Tidak ada tombol ungu/violet, tidak ada teks gradien warna-warni, tidak ada efek blur/glow melayang, dan tidak ada emoji dekoratif pada label atau judul.
2. **Quiet Chrome:** Navigasi dan kontrol menggunakan neutral slate. Warna merah Telkom digunakan secara terukur untuk aksi utama dan identitas brand.
3. **Typography Rhythm:** Font keluarga sans-serif modern (`Plus Jakarta Sans`) dengan bobot 500 dan 700 yang proporsional, serta `JetBrains Mono` untuk angka numerik (`tabular-nums`), ID lamaran, dan payload JSON.
4. **Spacing 4px Grid:** Seluruh padding kartu (20px-24px), tinggi tombol (44px min-h-11), dan jarak antar elemen konsisten dengan ritme kelipatan 4.
5. **No Em-Dash Rule (R-02):** Bebas dari karakter tanda pisang em-dash (`-`) pada seluruh teks antarmuka.

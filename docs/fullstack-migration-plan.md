# HabitFuel — Rencana Migrasi ke Full-Stack

Status: **rencana disetujui — belum dieksekusi** (belum ada kode yang diubah)

> Semua keputusan arsitektur di bawah sudah final. Dokumen ini siap dipakai sebagai
> acuan saat eksekusi dimulai. Lihat [§0 Keputusan Final](#0-keputusan-final) untuk
> ringkasannya.

---

## 0. Keputusan Final

| #   | Pertanyaan                  | Keputusan                                  | Dampak                                                                                          |
| --- | --------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| 1   | Pakai Prisma?               | **Tidak.** `supabase-js` + generated types | Tidak ada server API. Akses Postgres langsung dari app, diamankan RLS                           |
| 2   | Format `Transaction.amount` | **Tetap `numeric(14,2)`**                  | Migrasi data lama 1:1 tanpa konversi. Butuh penanganan presisi di client (lihat §4)             |
| 3   | Mode guest?                 | **Tidak. Login wajib di depan**            | Tidak perlu anonymous auth & upgrade-flow. Semua data selalu punya `user_id`                    |
| 4   | Apple Developer account     | **Belum ada**                              | **Sign in with Apple ditunda.** Fase 2 kirim Google saja; Apple jadi Fase 2b sebelum submit iOS |

**Konsekuensi terbesar dari #4:** selama Apple Sign-In belum ada, aplikasi
**tidak bisa di-submit ke App Store**. Apple mewajibkan Sign in with Apple bila app
menyediakan login sosial pihak ketiga (Google). Jadi jalur rilis sementara adalah
**Android / Google Play lebih dulu**, iOS menyusul setelah akun Apple Developer aktif.

---

## 1. Kondisi Saat Ini

| Domain      | Hook                                      | Storage Key               | Bentuk Data                                                                   |
| ----------- | ----------------------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| Habits      | `use-habit-storage.ts`                    | `@habitfuel_habits`       | `{ habits: Habit[], completions: Record<habitId, Record<dateKey, boolean>> }` |
| Tasks       | `use-task-storage.ts`                     | `@habitfuel_tasks`        | `Task[]` (subtasks ter-embed)                                                 |
| Finance     | `use-finance-storage.ts`                  | `@habitfuel_transactions` | `Transaction[]`                                                               |
| Pomodoro    | `use-pomodoro-storage.ts`                 | `@habitfuel_pomodoro`     | `{ settings, records: Record<taskId, TaskPomodoroRecord> }`                   |
| Preferences | `use-nickname.tsx`, `use-color-scheme.ts` | `nickname`, theme         | scalar                                                                        |

**Keuntungan besar:** semua akses data sudah lewat Context Provider dengan API yang bersih
(`addHabit`, `toggleCompletion`, `getStats`, ...). Layar-layar tidak menyentuh AsyncStorage
secara langsung. Artinya backend bisa ditukar **tanpa menulis ulang UI**.

**Batasan sekarang:** data hilang saat uninstall, tidak bisa multi-device, tidak ada akun,
tidak ada backup.

---

## 2. Rekomendasi Stack

### Keputusan utama: **Supabase — tanpa server API sendiri, tanpa Prisma di runtime**

```
┌─────────────────────────────────────────────┐
│  Expo App (React Native)                    │
│                                             │
│  UI (Tamagui) ── tidak berubah              │
│      │                                      │
│  Context Providers ── API tetap sama        │
│      │                                      │
│  Repository layer  ← LAPISAN BARU           │
│      ├── SQLite lokal (source of truth UI)  │
│      └── Sync engine                        │
│              │                              │
└──────────────┼──────────────────────────────┘
               │ supabase-js (HTTPS + WS)
               ▼
┌─────────────────────────────────────────────┐
│  Supabase                                   │
│  • Auth (Google, Apple)                     │
│  • Postgres + Row Level Security            │
│  • Realtime (sync multi-device)             │
│  • Edge Functions (nanti, kalau perlu)      │
└─────────────────────────────────────────────┘
```

### Kenapa Supabase — dan catatan penting soal Prisma

Supabase: **ya, sangat cocok.** Auth + database + realtime + RLS dalam satu paket,
free tier memadai, dan tidak perlu maintain server.

Prisma: **tidak dipakai di aplikasi ini.**

> Prisma Client butuh Node.js runtime — **tidak bisa jalan di React Native**.
> Untuk memakai Prisma, wajib ada server API terpisah, yang artinya:
> setiap request jadi 2 hop (app → API → Postgres), kehilangan Realtime bawaan
> Supabase, kehilangan RLS sebagai lapisan keamanan, dan menambah satu layanan
> untuk di-deploy & dibayar.

Untuk aplikasi personal-productivity seperti HabitFuel yang **tidak punya logika bisnis
rahasia** (semua perhitungan streak/stats bisa jalan di client), server API tambahan
adalah biaya tanpa manfaat.

Sebagai gantinya, type-safety didapat gratis dari:

```bash
bunx supabase gen types typescript --project-id <id> > types/database.ts
```

Ini menghasilkan tipe TypeScript penuh untuk semua tabel — setara dengan `PrismaClient`,
tapi zero-runtime.

**Kapan Prisma jadi masuk akal?** Kalau nanti butuh: webhook pembayaran, integrasi AI
dengan API key rahasia, atau cron job berat. Saat itu tambahkan Supabase Edge Functions
dulu; kalau masih kurang, baru pertimbangkan API server terpisah.

### Alternatif yang dipertimbangkan

| Opsi                            | Verdict                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| **Supabase saja (rekomendasi)** | Paling cepat, RLS aman, realtime gratis, tidak ada server                                   |
| Supabase + Hono/Elysia + Prisma | Kontrol penuh, tapi +1 deploy, +latency, RLS jadi mubazir. Overkill sekarang                |
| Firebase                        | Auth bagus, tapi Firestore NoSQL — query agregat (heatmap, weekly stats) jadi ribet & mahal |
| Convex                          | DX bagus & realtime-first, tapi vendor lock-in lebih dalam dan bukan SQL                    |
| PocketBase self-host            | Murah, tapi harus urus VPS, backup, uptime sendiri                                          |

### Paket yang akan ditambahkan

```bash
# Backend & auth
bun add @supabase/supabase-js
bun add @react-native-google-signin/google-signin
bun expo install expo-secure-store

# Data & sync layer
bun add @tanstack/react-query @tanstack/react-query-persist-client

# Dev tooling
bun add -d supabase
```

Ditunda, dipasang saat fasenya tiba:

```bash
bun expo install expo-apple-authentication          # Fase 2b — butuh Apple Developer
bun expo install expo-sqlite                        # Fase 5 — opsional
bun add drizzle-orm && bun add -d drizzle-kit       # Fase 5 — ORM untuk SQLite lokal
```

**Catatan ORM:** `drizzle-orm` dipakai untuk **SQLite lokal** (cache offline), bukan untuk
Postgres. Akses Postgres tetap lewat `supabase-js`. Kalau ingin lebih sederhana di tahap
awal, Fase 5 (SQLite) bisa ditunda dan cukup pakai TanStack Query + AsyncStorage persister.

---

## 3. Prasyarat (harus disiapkan sebelum coding)

### Diperlukan sekarang (Fase 0–7)

| Item                         | Catatan                                                                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Akun Supabase + project baru | Pilih region terdekat (Singapore)                                                                                                                                |
| Google Cloud project         | Butuh 3 OAuth Client ID: iOS, Android (perlu SHA-1), dan **Web** (ini yang didaftarkan ke Supabase). Client ID iOS tetap dibuat sekarang meski rilis iOS ditunda |
| **EAS Development Build**    | Google Sign-In native **tidak jalan di Expo Go**. `eas.json` sudah ada, tinggal `eas build --profile development`                                                |
| Privacy Policy (URL publik)  | Wajib untuk review Google Play                                                                                                                                   |
| Fitur hapus akun             | Wajib bila app punya login — tetap dibangun sejak awal (lihat Fase 2)                                                                                            |

### Ditunda — diperlukan sebelum rilis iOS (Fase 2b)

| Item                           | Catatan                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Apple Developer Program**    | **$99/tahun. Belum dimiliki.** Blocker untuk Sign in with Apple sekaligus untuk submit App Store secara umum |
| Konfigurasi Sign in with Apple | Butuh App ID, Services ID, dan Key (.p8) dari Apple Developer portal                                         |

> **Jangan rencanakan rilis iOS dulu.** Tanpa Sign in with Apple, review App Store akan
> ditolak karena aplikasi menyediakan login Google. Fokuskan Fase 0–7 ke **Android /
> Google Play**; iOS cukup dijalankan lewat simulator/dev build lokal untuk development.

---

## 4. Desain Skema Database

Prinsip:

- Setiap tabel punya `user_id` → di-enforce lewat RLS
- `updated_at` + `deleted_at` (soft delete) di semua tabel → dibutuhkan untuk sync
- Struktur nested (`completions`, `subtasks`) di-normalisasi jadi tabel sendiri
- Semua ID pakai `uuid` (client bisa generate sendiri → optimistic insert tetap mulus)

```sql
-- ── Profil & preferensi ──────────────────────────────────────
profiles (
  id           uuid PK REFERENCES auth.users ON DELETE CASCADE,
  nickname     text,
  avatar_url   text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
)

user_preferences (
  user_id            uuid PK REFERENCES auth.users ON DELETE CASCADE,
  theme_setting      text CHECK (theme_setting IN ('light','dark','system')) DEFAULT 'system',
  updated_at         timestamptz DEFAULT now()
)

-- ── Habits ───────────────────────────────────────────────────
habits (
  id          uuid PK,
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  label       text NOT NULL,
  icon        text NOT NULL,
  icon_color  text NOT NULL,
  background  text NOT NULL,
  category    text NOT NULL CHECK (category IN ('health','productivity','personal','other')),
  sort_order  int DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
)

-- Hanya simpan baris untuk hari yang SELESAI.
-- toggle = INSERT (centang) / DELETE (batal). Lebih hemat & sederhana.
habit_completions (
  id           uuid PK,
  user_id      uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  habit_id     uuid NOT NULL REFERENCES habits ON DELETE CASCADE,
  date         date NOT NULL,           -- setara dateKey "YYYY-MM-DD"
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, date)
)
CREATE INDEX ON habit_completions (user_id, date);

-- ── Tasks ────────────────────────────────────────────────────
tasks (
  id           uuid PK,
  user_id      uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title        text NOT NULL,
  description  text DEFAULT '',
  status       text NOT NULL CHECK (status IN ('todo','in_progress','done')),
  priority     text NOT NULL CHECK (priority IN ('low','medium','high','urgent')),
  tag          text NOT NULL,
  due_date     timestamptz,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
)
CREATE INDEX ON tasks (user_id, status);

subtasks (
  id         uuid PK,
  task_id    uuid NOT NULL REFERENCES tasks ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title      text NOT NULL,
  completed  boolean NOT NULL DEFAULT false,
  position   int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
)

-- ── Finance ──────────────────────────────────────────────────
transactions (
  id            uuid PK,
  user_id       uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title         text NOT NULL,
  amount        numeric(14,2) NOT NULL,  -- KEPUTUSAN: tetap numeric, migrasi 1:1 dari data lama
  currency      text NOT NULL DEFAULT 'IDR',
  type          text NOT NULL CHECK (type IN ('income','expense')),
  category      text NOT NULL,
  occurred_at   timestamptz NOT NULL,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
)
CREATE INDEX ON transactions (user_id, occurred_at DESC);

-- ── Pomodoro ─────────────────────────────────────────────────
pomodoro_settings (
  user_id                   uuid PK REFERENCES auth.users ON DELETE CASCADE,
  focus_duration            int NOT NULL DEFAULT 25,
  short_break_duration      int NOT NULL DEFAULT 2,
  long_break_duration       int NOT NULL DEFAULT 5,
  sessions_before_long_break int NOT NULL DEFAULT 4,
  required_sessions         int NOT NULL DEFAULT 1,
  updated_at                timestamptz NOT NULL DEFAULT now()
)

task_pomodoro_records (
  task_id           uuid PK REFERENCES tasks ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  completed_sessions int NOT NULL DEFAULT 0,
  required_sessions  int NOT NULL DEFAULT 1,
  last_session_at    timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now()
)
```

### Keputusan desain (sudah final)

1. **`amount numeric(14,2)`** — dipilih agar migrasi data lama berjalan 1:1 tanpa konversi,
   dan `Transaction.amount` di TypeScript tetap `number` seperti sekarang. Tidak ada
   perubahan pada `use-finance-storage.ts` maupun layar `finances.tsx`.

   > **Catatan teknis yang perlu diingat saat implementasi:** `supabase-js` mengembalikan
   > kolom `numeric` sebagai **string** (`"12500.00"`), bukan number — ini perilaku
   > PostgREST untuk menjaga presisi. Jadi repository **wajib** melakukan
   > `Number(row.amount)` saat membaca. Selain itu, penjumlahan di client tetap memakai
   > float, sehingga agregat (`balance`, `totalIncome`, `totalExpense`) sebaiknya
   > dibulatkan 2 desimal di akhir perhitungan untuk menghindari galat seperti
   > `0.1 + 0.2`. Sisi database sendiri aman karena `numeric` presisi eksak.

2. **`habit_completions` hanya menyimpan yang `true`** — struktur lama menyimpan boolean
   eksplisit; nilai `false` cukup direpresentasikan sebagai "tidak ada baris".
3. **Soft delete (`deleted_at`)** — dibutuhkan agar penghapusan di device A bisa
   dipropagasi ke device B. Perlu cron cleanup berkala (Edge Function).
4. **Perhitungan stats tetap di client** — semua fungsi di `use-habit-storage.ts`
   (`getStreakForHabit`, `getHabitHeatmap`, `getConsistencyRate`, dll) **tidak berubah**,
   cukup diberi input dari sumber data yang baru.
5. **Tidak ada data tanpa pemilik** — karena login wajib, `user_id` selalu `NOT NULL` dan
   tidak perlu jalur anonymous. Ini menyederhanakan seluruh RLS policy.

### RLS (contoh pola, diterapkan ke semua tabel)

```sql
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows" ON habits
  FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

Plus trigger `handle_new_user()` yang otomatis membuat baris `profiles`,
`user_preferences`, dan `pomodoro_settings` saat user pertama kali sign up.

---

## 5. Rencana Eksekusi per Fase

### Fase 0 — Setup infrastruktur (~½ hari)

- Buat project Supabase, simpan URL + anon key
- `app.json` → `app.config.ts` supaya bisa baca `process.env`
- `.env` dengan `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (anon key **aman** dipublikasikan selama RLS aktif — ia dirancang untuk itu)
- `bunx supabase init` → migrasi disimpan sebagai SQL di `supabase/migrations/`, ikut Git
- Build development client: `eas build --profile development --platform android`
  (iOS cukup lewat simulator lokal selama akun Apple Developer belum ada)

### Fase 1 — Skema + RLS (~1 hari)

- Tulis migrasi SQL sesuai bagian 4
- Aktifkan RLS + policy di semua tabel
- Trigger `handle_new_user`, trigger auto-`updated_at`
- Generate tipe → `types/database.ts`
- **Uji RLS**: buat 2 user dummy, pastikan user A tidak bisa membaca data user B

### Fase 2 — Authentication: Google (~1½ hari)

**Login wajib** — tidak ada mode guest. Tidak ada satu pun layar yang bisa diakses
sebelum session valid.

- `lib/supabase.ts` — client dengan `SecureStore` sebagai auth storage adapter
  (bukan AsyncStorage; token itu kredensial)
- `hooks/use-auth.tsx` — `AuthProvider`: session, user, `signInWithGoogle`,
  `signOut`, `deleteAccount`
- Google: `@react-native-google-signin/google-signin` → dapat `idToken` →
  `supabase.auth.signInWithIdToken({ provider: 'google', token })`
  (native flow, bukan browser redirect — UX jauh lebih baik)
- Routing & gate:
  - Grup baru `app/(auth)/_layout.tsx` + `app/(auth)/sign-in.tsx`
  - Guard di `app/_layout.tsx`: `session === null` → redirect ke `(auth)/sign-in`,
    `session` ada → redirect ke `(tabs)`
  - **Splash screen ditahan sampai session selesai di-restore.** `use-splash.ts` yang
    sudah ada dipakai untuk ini, supaya tidak ada kedipan layar login pada user yang
    sebenarnya sudah masuk
- `app/(tabs)/settings.tsx` → section akun: avatar, email, sign out, hapus akun
- Hapus akun: Edge Function dengan service-role key memanggil
  `auth.admin.deleteUser()`; semua tabel `ON DELETE CASCADE` sehingga data ikut bersih

> Desain layar sign-in sebaiknya sudah menyediakan slot untuk tombol Apple sejak
> sekarang, supaya Fase 2b hanya perlu mengisi, bukan menata ulang layout.

### Fase 2b — Sign in with Apple (DITUNDA — blocker: akun Apple Developer)

Dikerjakan setelah Apple Developer Program aktif, **sebelum** rilis iOS apa pun.
Estimasi ~½ hari begitu akun tersedia.

- `expo-apple-authentication` → `signInWithIdToken({ provider: 'apple', ... })`
- Tambah `expo-apple-authentication` ke `plugins` di `app.config.ts`
- Tombol Apple **hanya dirender di iOS**, dan **wajib ada** karena app menyediakan
  login Google
- **Nama user dari Apple hanya dikirim satu kali** pada sign-up pertama → langsung
  tulis ke `profiles.nickname` saat itu juga; tidak bisa diambil ulang selamanya
- Email `@privaterelay.appleid.com` adalah normal — jangan jadikan email sebagai
  identitas unik, pakai `auth.users.id`

### Fase 3 — Repository layer (~2 hari)

Lapisan baru `lib/repositories/` dengan interface yang identik untuk lokal & remote:

```ts
interface HabitRepository {
 list(): Promise<Habit[]>;
 create(input: Omit<Habit, "id" | "createdAt">): Promise<Habit>;
 update(id: string, patch: Partial<Habit>): Promise<void>;
 remove(id: string): Promise<void>;
 listCompletions(range: DateRange): Promise<Completion[]>;
 toggleCompletion(habitId: string, dateKey: string): Promise<void>;
}
```

Provider yang ada (`HabitStorageProvider`, dst.) diubah agar memanggil repository,
**tanpa mengubah signature yang dikonsumsi UI**. Ini kunci agar semua layar tetap utuh.

### Fase 4 — Sinkronisasi data lokal (~2 hari)

- TanStack Query untuk fetch/mutate + optimistic update
- Persister ke AsyncStorage → app tetap menampilkan data terakhir saat offline
- Mutation queue: aksi saat offline masuk antrean, di-flush saat koneksi kembali
- Konflik: **last-write-wins** berbasis `updated_at`. Untuk aplikasi single-user
  multi-device ini sudah memadai; tidak perlu CRDT

### Fase 5 — SQLite lokal (opsional, ~2 hari)

Kalau data sudah membesar (heatmap 1 tahun, ratusan transaksi), naikkan dari
AsyncStorage-persister ke `expo-sqlite` + Drizzle supaya query agregat cepat
dan tidak perlu memuat seluruh dataset ke memori.

> Bisa dilewati dulu. Fase 4 sudah cukup untuk skala saat ini.

### Fase 6 — Migrasi data user lama (~1 hari)

Saat user pertama kali login dan `@habitfuel_migrated_v1` belum ada:

1. Baca 4 storage key lama
2. Transform → bentuk baru. Karena `amount` tetap `numeric`, **tidak ada konversi nilai
   uang** — cukup pemetaan field. Yang berubah bentuk hanya `completions` map →
   baris `habit_completions`, dan `subtasks` embedded → tabel `subtasks`
3. Upload batch, semuanya dalam satu RPC transaksional
4. Set flag `@habitfuel_migrated_v1`; **jangan hapus data lokal lama** sampai upload
   terkonfirmasi sukses

### Fase 7 — Realtime & polish (~1 hari)

- Subscribe Postgres Changes per tabel → invalidasi cache TanStack Query
- Indikator status sinkronisasi di UI
- Error boundary + retry dengan backoff
- Cleanup job untuk soft-deleted rows

**Total estimasi: ~9–11 hari kerja** untuk Fase 0–7 (tanpa Fase 5, tanpa Fase 2b).
Fase 2b menambah ~½ hari begitu akun Apple Developer aktif.

---

## 6. Risiko & Mitigasi

| Risiko                                                          | Mitigasi                                                                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Expo Go tidak lagi bisa dipakai (auth native)                   | Siapkan dev build sejak Fase 0, jangan di akhir                                                                                             |
| **Belum punya Apple Developer** → iOS tidak bisa rilis          | Target rilis pertama = **Android/Google Play**. Kerjakan Fase 2 (Google) saja; Apple masuk Fase 2b setelah akun aktif                       |
| Layar sign-in perlu ditata ulang saat Apple ditambahkan         | Sediakan slot tombol Apple di desain sejak Fase 2, render bersyarat `Platform.OS === 'ios'`                                                 |
| Apple menyembunyikan email asli (`privaterelay`)                | Jangan jadikan email sebagai identitas unik — pakai `auth.users.id`                                                                         |
| Nama user Apple hanya dikirim **sekali** saat sign-up pertama   | Wajib disimpan ke `profiles` saat itu juga, tidak bisa diambil ulang                                                                        |
| **`numeric` dikembalikan sebagai string oleh PostgREST**        | Repository wajib `Number(row.amount)`; bulatkan agregat ke 2 desimal. Tambahkan unit test untuk perhitungan `FinanceStats`                  |
| Login wajib → user tidak bisa masuk saat offline di device baru | Session di-cache via `SecureStore`, jadi hanya login _pertama_ yang butuh koneksi. Sediakan pesan error offline yang jelas di layar sign-in |
| Data user lama hilang saat migrasi                              | Migrasi non-destruktif + flag; data lokal disimpan sebagai cadangan                                                                         |
| Free tier Supabase pause setelah 7 hari idle                    | Cukup untuk dev; upgrade Pro saat produksi                                                                                                  |
| Zona waktu `dateKey` bergeser                                   | Simpan `date` sebagai `date` lokal user, bukan UTC timestamp — konsisten dengan `getDateKey()` yang sekarang                                |

---

## 7. Struktur File yang Akan Ditambahkan

```
supabase/
  migrations/
    0001_init_schema.sql
    0002_rls_policies.sql
    0003_triggers.sql
  functions/
    delete-account/          # Edge Function, butuh service-role key
lib/
  supabase.ts
  repositories/
    habit-repository.ts
    task-repository.ts
    finance-repository.ts
    pomodoro-repository.ts
    profile-repository.ts
  sync/
    query-client.ts
    mutation-queue.ts
    migrate-local-data.ts
types/
  database.ts              # generated, jangan diedit manual
hooks/
  use-auth.tsx             # BARU
  use-*-storage.ts         # diubah isinya, API tetap
app/
  (auth)/
    _layout.tsx            # BARU
    sign-in.tsx            # BARU — sediakan slot tombol Apple sejak awal
app.config.ts              # menggantikan app.json
.env                       # gitignored
.env.example               # ikut Git
```

---

## 8. Checklist Saat Eksekusi Dimulai

> Prompt siap-copy untuk tiap fase tersedia di
> [`docs/execution-prompts.md`](./execution-prompts.md) — satu fase, satu chat baru.

Urutan yang disarankan — centang seiring jalan:

- [ ] **Fase 0** — Project Supabase dibuat, `app.json` → `app.config.ts`, `.env` terisi
- [ ] **Fase 0** — Google Cloud OAuth Client ID (Android + Web) dibuat, Web Client ID
      didaftarkan di Supabase Auth providers
- [ ] **Fase 0** — `eas build --profile development --platform android` berhasil terpasang
- [ ] **Fase 1** — Migrasi SQL + RLS + trigger jalan, diuji dengan 2 user dummy
- [ ] **Fase 1** — `types/database.ts` ter-generate
- [ ] **Fase 2** — Login Google berfungsi, gate routing aktif, hapus akun berfungsi
- [ ] **Fase 3** — Semua provider berpindah ke repository, UI tidak ada yang berubah
- [ ] **Fase 4** — App tetap berfungsi dalam mode pesawat setelah login pertama
- [ ] **Fase 6** — Migrasi data lokal diuji pada instalasi lama yang berisi data
- [ ] **Fase 7** — Realtime lintas device diverifikasi dengan 2 perangkat
- [ ] Rilis Android / Google Play
- [ ] **Fase 2b** — _(setelah Apple Developer aktif)_ Sign in with Apple → rilis iOS

### Ditunda secara sadar (bukan terlupa)

| Item                         | Alasan                                       | Trigger untuk mengerjakan                                                               |
| ---------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| Fase 5 — SQLite + Drizzle    | Fase 4 sudah cukup untuk skala data saat ini | Saat heatmap/riwayat transaksi terasa lambat, atau dataset menembus beberapa ribu baris |
| Fase 2b — Sign in with Apple | Akun Apple Developer belum ada               | Begitu Apple Developer Program aktif                                                    |
| Rilis iOS / TestFlight       | Terblokir oleh Fase 2b                       | Setelah Fase 2b selesai                                                                 |

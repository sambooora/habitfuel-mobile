# Prompt Eksekusi — Migrasi Full-Stack HabitFuel

Kumpulan prompt siap-copy untuk mengeksekusi
[`docs/fullstack-migration-plan.md`](./fullstack-migration-plan.md).

## Cara pakai

1. **Satu fase = satu chat baru.** Jangan gabungkan. Konteks akan penuh dan hasilnya
   memburuk kalau semua fase dipaksakan dalam satu sesi.
2. Selesaikan checklist **Persiapan manual** di fase tersebut lebih dulu — ada hal-hal
   yang tidak bisa dikerjakan agent (bikin akun, klik dashboard, isi API key).
3. Copy blok prompt, paste, jalankan.
4. Setelah selesai: review diff, commit, baru lanjut fase berikutnya.
5. Centang progres di §8 `fullstack-migration-plan.md`.

## Urutan

```
Fase 0 → 1 → 2 → 3 → 4 → 6 → 7 → [rilis Android] → 2b → [rilis iOS]
                                                     ↑
                          Fase 5 opsional, hanya jika performa jadi masalah
```

> Fase 6 (migrasi data lokal) sengaja ditaruh setelah Fase 4, bukan setelah Fase 3,
> supaya mutation queue sudah ada saat data bulk di-upload.

---

## Prompt Global (opsional — tempel di awal tiap chat)

Kalau ingin memastikan agent konsisten lintas sesi, tempel ini sebelum prompt fase:

````text
Konteks proyek: HabitFuel, aplikasi Expo (SDK 54) + expo-router + Tamagui, package
manager bun. Sedang dimigrasikan dari AsyncStorage-only ke full-stack Supabase.

Aturan yang berlaku untuk semua pekerjaan di proyek ini:
- Baca docs/fullstack-migration-plan.md lebih dulu. Dokumen itu adalah sumber
  kebenaran. Kalau ada instruksiku yang bertentangan dengannya, hentikan dan
  tanyakan dulu.
- Referensi komponen UI ada di llms/tamagui.txt (lihat CLAUDE.md).
- Pakai bun, bukan npm/yarn/pnpm.
- Jangan ubah UI/layout yang sudah ada kecuali diminta eksplisit.
- Jangan commit, jangan bikin branch, kecuali kuminta.
- Kalau ada keputusan desain yang belum tercakup di plan, tanyakan sebelum menebak.
````

---

## Fase 0 — Setup Infrastruktur

### Persiapan manual (WAJIB sebelum menjalankan prompt)

- [ ] Buat project Supabase baru (region Singapore). Catat **Project URL** dan **anon key**
- [ ] Catat **Project Ref ID** (ada di Settings → General)
- [ ] Buat project Google Cloud → OAuth consent screen → buat **2 OAuth Client ID**:
  - **Web application** → Client ID ini yang didaftarkan ke Supabase
  - **Android** → butuh package name `com.habitfuel.mobile` + SHA-1 fingerprint
    (ambil dari `eas credentials`, pilih Android → keystore)
- [ ] Di Supabase Dashboard → Authentication → Providers → Google → aktifkan,
      isi **Web Client ID** + Client Secret
- [ ] Install Supabase CLI kalau belum: `bun add -d supabase`

````text
Baca docs/fullstack-migration-plan.md, lalu kerjakan FASE 0 (Setup Infrastruktur).

Ini proyek Expo SDK 54 + expo-router + Tamagui, package manager bun.

Yang perlu kamu kerjakan:

1. Konversi app.json → app.config.ts (TypeScript) supaya bisa membaca process.env.
   Pertahankan SEMUA konfigurasi yang ada sekarang persis apa adanya: name, slug,
   scheme "habitfuelmobile", bundleIdentifier/package "com.habitfuel.mobile",
   plugins, experiments (typedRoutes + reactCompiler), extra.eas.projectId, owner.
   Hapus app.json setelah konversi terverifikasi.

2. Buat .env dan .env.example dengan EXPO_PUBLIC_SUPABASE_URL dan
   EXPO_PUBLIC_SUPABASE_ANON_KEY. Isi .env dengan nilai yang akan kuberikan di
   bawah; .env.example diisi placeholder. Pastikan .env masuk .gitignore dan
   .env.example TIDAK masuk .gitignore.

3. Install dependency Fase 0-4 saja (jangan yang ditunda):
   bun add @supabase/supabase-js @tanstack/react-query @tanstack/react-query-persist-client
   bun add @react-native-google-signin/google-signin
   bun expo install expo-secure-store
   bun add -d supabase
   JANGAN install expo-apple-authentication, expo-sqlite, atau drizzle —
   itu untuk fase yang ditunda.

4. Tambahkan plugin @react-native-google-signin/google-signin ke app.config.ts.

5. Jalankan `bunx supabase init` untuk menyiapkan folder supabase/.
   Pastikan file yang harus di-gitignore sudah benar.

6. Buat lib/supabase.ts: Supabase client dengan expo-secure-store sebagai auth
   storage adapter (BUKAN AsyncStorage — token itu kredensial). Perhatikan:
   SecureStore punya batas ukuran 2048 byte per item, jadi tangani kemungkinan
   session besar. Set autoRefreshToken, persistSession, detectSessionInUrl: false.
   Tambahkan juga handler AppState untuk start/stop auto-refresh sesuai dokumentasi
   Supabase untuk React Native.
   Beri tipe generic dari types/database.ts kalau file itu sudah ada; kalau belum,
   siapkan strukturnya supaya tinggal dipasang di Fase 1.

7. Tambahkan script di package.json:
   "db:types" untuk generate types ke types/database.ts
   "db:push" / "db:diff" seperlunya untuk workflow migrasi Supabase.

Nilai environment yang kupakai:
- EXPO_PUBLIC_SUPABASE_URL: <TEMPEL_URL_DI_SINI>
- EXPO_PUBLIC_SUPABASE_ANON_KEY: <TEMPEL_ANON_KEY_DI_SINI>
- Supabase project ref: <TEMPEL_PROJECT_REF_DI_SINI>
- Google Web Client ID: <TEMPEL_WEB_CLIENT_ID_DI_SINI>

Definition of done:
- `bunx tsc --noEmit` bersih
- `bun expo start` masih jalan tanpa error konfigurasi
- Tidak ada satu pun secret yang ter-hardcode di file yang ikut Git

Jangan sentuh hooks/, components/, atau app/ selain yang disebut di atas.
Laporkan apa saja yang perlu kulakukan manual setelah ini.
````

Setelah prompt selesai, jalankan manual:

```bash
eas build --profile development --platform android
```

---

## Fase 1 — Skema Database + RLS

### Persiapan manual

- [ ] Fase 0 selesai & ter-commit
- [ ] `bunx supabase login` sudah dilakukan
- [ ] Project sudah di-link: `bunx supabase link --project-ref <REF>`

````text
Baca docs/fullstack-migration-plan.md bagian §4 (Desain Skema Database), lalu
kerjakan FASE 1.

Buat file migrasi SQL di supabase/migrations/ — pisah jadi 3 file berurutan:
  0001_init_schema.sql
  0002_rls_policies.sql
  0003_triggers.sql

Isi 0001 — semua tabel persis seperti §4 dokumen:
profiles, user_preferences, habits, habit_completions, tasks, subtasks,
transactions, pomodoro_settings, task_pomodoro_records.

Yang WAJIB diperhatikan, ini keputusan final dan jangan diubah:
- transactions.amount adalah numeric(14,2), BUKAN bigint minor units.
- habit_completions hanya menyimpan baris untuk hari yang SELESAI. Tidak ada
  kolom boolean. Toggle = INSERT atau DELETE. UNIQUE (habit_id, date).
- habit_completions.date bertipe `date` (tanggal lokal user), bukan timestamptz.
- Semua tabel domain punya created_at, updated_at, dan deleted_at (soft delete),
  kecuali tabel yang di §4 memang tidak punya.
- Semua user_id NOT NULL, REFERENCES auth.users ON DELETE CASCADE.
  Login wajib, tidak ada mode guest, jadi tidak boleh ada baris tanpa pemilik.
- CHECK constraint untuk semua kolom enum-like, nilainya harus PERSIS sama dengan
  union type di hooks/ (cek use-task-storage.ts, use-habit-storage.ts,
  use-finance-storage.ts untuk daftar lengkap status, priority, tag, category).
- Index sesuai yang tertulis di §4.

Isi 0002 — RLS:
- ENABLE ROW LEVEL SECURITY di SEMUA tabel tanpa terkecuali.
- Policy "own rows" FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id).
- Untuk subtasks dan task_pomodoro_records, pastikan policy tetap berbasis kolom
  user_id langsung (bukan subquery ke tasks) supaya query tetap cepat.

Isi 0003 — triggers:
- handle_new_user(): trigger AFTER INSERT ON auth.users yang otomatis membuat baris
  di profiles, user_preferences, dan pomodoro_settings. Ambil nickname dari
  raw_user_meta_data (full_name / name) dan avatar_url kalau ada.
  Fungsi harus SECURITY DEFINER dengan search_path yang di-set eksplisit.
- Trigger generik set_updated_at() yang meng-update kolom updated_at, dipasang ke
  semua tabel yang punya kolom itu.

Setelah itu:
1. Push migrasi ke Supabase.
2. Generate types ke types/database.ts.
3. Pasang tipe Database ke client di lib/supabase.ts.
4. Tulis skrip verifikasi RLS di supabase/tests/ (SQL atau skrip TS, bebas) yang
   membuktikan user A tidak bisa SELECT/UPDATE/DELETE baris milik user B pada
   setiap tabel. Jelaskan cara menjalankannya.

Definition of done:
- Migrasi ter-apply tanpa error
- types/database.ts ter-generate dan `bunx tsc --noEmit` bersih
- Verifikasi RLS terbukti lolos

Jangan ubah kode aplikasi apa pun di fase ini. Murni database + types.
````

---

## Fase 2 — Authentication (Google)

### Persiapan manual

- [ ] Development build Android sudah terpasang di device (bukan Expo Go)
- [ ] Google provider aktif di Supabase Dashboard

````text
Baca docs/fullstack-migration-plan.md bagian §5 Fase 2, lalu kerjakan FASE 2
(Authentication dengan Google).

Ingat: LOGIN WAJIB. Tidak ada mode guest. Tidak ada satu layar pun yang boleh
diakses sebelum session valid.

Yang perlu dibuat:

1. hooks/use-auth.tsx — AuthProvider + useAuth():
   - state: session, user, isLoading (true selama session pertama di-restore)
   - signInWithGoogle(): pakai @react-native-google-signin/google-signin untuk
     dapat idToken, lalu supabase.auth.signInWithIdToken({ provider: 'google',
     token }). Ini native flow, JANGAN pakai browser redirect / WebBrowser.
   - signOut()
   - deleteAccount()
   - subscribe ke supabase.auth.onAuthStateChange dan cleanup dengan benar
   - Konfigurasi GoogleSignin.configure() dengan webClientId dari env

2. Route group baru:
   app/(auth)/_layout.tsx
   app/(auth)/sign-in.tsx

   Layar sign-in memakai Tamagui, konsisten dengan bahasa desain aplikasi yang
   sudah ada (lihat app/(tabs)/settings.tsx sebagai acuan gaya, dan llms/tamagui.txt
   untuk referensi komponen). Harus menampilkan branding HabitFuel, tombol
   "Continue with Google", dan SLOT KOSONG untuk tombol Apple yang dirender
   bersyarat Platform.OS === 'ios' — untuk sekarang slot itu belum diisi karena
   Sign in with Apple ditunda ke Fase 2b. Tata letaknya harus sudah siap menerima
   tombol kedua tanpa perlu ditata ulang nanti.
   Sertakan penanganan error yang jelas, termasuk kasus offline dan kasus user
   membatalkan dialog Google.

3. Gate routing di app/_layout.tsx:
   - Bungkus dengan AuthProvider (posisikan di atas provider storage yang sudah ada)
   - session === null  → redirect ke /(auth)/sign-in
   - session ada       → redirect ke /(tabs)
   - PENTING: custom splash screen yang sudah ada (components/splash-screen.tsx +
     hooks/use-splash.ts) harus DITAHAN sampai restore session selesai, supaya user
     yang sudah login tidak melihat kedipan layar sign-in. Integrasikan dengan
     mekanisme splash yang sudah ada, jangan bikin mekanisme baru.

4. app/(tabs)/settings.tsx — tambah section "Account" di posisi yang wajar:
   avatar, nama, email, tombol Sign Out, dan tombol Delete Account (destructive,
   dengan konfirmasi). Ikuti pola styling section yang sudah ada di file itu,
   jangan bikin gaya baru.

5. Supabase Edge Function supabase/functions/delete-account/ yang memakai
   service-role key untuk memanggil auth.admin.deleteUser(). Karena semua FK
   ON DELETE CASCADE, data ikut terhapus otomatis. Verifikasi JWT pemanggil dan
   pastikan user hanya bisa menghapus dirinya sendiri.

Yang TIDAK boleh dikerjakan di fase ini:
- Jangan install atau menyentuh expo-apple-authentication (ditunda ke Fase 2b)
- Jangan ubah hooks/use-*-storage.ts — masih AsyncStorage sampai Fase 3
- Jangan ubah layar tabs selain settings.tsx

Definition of done:
- Login Google berhasil, session bertahan setelah app di-restart
- Sign out mengembalikan ke layar sign-in
- Tidak ada layar tabs yang bisa diakses tanpa session
- Delete account benar-benar menghapus user dan datanya
- `bunx tsc --noEmit` bersih

Kalau ada langkah manual di Google Cloud atau Supabase Dashboard yang masih kurang,
sebutkan di akhir.
````

---

## Fase 3 — Repository Layer

````text
Baca docs/fullstack-migration-plan.md bagian §5 Fase 3, lalu kerjakan FASE 3
(Repository Layer).

Tujuan fase ini: memindahkan sumber data dari AsyncStorage ke Supabase TANPA
mengubah satu baris pun di layar-layar aplikasi.

Ini aturan paling penting di fase ini:
SIGNATURE PUBLIK SEMUA HOOK STORAGE TIDAK BOLEH BERUBAH.
useHabitStorage(), useTaskStorage(), useFinanceStorage(), usePomodoroStorage(),
useNickname() harus mengembalikan bentuk yang persis sama seperti sekarang.
Kalau kamu merasa perlu mengubah salah satunya, BERHENTI dan tanyakan dulu.

Buat lib/repositories/ berisi:
  habit-repository.ts
  task-repository.ts
  finance-repository.ts
  pomodoro-repository.ts
  profile-repository.ts

Lalu ubah isi provider di hooks/ agar memanggil repository, bukan AsyncStorage.

Hal-hal spesifik yang wajib diperhatikan:

1. transactions.amount adalah numeric di Postgres, dan supabase-js
   MENGEMBALIKANNYA SEBAGAI STRING (contoh "12500.00"), bukan number. Ini
   perilaku PostgREST untuk menjaga presisi. Repository WAJIB melakukan
   Number(row.amount) saat membaca. Kalau ini terlewat, balance akan jadi hasil
   konkatenasi string. Bulatkan juga hasil agregat ke 2 desimal.

2. habit_completions di database hanya menyimpan hari yang selesai (ada baris =
   true, tidak ada baris = false). Tapi HabitStorageContextValue tetap
   mengekspos completions dalam bentuk Record<habitId, Record<dateKey, boolean>>
   seperti sekarang. Repository yang bertanggung jawab menerjemahkan baris-baris
   itu menjadi struktur map tersebut.

3. subtasks sekarang tabel terpisah, tapi tipe Task di TypeScript tetap punya
   properti subtasks: SubTask[]. Repository yang menggabungkan (pakai nested
   select supabase-js), bukan UI.

4. Semua fungsi perhitungan yang sudah ada di use-habit-storage.ts —
   getStreakForHabit, getHabitHeatmap, getOverallHeatmap, getHabitStats,
   getConsistencyRate, getActiveDaysStreak, buildWeekGrid, dan helper tanggal
   seperti getDateKey — TIDAK BOLEH DIUBAH LOGIKANYA. Perhitungan tetap di client.
   Cukup ganti sumber input datanya.

5. Semua query harus otomatis memfilter deleted_at IS NULL. Delete = set
   deleted_at, bukan DELETE fisik. Pengecualian: habit_completions memakai DELETE
   fisik karena memang tidak punya deleted_at.

6. ID di-generate di client sebagai UUID v4 (bukan lagi Date.now() + random
   seperti generateId() sekarang), supaya optimistic insert punya ID final sejak
   awal. Pakai crypto.randomUUID() bila tersedia; kalau tidak, sediakan polyfill
   yang sesuai untuk React Native.

Kerjakan satu domain sampai tuntas sebelum pindah ke domain berikutnya, dengan
urutan: habits → tasks → finance → pomodoro → profile/nickname. Laporkan progres
per domain.

Definition of done:
- Semua CRUD berfungsi terhadap Supabase
- Tidak ada file di app/ atau components/ yang berubah
- `bunx tsc --noEmit` bersih
- Data yang dibuat di app muncul di Supabase Table Editor
````

---

## Fase 4 — Sinkronisasi & Offline

````text
Baca docs/fullstack-migration-plan.md bagian §5 Fase 4, lalu kerjakan FASE 4
(Sinkronisasi Data Lokal).

Bangun di atas repository layer dari Fase 3.

1. lib/sync/query-client.ts — setup TanStack Query:
   - QueryClient dengan staleTime & retry yang masuk akal untuk app mobile
   - Persister ke AsyncStorage (@tanstack/react-query-persist-client) supaya data
     terakhir tetap tampil saat offline
   - Pasang PersistQueryClientProvider di app/_layout.tsx, di dalam AuthProvider

2. Konversi provider storage agar memakai useQuery/useMutation dari repository.
   Signature publik hook TETAP TIDAK BERUBAH — sama seperti aturan Fase 3.

3. Optimistic update untuk semua mutasi. Yang paling kritis:
   toggleCompletion pada habit harus terasa instan tanpa menunggu network,
   karena itu interaksi paling sering dipakai.

4. lib/sync/mutation-queue.ts — antrean mutasi offline:
   - Mutasi saat offline masuk antrean yang dipersist
   - Di-flush otomatis saat koneksi kembali
   - Aman terhadap app di-kill di tengah jalan
   - Idempoten: mutasi yang sama tidak boleh ter-apply dua kali

5. Resolusi konflik: last-write-wins berbasis updated_at. Jangan
   over-engineer, tidak perlu CRDT untuk aplikasi single-user multi-device.

Skenario yang harus kamu pastikan berfungsi:
- Buka app dalam mode pesawat setelah pernah login → data lama tetap tampil
- Centang habit saat offline → UI langsung berubah → online kembali → tersinkron
- Kill app saat ada mutasi pending → buka lagi → mutasi tetap terkirim

JANGAN pasang expo-sqlite atau drizzle. Itu Fase 5 yang sengaja ditunda.

Definition of done:
- Ketiga skenario di atas terbukti berfungsi
- Tidak ada layar yang berubah
- `bunx tsc --noEmit` bersih
````

---

## Fase 6 — Migrasi Data User Lama

> Fase 5 dilewati (lihat §8 dokumen plan).

````text
Baca docs/fullstack-migration-plan.md bagian §5 Fase 6, lalu kerjakan FASE 6
(Migrasi Data User Lama).

Buat lib/sync/migrate-local-data.ts yang berjalan sekali saat user pertama kali
login dan flag @habitfuel_migrated_v1 belum ada.

Alur:
1. Baca 4 storage key lama:
   @habitfuel_habits        → { habits, completions }
   @habitfuel_tasks         → Task[] (subtasks ter-embed)
   @habitfuel_transactions  → Transaction[]
   @habitfuel_pomodoro      → { settings, records }
   plus key "nickname" dan preferensi tema.

2. Transform ke bentuk baru:
   - amount TIDAK perlu dikonversi — kolomnya numeric, jadi pemetaan 1:1.
   - completions: Record<habitId, Record<dateKey, boolean>> → baris
     habit_completions, HANYA untuk entry yang bernilai true.
   - subtasks embedded → baris tabel subtasks, dengan position sesuai urutan array.
   - ID lama (format Date.now()+random) BUKAN UUID valid. Generate UUID baru dan
     pertahankan pemetaan ID lama → baru supaya semua relasi tetap utuh, terutama
     task_pomodoro_records yang di-key oleh taskId.

3. Upload dalam satu operasi transaksional. Bikin Postgres function (RPC) yang
   menerima seluruh payload dan menulis semuanya dalam satu transaksi, supaya
   tidak ada kondisi setengah-jadi.

4. Set flag @habitfuel_migrated_v1 HANYA setelah upload terkonfirmasi sukses.
   JANGAN HAPUS data AsyncStorage lama — biarkan sebagai cadangan.

5. UI: tampilkan indikator progres saat migrasi berjalan (user bisa punya data
   berbulan-bulan). Kalau gagal, tampilkan pesan yang jelas dan sediakan opsi
   coba lagi. Kegagalan migrasi tidak boleh membuat user terkunci di luar app.

Buat juga unit test untuk fungsi transformasinya, dengan fixture yang meniru
bentuk data lama secara realistis (termasuk edge case: habit tanpa completion,
task tanpa subtask, storage kosong, storage corrupt/JSON tidak valid).

Definition of done:
- Diuji pada instalasi yang berisi data lama, hasilnya cocok 1:1 di Supabase
- Diuji pada instalasi bersih (tidak ada data lama) → tidak error, langsung skip
- Migrasi tidak pernah berjalan dua kali
- `bunx tsc --noEmit` bersih
````

---

## Fase 7 — Realtime & Polish

````text
Baca docs/fullstack-migration-plan.md bagian §5 Fase 7, lalu kerjakan FASE 7.

1. Realtime: subscribe ke Postgres Changes untuk tabel milik user yang sedang
   login, lalu invalidasi cache TanStack Query yang relevan. Filter subscription
   di sisi server berdasarkan user_id — jangan menerima semua perubahan lalu
   memfilter di client. Pastikan channel di-unsubscribe dengan benar saat sign out
   dan saat komponen unmount.
   Aktifkan replikasi realtime untuk tabel-tabel terkait lewat migrasi SQL.

2. Indikator status sinkronisasi di UI: offline / syncing / synced. Tempatkan
   secara halus, jangan mengganggu tampilan yang sudah ada. Ikuti bahasa desain
   Tamagui yang berlaku di aplikasi.

3. Error boundary + retry dengan exponential backoff untuk kegagalan jaringan.
   Pesan error harus bisa dimengerti user biasa, bukan melempar error mentah
   Supabase ke layar.

4. Cleanup soft-deleted rows: Edge Function terjadwal yang menghapus permanen
   baris dengan deleted_at lebih lama dari 30 hari. Sertakan instruksi cara
   menjadwalkannya (pg_cron atau Supabase Scheduled Functions).

5. Pass terakhir: pastikan tidak ada sisa kode AsyncStorage yang tidak terpakai di
   hooks/ (kecuali yang memang disengaja: cache TanStack Query, flag migrasi, dan
   preferensi tema lokal). Laporkan apa yang kamu temukan sebelum menghapus.

Uji realtime dengan dua device login sebagai user yang sama: perubahan di satu
device harus muncul di device lain tanpa perlu refresh manual.

Definition of done:
- Sinkronisasi dua device terverifikasi
- `bunx tsc --noEmit` bersih
- `bun run lint` bersih
````

---

## Fase 2b — Sign in with Apple (SETELAH punya Apple Developer)

### Persiapan manual

- [ ] Apple Developer Program aktif ($99/tahun)
- [ ] App ID dibuat dengan capability "Sign in with Apple"
- [ ] Services ID + Key (.p8) dibuat di Apple Developer portal
- [ ] Apple provider dikonfigurasi di Supabase Dashboard → Authentication → Providers

````text
Baca docs/fullstack-migration-plan.md bagian §5 Fase 2b, lalu kerjakan FASE 2b
(Sign in with Apple).

Akun Apple Developer sudah aktif dan provider Apple sudah dikonfigurasi di
Supabase Dashboard.

1. bun expo install expo-apple-authentication
2. Tambahkan expo-apple-authentication ke plugins di app.config.ts
3. Tambah signInWithApple() di hooks/use-auth.tsx:
   AppleAuthentication.signInAsync() → ambil identityToken →
   supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken })
4. Isi slot tombol Apple yang sudah disiapkan di app/(auth)/sign-in.tsx.
   Render HANYA bila Platform.OS === 'ios' dan
   AppleAuthentication.isAvailableAsync() bernilai true.
   Pakai AppleAuthentication.AppleAuthenticationButton dengan styling yang sesuai
   Human Interface Guidelines — Apple menolak tombol yang dimodifikasi.

KRITIS, jangan sampai terlewat:
Apple hanya mengirimkan nama lengkap user SATU KALI, yaitu pada sign-up pertama.
Pada login berikutnya field itu null selamanya dan tidak ada cara mengambilnya
kembali. Jadi saat credential berisi fullName, nama itu HARUS langsung ditulis ke
profiles.nickname pada saat itu juga.

Catatan lain:
- Email bisa berupa @privaterelay.appleid.com. Itu normal. Jangan pernah pakai
  email sebagai identitas unik — selalu auth.users.id.
- Tangani kasus user membatalkan dialog (error code ERR_REQUEST_CANCELED) tanpa
  menampilkan pesan error.

Terakhir, buat checklist hal-hal yang masih perlu kusiapkan sebelum submit ke
App Store: privacy policy, penjelasan fitur hapus akun, dan konfigurasi build iOS.

Definition of done:
- Login Apple berhasil di device iOS fisik
- Nama user tersimpan ke profiles pada sign-up pertama
- Tombol Apple tidak muncul sama sekali di Android
- `bunx tsc --noEmit` bersih
````

---

## Fase 5 — SQLite Lokal (OPSIONAL, hanya jika performa bermasalah)

> Jangan kerjakan ini kecuali sudah ada gejala nyata: heatmap lambat di-render,
> daftar transaksi tersendat, atau dataset menembus beberapa ribu baris.

````text
Baca docs/fullstack-migration-plan.md bagian §5 Fase 5, lalu kerjakan FASE 5
(SQLite Lokal).

Alasan menjalankan fase ini sekarang: <TULIS GEJALA PERFORMA YANG KAMU ALAMI>

Naikkan lapisan cache dari AsyncStorage-persister ke expo-sqlite + Drizzle:

1. bun expo install expo-sqlite && bun add drizzle-orm && bun add -d drizzle-kit
2. Definisikan skema SQLite yang mencerminkan skema Postgres, di lib/db/schema.ts
3. SQLite menjadi source of truth untuk UI; Supabase menjadi lapisan sinkronisasi
4. Repository dari Fase 3 membaca dari SQLite, bukan langsung dari network
5. Query agregat (heatmap, statistik mingguan) dijalankan sebagai query SQL,
   bukan dengan memuat seluruh dataset ke memori JS
6. Sinkronisasi dua arah berbasis updated_at, tetap last-write-wins

Signature publik hook TETAP TIDAK BOLEH BERUBAH.

Sebelum dan sesudah, ukur waktu render layar habits dan finances lalu laporkan
perbandingannya, supaya perubahan ini terbukti sepadan.
````

---

## Kalau ada yang meleset

````text
Fase <N> sudah dijalankan tapi ada masalah: <DESKRIPSIKAN>

Baca docs/fullstack-migration-plan.md untuk konteks, periksa apa yang sudah
terimplementasi, lalu diagnosis akar masalahnya sebelum mengubah kode.
Jangan menambal gejalanya saja.
````

````text
Aku ingin memundurkan (rollback) Fase <N>.

Baca docs/fullstack-migration-plan.md, identifikasi semua perubahan milik fase
tersebut, lalu jelaskan rencana rollback-nya SEBELUM mengeksekusi apa pun —
termasuk migrasi database yang perlu di-revert dan risiko kehilangan data.
````

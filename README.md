# 🚀 Custom Stack CLI Generator (v3.5 Universal Fullstack)

Next.js 15 (Public Web + Shadcn UI), React Vite (Admin Panel + Ant Design), Go Clean Architecture (Backend + Auth + Migrations + Seed), DevOps (Docker, Makefile, Git, Husky), **Yagona `npm run dev` (barcha servislarni bitta terminalda bir vaqtda ishga tushirish)** hamda **barcha AI agentlar (Cursor, Claude, Copilot, Antigravity, Windsurf) uchun qat'iy qoidalar tizimini** avtomatik shakllantiruvchi universal CLI vositasi.

---

## 📌 Asosiy Imkoniyatlar va Standartlar

### ⚡ 1. Yagona `npm run dev` (Bitta terminalda 3 ta servis)
3 ta alohida terminal oynasi ochib, har bir papkaga `cd` qilib yurishga hojat yo'q!
Loyiha root papkasida bitta buyruq bilan barcha mavjud servislarni rang-barang loglar bilan ishga tushirasiz:

```bash
npm run dev
```

Terminalda bir vaqtda real-time oqimlar ko'rinadi:
- `[BACKEND]` (cyan) 🚀 Gin Backend 8080-portda ishga tushdi...
- `[PUBLIC] ` (blue) ▲ Next.js 15 (http://localhost:3000)
- `[ADMIN]  ` (magenta) ➜ Local: http://localhost:5173/

Alohida ishga tushirish uchun:
- `npm run dev:backend`
- `npm run dev:public`
- `npm run dev:admin`

---

### 🔄 2. Mavjud Loyihaga Yangi Modul Qo‘shish (Incremental Mode)
Boshida faqat Backend va Admin yaratdingizmi? Keyinchalik Public (Next.js) qo'shmoqchimisiz?
Hech qisi yo'q! Istalgan vaqtda:
- O'sha loyiha papkasi ichida turib yoki loyiha nomini kiritib `create-my-stack` buyrug'ini bering.
- CLI avtomatik ravishda mavjud modullarni aniqlaydi (`[✔] Backend`, `[✔] Admin`, `[ ] Public`).
- Sizga yetishmayotgan modulni qo'shishni taklif qiladi.
- Yangi modul yaratilgach, root `package.json` (`npm run dev`), `Makefile` va barcha **AI Guardrails qoidalari** yangi modulni qamrab olgan holda avtomatik sinxronlanadi!

---

### ⚡ 3. Backend API (Go Clean Architecture + Auth + Migratsiya + Seed)
- **To'liq Clean Architecture Auth:**
  - `internal/domain/user.go` — `User` modeli, `LoginRequest`, `RegisterRequest`, `AuthResponse` DTOlari va interfeyslar.
  - `internal/repository/user_repository.go` — GORM orqali foydalanuvchini saqlash va qidirish.
  - `internal/usecase/auth_usecase.go` — Parollarni `bcrypt` orqali xeshlash (`golang.org/x/crypto/bcrypt`), login solishtirish va JWT token yaratish (`golang-jwt/jwt/v5`).
  - `internal/delivery/http/handlers/auth_handler.go` — `/api/auth/register`, `/api/auth/login`, `/api/auth/me`.
  - `internal/delivery/http/middleware/auth.go` — Himoyalangan yo'llar uchun JWT Bearer token tekshiruvchi middleware.
- **Database Migratsiyasi:**
  - `cmd/migrate/main.go` — Baza jadvallarini avtomatik yaratish (`make migrate-up`).
- **Superadmin Seed (Dastlabki ma'lumotlar):**
  - `cmd/seed/main.go` — Dastlabki superadmin hisobini avtomatik bazaga kiritish (`make seed`).
  - **Superadmin Login:** `admin@example.com`
  - **Parol:** `Admin123!`

---

### 🌐 4. Public Web (Next.js 15+ App Router + Shadcn UI + Toza Auth Mantiqi)
- **Standart UI:** **Shadcn UI** sozlamalari (`components.json`, Tailwind CSS, `cn` helper).
- **Toza Auth Logikasi (Vizual oynaga majburlamasdan):**
  - Istagan UI komponentingiz yoki shaklingiz bilan erkin ishlashingiz uchun toza servis va state qatlami beriladi.
  - `src/types/auth.ts` — User, LoginCredentials, RegisterData tiplari.
  - `src/lib/axios.ts` — Request interceptor (har bir so'rovga avtomatik `Authorization: Bearer <token>` qo'shadi) va Response interceptor (401 da tokenni tozalaydi).
  - `src/services/auth.service.ts` — `login()`, `register()`, `getMe()`, `logout()`.
  - `src/hooks/use-auth.ts` — Zustand asosidagi reaktiv `useAuth` hooki (`user`, `token`, `isAuthenticated`, `isLoading`, `login()`, `logout()`).

---

### 📊 5. Admin Panel (React + Vite + Ant Design + Toza Auth Mantiqi)
- **Standart UI:** **Ant Design (`antd`)** — Katta korporativ boshqaruv panellari, jadvallar va layoutlar uchun tayyor kutubxona.
- **Toza Auth Logikasi:**
  - `src/types/auth.ts` — Admin foydalanuvchi tiplari.
  - `src/api/client.ts` — Axios interceptor (`admin_token` bilan avtomatik bog'lanish).
  - `src/api/auth.service.ts` — API chaqiruvlari.
  - `src/hooks/useAuth.ts` — Zustand `useAuth` hooki (`login`, `logout`, `fetchMe`).
  - `src/pages/Dashboard.tsx` — Boshqaruv paneli.

---

### 🛠 6. DevOps & Developer Tooling (Husky, Docker, Makefile)
- **Pre-commit Hooks (Husky + lint-staged):**
  - Dasturchi yoki AI tasodifan xatoli kodni Git-ga commit qilmasligi uchun avtomatik tekshiruv.
- **Docker Compose:**
  - PostgreSQL 16 va Redis 7 konteynerlari tayyor holatda (`make docker-up`).
- **Yagona Makefile:**
  - `npm run dev` / `make dev` — Barcha servislarni bir vaqtda ishga tushirish.
  - `make docker-up` / `make docker-down` — Konteynerlarni boshqarish.
  - `make migrate-up` — Baza migratsiyasini yurgazish.
  - `make seed` — Superadmin hisobini kiritish (`admin@example.com` / `Admin123!`).

---

### 🤖 7. Universal AI Guardrails & Qat'iy Qoidalar Tizimi
Cursor, Claude Code, GitHub Copilot, Antigravity va Windsurf uchun loyiha rootida quyidagi qoidalar avtomatik shakllanadi:
- **`AGENTS.md`** & **`RULES.md`** — Universal xalqaro AI Agent Konstitutsiyasi.
- **`.cursorrules`** & **`.cursor/rules/guardrails.mdc`** — Cursor IDE uchun.
- **`CLAUDE.md`** — Claude Code CLI uchun.
- **`.github/copilot-instructions.md`** — GitHub Copilot uchun.
- **`.windsurfrules`** — Windsurf muharriri uchun.

#### 🛡️ AI uchun o'rnatiladigan 6 ta "Temir Qoida":
1. **Surgical Precision:** Faqat so'ralgan vazifani bajarish. So'ralmagan kodlarni yozish taqiqlanadi.
2. **Impact Analysis:** O'chirish yoki o'zgartirishdan oldin butun loyiha bo'ylab `grep` qilib barcha chaqiruvchilarni tekshirish shart (0 broken references).
3. **Verify Before Done:** `tsc --noEmit`, `npm run lint`, `go vet`, `go test` bajarmasdan ishni "tayyor" deb e'lon qilmaslik.
4. **Mandatory Testing:** Har bir biznes-mantiq uchun unit test yozish.
5. **Architectural Boundaries:** Go Clean Architecture (`domain` -> `usecase` -> `repository` -> `delivery`), Next.js Server Components va bcrypt/JWT qoidalariga bo'ysunish.
6. **No Assumptions:** Noaniq talablarda taxmin qilmasdan foydalanuvchidan so'rash.

---

## 🗂 Generatsiya qilinadigan to'liq struktura

```text
my-project/
├── .cursor/rules/guardrails.mdc   # Cursor yangi MDC qoidalari
├── .cursorrules                   # Cursor klassik qoidalari
├── CLAUDE.md                      # Claude Code CLI qoidalari
├── .github/copilot-instructions.md# GitHub Copilot ko'rsatmalari
├── .windsurfrules                 # Windsurf muharriri qoidalari
├── AGENTS.md                      # Universal AI Agent Konstitutsiyasi
├── RULES.md                       # Dasturchi va AI uchun umumiy qoidalar
├── docker-compose.yml             # PostgreSQL & Redis konteynerlari
├── Makefile                       # Barcha xizmatlarni boshqarish
├── .gitignore                     # Toza git filtri
├── package.json                   # Yagona "npm run dev" (concurrently) & Husky
├── README.md                      # Loyihani ishlatish bo'yicha to'liq qo'llanma
├── my-project-public/             # Next.js 15 + Shadcn UI + Toza Auth logikasi
│   ├── src/
│   │   ├── components/ui/
│   │   ├── hooks/use-auth.ts      # Zustand useAuth hooki
│   │   ├── services/auth.service.ts
│   │   ├── types/auth.ts
│   │   └── lib/axios.ts           # Interceptors bilan sozlangan
│   ├── components.json            # Shadcn konfiguratsiyasi
│   └── .env.local
├── my-project-admin/              # React + Vite + Ant Design + Toza Auth logikasi
│   ├── src/
│   │   ├── api/client.ts          # Interceptors bilan sozlangan
│   │   ├── api/auth.service.ts
│   │   ├── hooks/useAuth.ts
│   │   ├── pages/Dashboard.tsx
│   │   └── types/auth.ts
│   └── .env
└── my-project-backend/            # Go Clean Architecture (Auth + Migrations + Seed)
    ├── cmd/api/main.go            # API server
    ├── cmd/migrate/main.go        # Database migratsiyasi (AutoMigrate)
    ├── cmd/seed/main.go           # Superadmin yaratish
    ├── config/config.go           # .env sozlamalari
    ├── config/database.go         # GORM PostgreSQL ulanishi
    ├── internal/
    │   ├── domain/user.go         # User modeli va DTOlar
    │   ├── repository/            # user_repository.go
    │   ├── usecase/               # auth_usecase.go (bcrypt, jwt)
    │   └── delivery/http/
    │       ├── handlers/          # auth_handler.go (register, login, me)
    │       └── middleware/        # auth.go (JWT AuthMiddleware)
    ├── .env
    └── go.mod
```

---

## ⚙️ O'rnatish va Sozlash

CLI papkasida turib paketlarni o'rnating va global ro'yxatga ulang:

```bash
npm install
npm link
```

---

## 💻 Qanday Ishlatiladi?

Istalgan papkada terminalni ochib, buyruqni bering:

```bash
create-my-stack
```

1. **Yangi loyiha ochish:** Loyiha nomini kiritasiz va kerakli modullarni tanlaysiz.
2. **Mavjud loyihaga modul qo‘shish:** Mavjud loyiha ichida turib yoki uning nomini kiritib buyruq berasiz, CLI faqat yetishmayotgan modullarni taklif qiladi va barcha root sozlamalarni sinxronlashtiradi.
3. **Bitta buyruqda hamma servislarni ishga tushirish:**
   ```bash
   npm run dev
   ```

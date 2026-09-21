# 🚀 Custom Stack CLI Generator (v3.5 Universal Fullstack)

Next.js 15 (Public Web + Shadcn UI), React Vite (Admin Panel + Ant Design), Go Clean Architecture (Backend + Auth + Migrations + Seed), DevOps (Docker, Makefile, Git, Husky), **Tezkor CRUD Generator (`make:crud`)**, **Modulli Tiplar (`*.type.ts`)**, **Yagona `npm run dev`** hamda **barcha AI agentlar uchun qat'iy qoidalar tizimini** avtomatik shakllantiruvchi universal CLI vositasi.

---

## 📌 Asosiy Imkoniyatlar va Standartlar

### 🧩 1. Tezkor CRUD Generator (`create-my-stack make:crud <Model>`)
Yangi biznes model (masalan: `Product`, `Order`, `Category`) qo‘shish kerakmi? Bitta buyruq bilan 3 soniyada Go va Frontendlar uchun to‘liq Clean Architecture skeletini generatsiya qilasiz:

```bash
create-my-stack make:crud Product
# yoki Makefile orqali:
make make-crud ENTITY=Product
```

**Generatsiya qilinadigan fayllar:**
- **Go Backend:**
  - `internal/domain/product.go` — Model, DTOlar va interfeyslar
  - `internal/repository/product_repository.go` — GORM CRUD metodlari
  - `internal/usecase/product_usecase.go` — Biznes mantiq qatlami
  - `internal/delivery/http/handlers/product_handler.go` — REST API handlerlari
  - `cmd/migrate/main.go` — Avtomatik `&domain.Product{}` migratsiyasi
  - `cmd/api/main.go` — `/api/products` yo‘llari avtomatik ulanadi
- **Next.js Public & React Admin:**
  - `src/types/product.type.ts` — TypeScript interfeyslari
  - `src/services/product.service.ts` / `src/api/product.service.ts` — CRUD API xizmati

---

### 📑 2. Modulli va Tartibli Tiplar (`src/types/*.type.ts`)
Deployda modullar bir-biriga bog‘lanib qolmasligi va har bir frontend mustaqil yig‘ilishi (Vercel, Cloudflare, Docker) uchun tiplar tartibli fayllarga ajratilgan:
```text
src/types/
├── common.type.ts      # ApiResponse<T>, PaginatedResponse<T>, QueryParams
├── auth.type.ts        # User, AuthResponse, LoginCredentials
├── product.type.ts     # CRUD generator yaratgan entity tiplari
└── index.ts            # Barcha tiplarni qulay import qilish uchun barrel export
```

**Mustaqil Typegen buyruqlari:**
- `make typegen-public` — Public tiplarini tekshirish
- `make typegen-admin` — Admin tiplarini tekshirish
- `make typegen` — Ikkala frontend tiplarini tekshirish

---

### ⚡ 3. CLI Tezkor Flaglari (Fast Flags)
- `create-my-stack <nomi> --all` — Hech qanday interaktiv savollarsiz barcha standart tavsiya etilgan sozlamalar bilan 5 soniyada loyiha ochish.
- `create-my-stack make:crud <Model>` — Mavjud loyihada yangi model yaratish.
- `create-my-stack -h, --help` — Yordam qo‘llanmasini chiqarish.
- `create-my-stack -v, --version` — CLI versiyasini ko‘rsatish.

---

### ⚡ 4. Yagona `npm run dev` (Bitta terminalda 3 ta servis)
Loyiha root papkasida bitta buyruq bilan barcha mavjud servislarni rang-barang loglar bilan bir vaqtda ishga tushirasiz:

```bash
npm run dev
```

Terminalda bir vaqtda real-time oqimlar:
- `[BACKEND]` (cyan) 🚀 Gin Backend 8080-portda
- `[PUBLIC] ` (blue) ▲ Next.js 15 (http://localhost:3000)
- `[ADMIN]  ` (magenta) ➜ Local: http://localhost:5173/

Alohida ishga tushirish uchun:
- `npm run dev:backend`
- `npm run dev:public`
- `npm run dev:admin`

---

### 🔄 5. Mavjud Loyihaga Yangi Modul Qo‘shish (Incremental Mode)
Boshida faqat Backend va Admin yaratilgan bo‘lsa, keyinchalik xohlagan paytda loyiha papkasida `create-my-stack` buyrug‘ini berib, yetishmayotgan modulni (Public) qo‘shish mumkin. Barcha `package.json`, `Makefile` va AI qoidalari avtomatik sinxronlanadi!

---

### ⚡ 6. Backend API (Go Clean Architecture + Auth + Migratsiya + Seed)
- **To'liq Clean Architecture Auth:**
  - `internal/domain/user.go` — `User` modeli, DTOlar va interfeyslar.
  - `internal/repository/user_repository.go` — GORM CRUD.
  - `internal/usecase/auth_usecase.go` — `bcrypt` xeshlash va JWT token yaratish.
  - `internal/delivery/http/handlers/auth_handler.go` — `/register`, `/login`, `/me`.
  - `internal/delivery/http/middleware/auth.go` — JWT Bearer middleware.
- **Database Migratsiyasi:**
  - `cmd/migrate/main.go` — `make migrate-up`.
- **Superadmin Seed:**
  - `cmd/seed/main.go` — `make seed` (`admin@example.com` / `Admin123!`).

---

### 🌐 7. Public Web (Next.js 15 + Shadcn UI + Toza Auth Mantiqi)
- **Standart UI:** **Shadcn UI** sozlamalari (`components.json`, Tailwind CSS, `cn` helper).
- **Toza Auth Logikasi:** Vizual oynaga bog‘lanmagan holda `src/services/auth.service.ts`, `src/hooks/use-auth.ts` va `src/lib/axios.ts` (Interceptorlar bilan).

---

### 📊 8. Admin Panel (React + Vite + Ant Design + Toza Auth Mantiqi)
- **Standart UI:** **Ant Design (`antd`)** — Korporativ boshqaruv panellari uchun tayyor komponentlar.
- **Toza Auth Logikasi:** `src/api/auth.service.ts`, `src/hooks/useAuth.ts` va `src/api/client.ts`.

---

### 🤖 9. Universal AI Guardrails & Qat'iy Qoidalar Tizimi
Cursor, Claude Code, GitHub Copilot, Antigravity va Windsurf uchun loyiha rootida qoidalar:
- **`AGENTS.md`** & **`RULES.md`**, **`.cursorrules`** & **`.cursor/rules/guardrails.mdc`**, **`CLAUDE.md`**, **`.github/copilot-instructions.md`**, **`.windsurfrules`**.

---

## 🗂 Loyiha strukturasi

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
├── Makefile                       # Yagona boshqaruv buyruqlari
├── .gitignore                     # Toza git filtri
├── package.json                   # Yagona "npm run dev" (concurrently) & Husky
├── README.md                      # Loyihani ishlatish bo'yicha to'liq qo'llanma
├── my-project-public/             # Next.js 15 + Shadcn UI + Modulli Tiplar
│   ├── src/
│   │   ├── types/
│   │   │   ├── common.type.ts
│   │   │   ├── auth.type.ts
│   │   │   └── index.ts
│   │   ├── hooks/use-auth.ts
│   │   ├── services/auth.service.ts
│   │   └── lib/axios.ts
│   └── components.json
├── my-project-admin/              # React + Vite + Ant Design + Modulli Tiplar
│   ├── src/
│   │   ├── types/
│   │   │   ├── common.type.ts
│   │   │   ├── auth.type.ts
│   │   │   └── index.ts
│   │   ├── api/client.ts
│   │   ├── api/auth.service.ts
│   │   └── hooks/useAuth.ts
│   └── .env
└── my-project-backend/            # Go Clean Architecture (Auth + Migrations + Seed)
    ├── cmd/api/main.go            # API server
    ├── cmd/migrate/main.go        # Database migratsiyasi
    ├── cmd/seed/main.go           # Superadmin yaratish
    ├── config/config.go           # .env sozlamalari
    ├── config/database.go         # GORM PostgreSQL ulanishi
    ├── internal/
    │   ├── domain/user.go
    │   ├── repository/user_repository.go
    │   ├── usecase/auth_usecase.go
    │   └── delivery/http/
    │       ├── handlers/auth_handler.go
    │       └── middleware/auth.go
    ├── .env
    └── go.mod
```

---

## ⚡ Foydalanish qadamlari:

```bash
# 1. Tezkor yangi loyiha ochish (interaktiv):
create-my-stack

# yoki bir zumda barcha standartlar bilan ochish:
create-my-stack my-app --all

# 2. Loyihaga kirish va barcha qismlarni yurgazish:
cd my-app
make docker-up
make migrate-up
make seed
npm run dev

# 3. Yangi biznes model va to‘liq CRUD yaratish:
create-my-stack make:crud Product
```

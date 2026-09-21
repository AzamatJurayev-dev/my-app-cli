# 🚀 Custom Stack CLI Generator (v2.5 AI-Ready PRO)

Next.js 15 (Public Web), React Vite (Admin Panel), Go Clean Architecture (Backend), DevOps (Docker, Makefile, Git) va **barcha AI agentlar (Cursor, Claude, Copilot, Antigravity, Windsurf) uchun qat'iy qoidalar tizimini** avtomatik shakllantiruvchi universal CLI vositasi.

---

## 📌 Yangi Imkoniyatlar va Xususiyatlar

### 🤖 1. Universal AI Guardrails & Qat'iy Qoidalar Tizimi
Ko'pincha sun'iy intellekt vositalari (Cursor, Claude Code, GitHub Copilot, Antigravity) bilan ishlaganda quyidagi muammolar kuzatiladi:
- Keraksiz va ortiqcha kodlar yozish (*Over-engineering*).
- Yozgan kodini tekshirmasdan tashlab ketish.
- Biron fayl yoki funksiyani o'chirishdan oldin loyihaning boshqa joylariga ta'sirini o'rganmaslik (natijada runtime errorlar).
- Taskdan chiqib ketish va arxitekturani buzish.

**Bizning CLI vositamiz ushbu muammoni ildizi bilan hal qiladi!** Har safar loyiha yaratilganda, barcha AI modellar o'qiydigan quyidagi fayllar avtomatik generatsiya qilinadi:
- **`AGENTS.md`** & **`RULES.md`** — Universal xalqaro AI Agent standarti (OpenAI, DeepMind, Next.js).
- **`.cursorrules`** & **`.cursor/rules/guardrails.mdc`** — Cursor IDE uchun qat'iy qoidalar.
- **`CLAUDE.md`** — Anthropic Claude Code terminal vositasi uchun buyruqlar va cheklovlar.
- **`.github/copilot-instructions.md`** — GitHub Copilot va VS Code Copilot agenti uchun ko'rsatmalar.
- **`.windsurfrules`** — Windsurf (Codeium) muharriri uchun qoidalar.

#### 🛡️ AI uchun o'rnatiladigan 6 ta "Temir Qoida":
1. **Surgical Precision (Minimalizm):** Faqat va faqat so'ralgan vazifani bajarish. So'ralmagan funksiyalarni, kutubxonalarni o'zboshimchalik bilan qo'shish va mavjud ishlab turgan kodni ruxsatsiz o'zgartirish qat'iyan taqiqlanadi.
2. **Compulsory Impact Analysis (O'chirishdan oldin chuqur tahlil):** Biron funksiya, model yoki faylni o'chirishdan oldin loyiha bo'ylab `grep` qilib barcha chaqiruvchilarni tekshirish SHART. Bitta ham buzilgan import yoki xatolik qolmasligi lozim.
3. **Verify Before Done (Majburiy tekshiruv):** AI kod yozgach `tsc --noEmit`, `npm run lint`, `go vet`, `go test` buyruqlarini bajarmaguncha va 0 ta xatolikni ta'minlamaguncha ishni "tayyor" deb e'lon qila olmaydi.
4. **Mandatory Testing (Test yozish majburiyati):** Har bir yangi biznes-mantiq (usecase, service, helper) uchun unit test yozilishi shart.
5. **Architectural Boundaries (Arxitektura chegaralari):** Go Clean Architecture (`domain` -> `usecase` -> `repository` -> `delivery`) va Next.js Server Components qoidalariga so'zsiz bo'ysunish.
6. **No Assumptions (Gumon bo'lsa — so'rash):** Noaniq yoki ziddiyatli talablarda o'zidan to'qimasdan foydalanuvchidan aniqlashtirish.

---

### 🌐 2. Public Web (Next.js 15+ App Router)
- TypeScript, Tailwind CSS, App Router va toza arxitektura (`src/components`, `hooks`, `services`, `types`, `lib`, `constants`).
- **Kutubxonalar tanlovi:** `@tanstack/react-query`, `zustand`, `react-hook-form` + `zod`, `axios`, `lucide-react`, `framer-motion`.
- Avtomatik `cn` helper, `apiClient` va `.env.local` sozlamalari.

### 📊 3. Admin Panel (React + Vite + TypeScript)
- **UI Dizayn tizimi tanlovi:**
  - **Ant Design** (Tayyor korporativ jadvallar, filtrlar va layoutlar)
  - **Mantine UI** (Zamonaviy va boy komponentlar to'plami)
  - **Tailwind CSS + Lucide Icons** (Moslashuvchan va yengil)
- **Kutubxonalar:** `@tanstack/react-table`, `recharts` (dashboard diagrammalari), `react-router-dom`, `zustand`, `axios`.

### ⚡ 4. Backend API (Go Clean Architecture)
- **Framework tanlovi:** **Gin**, **Fiber**, **Chi**, yoki **Standart net/http**.
- **Database / ORM tanlovi:** **PostgreSQL + GORM** (avtomatik migratsiya va modellar), **PostgreSQL + pgx/sqlx**, yoki minimal shablon.
- **Qo'shimcha:** JWT autentifikatsiya middleware (`golang-jwt/jwt/v5`), CORS middleware va `.env` boshqaruvi.

### 🛠 5. DevOps & Developer Tooling
- `docker-compose.yml` (PostgreSQL 16 va Redis 7 konteynerlari tayyor healthcheck bilan).
- `Makefile` (`make docker-up`, `make dev-backend`, `make dev-public`, `make dev-admin`).
- Avtomatik `git init` va har bir tilga moslangan toza `.gitignore`.

---

## 🗂 Generatsiya qilinadigan to'liq struktura

```text
my-project/
├── .cursor/rules/guardrails.mdc   # Cursor yangi MDC qoidalari
├── .cursorrules                   # Cursor klassik qoidalari
├── CLAUDE.md                      # Claude Code CLI qoidalari va buyruqlari
├── .github/copilot-instructions.md# GitHub Copilot ko'rsatmalari
├── .windsurfrules                 # Windsurf muharriri qoidalari
├── AGENTS.md                      # Universal AI Agent Konstitutsiyasi
├── RULES.md                       # Dasturchi va AI uchun umumiy qoidalar
├── docker-compose.yml             # PostgreSQL & Redis konteynerlari
├── Makefile                       # Yagona boshqaruv buyruqlari
├── .gitignore                     # Node, Go, OS va muhit fayllari uchun toza filtr
├── README.md                      # Loyihani ishlatish bo'yicha to'liq qo'llanma
├── my-project-public/             # Next.js 15 App Router
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── lib/
│   └── .env.local
├── my-project-admin/              # React + Vite (Antd / Mantine / Tailwind)
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── types/
│   └── .env
└── my-project-backend/            # Go Clean Architecture (Gin / Fiber / GORM)
    ├── cmd/api/main.go
    ├── config/
    ├── internal/                  # delivery, domain, usecase, repository
    ├── pkg/logger/
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

1. **Loyiha nomi:** Masalan: `super-app`.
2. **Modullarni belgilash:** `Public Web`, `Admin Panel`, `Backend API`, `DevOps`, `AI Guardrails & Rules`.
3. **Kutubxonalar va AI vositalarini tanlash.**
4. **Bir necha soniyada:** Barcha modullar, toza arxitektura va AIni jilovlovchi barcha qoidalar avtomatik tayyor bo'ladi!

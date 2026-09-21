import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export async function askQuestions(initialName) {
  const currentDir = process.cwd();
  const currentDirName = path.basename(currentDir);

  // 1. Tekshiruv: Foydalanuvchi joriy vaqtda biron mavjud loyiha ichida turibdimi?
  const cwdHasPublic = fs.existsSync(path.join(currentDir, `${currentDirName}-public`));
  const cwdHasAdmin = fs.existsSync(path.join(currentDir, `${currentDirName}-admin`));
  const cwdHasBackend = fs.existsSync(path.join(currentDir, `${currentDirName}-backend`));

  let isIncremental = false;
  let targetRootPath = '';
  let projectName = '';
  let existingComponents = [];
  let selectedComponents = [];

  if (cwdHasPublic || cwdHasAdmin || cwdHasBackend) {
    const existingList = [];
    if (cwdHasPublic) { existingComponents.push('public'); existingList.push('Public Web (Next.js)'); }
    if (cwdHasAdmin) { existingComponents.push('admin'); existingList.push('Admin Panel (React + Vite)'); }
    if (cwdHasBackend) { existingComponents.push('backend'); existingList.push('Backend API (Go)'); }

    console.log(chalk.bold.cyan(`\n🔍 Siz hozir mavjud [${currentDirName}] loyihasi ichidasiz!`));
    console.log(chalk.yellow(`Mavjud modullar: ${existingList.join(', ')}\n`));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Qanday amalni bajarmoqchisiz?',
        choices: [
          { name: `➕ Ushbu [${currentDirName}] loyihasiga yangi modul qo‘shish`, value: 'add' },
          { name: '🆕 Boshqa yangi alohida loyiha yaratish', value: 'new' }
        ]
      }
    ]);

    if (action === 'add') {
      isIncremental = true;
      projectName = currentDirName;
      targetRootPath = currentDir;
    } else {
      // "Yangi loyiha" tanlandi — eski modullar ro'yxatini tozalash
      existingComponents = [];
    }
  }

  // 2. Agar joriy papka emas, yangi loyiha nomi so'ralsa
  if (!isIncremental) {
    let projectNameInput = initialName;
    if (!projectNameInput) {
      const nameAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Loyiha nomini kiriting (Root papka):',
          default: initialName || 'my-app',
          validate: (input) => {
            const trimmed = input.trim();
            if (!trimmed) return 'Loyiha nomi bo‘sh bo‘lishi mumkin emas!';
            if (/[<>:"/\\|?*]/.test(trimmed)) {
              return 'Loyiha nomida taqiqlangan belgilar bo‘lishi mumkin emas (<>:"/\\|?*)!';
            }
            return true;
          }
        }
      ]);
      projectNameInput = nameAnswer.projectName.trim();
    }

    projectName = projectNameInput;
    targetRootPath = path.resolve(currentDir, projectName);

    // Kiritilgan papka ichida avval ochilgan modullarni tekshirish
    if (fs.existsSync(targetRootPath)) {
      const folderHasPublic = fs.existsSync(path.join(targetRootPath, `${projectName}-public`));
      const folderHasAdmin = fs.existsSync(path.join(targetRootPath, `${projectName}-admin`));
      const folderHasBackend = fs.existsSync(path.join(targetRootPath, `${projectName}-backend`));

      if (folderHasPublic || folderHasAdmin || folderHasBackend) {
        const existingList = [];
        if (folderHasPublic) { existingComponents.push('public'); existingList.push('Public Web (Next.js)'); }
        if (folderHasAdmin) { existingComponents.push('admin'); existingList.push('Admin Panel (React + Vite)'); }
        if (folderHasBackend) { existingComponents.push('backend'); existingList.push('Backend API (Go)'); }

        console.log(chalk.bold.cyan(`\n🔍 [${projectName}] papkasida avval yaratilgan modullar aniqlandi!`));
        console.log(chalk.yellow(`Mavjud modullar: ${existingList.join(', ')}\n`));

        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'Qanday amalni bajarmoqchisiz?',
            choices: [
              { name: `➕ Mavjud [${projectName}] loyihasiga yangi modul qo‘shish`, value: 'add' },
              { name: '❌ Bekor qilish', value: 'cancel' }
            ]
          }
        ]);

        if (action === 'cancel') {
          console.log('\n❌ Jarayon bekor qilindi.\n');
          process.exit(0);
        }

        isIncremental = true;
      }
    }
  }

  // 3. Modullar tanlovi:
  if (isIncremental) {
    // Mavjud bo'lmagan modullarni taklif qilish
    const incrementalChoices = [];
    if (!existingComponents.includes('public')) {
      incrementalChoices.push({ name: 'Public Web (Next.js 15+ App Router, Tailwind, Shadcn)', value: 'public' });
    }
    if (!existingComponents.includes('admin')) {
      incrementalChoices.push({ name: 'Admin Panel (React + Vite + Ant Design)', value: 'admin' });
    }
    if (!existingComponents.includes('backend')) {
      incrementalChoices.push({ name: 'Backend API (Go Clean Architecture + Auth + Migrations)', value: 'backend' });
    }

    if (incrementalChoices.length === 0) {
      console.log(chalk.green(`\n🎉 [${projectName}] loyihasida barcha asosiy modullar (Public, Admin, Backend) allaqachon mavjud!\n`));
      process.exit(0);
    }

    const incAnswer = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'components',
        message: `[Space] bilan belgilang — qaysi yangi modulni qo‘shmoqchisiz?:`,
        choices: incrementalChoices,
        validate: (selected) => (selected.length > 0 ? true : 'Kamida bitta modulni tanlashingiz kerak!')
      }
    ]);
    selectedComponents = incAnswer.components;
  } else {
    // Yangi loyiha ochishda: ANIQ VA QULAY PRESETLAR (xatolik bo'lmasligi uchun)
    const { stackType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'stackType',
        message: 'Loyiha tarkibi va arxitekturasini tanlang:',
        choices: [
          {
            name: '🏢 Admin Panel & Go Backend (Next.js-siz, faqat Admin va Go Backend)',
            value: 'admin-backend'
          },
          {
            name: '🚀 To‘liq Full-Stack (Next.js Public + React Admin + Go Backend)',
            value: 'fullstack'
          },
          {
            name: '🌐 Public Web & Go Backend (Next.js Public va Go Backend)',
            value: 'public-backend'
          },
          {
            name: '⚡ Faqat Go Backend API (Clean Architecture + Auth)',
            value: 'backend-only'
          },
          {
            name: '📊 Faqat React Admin Panel (Ant Design)',
            value: 'admin-only'
          },
          {
            name: '🌐 Faqat Next.js Public Web (Shadcn UI)',
            value: 'public-only'
          },
          {
            name: '🛠 Moslashuvchan tanlov (Har bir modulni o‘zingiz belgilaysiz)',
            value: 'custom'
          }
        ]
      }
    ]);

    if (stackType === 'admin-backend') {
      selectedComponents = ['admin', 'backend', 'devops', 'airules'];
    } else if (stackType === 'fullstack') {
      selectedComponents = ['public', 'admin', 'backend', 'devops', 'airules'];
    } else if (stackType === 'public-backend') {
      selectedComponents = ['public', 'backend', 'devops', 'airules'];
    } else if (stackType === 'backend-only') {
      selectedComponents = ['backend', 'devops', 'airules'];
    } else if (stackType === 'admin-only') {
      selectedComponents = ['admin', 'devops', 'airules'];
    } else if (stackType === 'public-only') {
      selectedComponents = ['public', 'devops', 'airules'];
    } else {
      // Custom rejim: barchasi boshida ochiq (unchecked), foydalanuvchi o'zi belgilaydi
      const customAnswer = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'components',
          message: 'Kerakli modullarni [Space] bilan belgilang (faqat belgilanganlari yaratiladi):',
          choices: [
            { name: 'Public Web (Next.js 15+ App Router, Tailwind, Shadcn)', value: 'public', checked: false },
            { name: 'Admin Panel (React + Vite + Ant Design)', value: 'admin', checked: false },
            { name: 'Backend API (Go Clean Architecture + Auth + Migrations)', value: 'backend', checked: false },
            { name: 'DevOps & Tooling (Docker, Makefile, Git, Husky)', value: 'devops', checked: true },
            { name: 'AI Guardrails & Rules (Cursor, Claude, Copilot, Antigravity uchun qat‘iy qoidalar)', value: 'airules', checked: true }
          ],
          validate: (selected) => (selected.length > 0 ? true : 'Kamida bitta modulni tanlashingiz kerak!')
        }
      ]);
      selectedComponents = customAnswer.components;
    }
    let useRecommendedDefaults = false;
    if (stackType !== 'custom') {
      const { configPreference } = await inquirer.prompt([
        {
          type: 'list',
          name: 'configPreference',
          message: 'Qanday sozlamalar bilan davom etamiz?',
          choices: [
            {
              name: '⭐ [Tavsiya etilgan eng yaxshi sozlamalar] (Tezkor: Gin + GORM + Ant Design + Barcha toollar)',
              value: 'recommended'
            },
            {
              name: '⚙️ [Qo‘lda sozlash] (Har bir framework, UI va ma‘lumotlar bazasini o‘zim tanlayman)',
              value: 'custom'
            }
          ]
        }
      ]);
      useRecommendedDefaults = (configPreference === 'recommended');
    }

    if (useRecommendedDefaults) {
      return {
        projectName,
        rootPath: targetRootPath,
        isIncremental,
        existingComponents,
        newComponents: selectedComponents,
        components: selectedComponents,
        allActiveComponents: selectedComponents,
        publicLibs: ['shadcn', 'react-query', 'zustand', 'form-zod', 'axios', 'lucide'],
        adminUI: 'antd',
        adminLibs: ['router', 'auth-logic', 'table', 'recharts', 'react-query', 'zustand', 'axios'],
        goFramework: 'gin',
        goDatabase: 'gorm',
        goExtras: ['auth-flow', 'migrate-seed', 'jwt', 'cors', 'swagger'],
        devopsTools: ['docker', 'makefile', 'git', 'husky', 'readme'],
        aiToolList: ['universal', 'cursor', 'claude', 'copilot', 'windsurf']
      };
    }
  }

  const detailedQuestions = [];

  // 4. Next.js Public sozlamalari (FAQAT va FAQAT public tanlangan bo'lsa)
  if (selectedComponents.includes('public')) {
    detailedQuestions.push({
      type: 'checkbox',
      name: 'publicLibs',
      message: '🌐 [Next.js] Qo‘shimcha qaysi kutubxonalarni o‘rnatmoqchisiz?',
      choices: [
        { name: '⭐ Shadcn UI sozlamalari (Tavsiya etiladi - Tailwind komponentlar arxitekturasi)', value: 'shadcn', checked: true },
        { name: '@tanstack/react-query (Server state & keshlash)', value: 'react-query', checked: true },
        { name: 'Zustand (Client global state & Auth store)', value: 'zustand', checked: true },
        { name: 'React Hook Form + Zod (Form boshqaruvi va validatsiya)', value: 'form-zod', checked: true },
        { name: 'Axios (HTTP client & Auth Interceptor)', value: 'axios', checked: true },
        { name: 'Lucide React (Ikonkalar to‘plami)', value: 'lucide', checked: true },
        { name: 'Framer Motion (Animatsiyalar)', value: 'framer-motion', checked: false }
      ]
    });
  }

  // 5. React Admin sozlamalari (FAQAT va FAQAT admin tanlangan bo'lsa)
  if (selectedComponents.includes('admin')) {
    detailedQuestions.push(
      {
        type: 'list',
        name: 'adminUI',
        message: '📊 [Admin Panel] Qaysi UI dizayn tizimidan foydalanmoqchisiz?',
        default: 'antd',
        choices: [
          { name: '⭐ Ant Design (Tavsiya etiladi - Tayyor korporativ Admin UI komponentlari & jadvallar)', value: 'antd' },
          { name: 'Tailwind CSS + Lucide Icons (Moslashuvchan va yengil)', value: 'tailwind' },
          { name: 'Mantine UI (Zamonaviy va boy komponentlar kutubxonasi)', value: 'mantine' }
        ]
      },
      {
        type: 'checkbox',
        name: 'adminLibs',
        message: '📊 [Admin Panel] Qo‘shimcha toollar va mantiq:',
        choices: [
          { name: 'React Router DOM (Sahifalar marshruti)', value: 'router', checked: true },
          { name: 'Auth Logic & Interceptors (Avtomatik token ulash va login holati)', value: 'auth-logic', checked: true },
          { name: '@tanstack/react-table (Katta ma\'lumotlar jadvallari)', value: 'table', checked: true },
          { name: 'Recharts (Dashboard grafik va diagrammalari)', value: 'recharts', checked: true },
          { name: '@tanstack/react-query (Server data fetching)', value: 'react-query', checked: true },
          { name: 'Zustand (Admin holat boshqaruvi)', value: 'zustand', checked: true },
          { name: 'Axios (API so‘rovlar)', value: 'axios', checked: true }
        ]
      }
    );
  }

  // 6. Go Backend sozlamalari (FAQAT va FAQAT backend tanlangan bo'lsa)
  if (selectedComponents.includes('backend')) {
    detailedQuestions.push(
      {
        type: 'list',
        name: 'goFramework',
        message: '⚡ [Go Backend] Qaysi HTTP router/frameworkni tanlaysiz?',
        choices: [
          { name: '⭐ Gin Web Framework (Tavsiya etiladi - Clean Architecture uchun eng barqaror va ommabop)', value: 'gin' },
          { name: 'Fiber (Express.js uslubidagi ultra tezkor framework)', value: 'fiber' },
          { name: 'Chi Router (Standart net/http bilan 100% mos va ixcham)', value: 'chi' },
          { name: 'Standart net/http (Hech qanday qo‘shimcha frameworksiz)', value: 'standard' }
        ]
      },
      {
        type: 'list',
        name: 'goDatabase',
        message: '⚡ [Go Backend] Ma\'lumotlar bazasi va ORM/Driver:',
        choices: [
          { name: '⭐ PostgreSQL + GORM (Tavsiya etiladi - Clean Architecture & Auto-migration)', value: 'gorm' },
          { name: 'PostgreSQL + pgx/sqlx (Yuqori tezlikdagi toza SQL)', value: 'pgx' },
          { name: 'Hozircha database ulanmasin (Minimal shablon)', value: 'none' }
        ]
      },
      {
        type: 'checkbox',
        name: 'goExtras',
        message: '⚡ [Go Backend] Qo‘shimcha modullar va mantiq:',
        choices: [
          { name: 'Clean Architecture Auth Flow (/register, /login, /me, bcrypt)', value: 'auth-flow', checked: true },
          { name: 'Database Migrations & Seed (cmd/migrate va cmd/seed superadmin)', value: 'migrate-seed', checked: true },
          { name: 'JWT Autentifikatsiya middleware (golang-jwt/jwt/v5)', value: 'jwt', checked: true },
          { name: 'CORS Middleware (Frontendlar bilan muammosiz bog‘lanish)', value: 'cors', checked: true },
          { name: 'Swagger / OpenAPI tayyor struktura', value: 'swagger', checked: true }
        ]
      }
    );
  }

  // 7. DevOps vositalari (agar yangi loyihada tanlangan bo'lsa)
  if (!isIncremental && selectedComponents.includes('devops')) {
    detailedQuestions.push({
      type: 'checkbox',
      name: 'devopsTools',
      message: '🛠 [DevOps] Qaysi qo‘shimcha vositalar avtomatik generatsiya qilinsin?',
      choices: [
        { name: 'Pre-commit Hooks (Husky + lint-staged - xatoliklarni commit oldidan ushlaydi)', value: 'husky', checked: true },
        { name: 'docker-compose.yml (PostgreSQL, Redis va servislar)', value: 'docker', checked: true },
        { name: 'Makefile (Yagona boshqaruv va bitta buyruqda ishga tushirish)', value: 'makefile', checked: true },
        { name: 'Git initsializatsiyasi va mukammal .gitignore', value: 'git', checked: true },
        { name: 'Loyiha uchun to‘liq yo‘riqnoma (Root README.md)', value: 'readme', checked: true }
      ]
    });
  }

  // 8. AI Agent Guardrails (agar yangi loyihada tanlangan bo'lsa)
  if (!isIncremental && selectedComponents.includes('airules')) {
    detailedQuestions.push({
      type: 'checkbox',
      name: 'aiToolList',
      message: '🤖 [AI Guardrails] Qaysi AI vositalari uchun qoidalar generatsiya qilinsin?',
      choices: [
        { name: 'Universal Agent Standarti (AGENTS.md & RULES.md)', value: 'universal', checked: true },
        { name: 'Cursor IDE (.cursorrules va .cursor/rules/)', value: 'cursor', checked: true },
        { name: 'Claude Code (CLAUDE.md)', value: 'claude', checked: true },
        { name: 'GitHub Copilot & VS Code (.github/copilot-instructions.md)', value: 'copilot', checked: true },
        { name: 'Windsurf (.windsurfrules)', value: 'windsurf', checked: true }
      ]
    });
  }

  const detailedAnswers = detailedQuestions.length > 0 ? await inquirer.prompt(detailedQuestions) : {};

  // Barcha faol modullar ro'yxati (avvalgi + yangi qo'shilgan)
  const allActiveComponents = [...new Set([...existingComponents, ...selectedComponents])];

  return {
    projectName,
    rootPath: targetRootPath,
    isIncremental,
    existingComponents,
    newComponents: selectedComponents,
    components: selectedComponents,
    allActiveComponents,
    ...detailedAnswers
  };
}

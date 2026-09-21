import inquirer from 'inquirer';

export async function askQuestions() {
  // 1. Asosiy savollar
  const baseAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Loyiha nomini kiriting (Root papka):',
      default: 'my-app',
      validate: (input) => {
        const trimmed = input.trim();
        if (!trimmed) return 'Loyiha nomi bo‘sh bo‘lishi mumkin emas!';
        if (/[<>:"/\\|?*]/.test(trimmed)) {
          return 'Loyiha nomida taqiqlangan belgilar bo‘lishi mumkin emas (<>:"/\\|?*)!';
        }
        return true;
      }
    },
    {
      type: 'checkbox',
      name: 'components',
      message: 'Ushbu loyihada qaysi modullar kerak bo‘ladi? (Space bilan belgilang):',
      choices: [
        { name: 'Public Web (Next.js 15+ App Router, Tailwind)', value: 'public', checked: true },
        { name: 'Admin Panel (React + Vite + TypeScript)', value: 'admin', checked: true },
        { name: 'Backend API (Go Clean Architecture)', value: 'backend', checked: true },
        { name: 'DevOps & Tooling (Docker Compose, Makefile, Git)', value: 'devops', checked: true },
        { name: 'AI Guardrails & Rules (Cursor, Claude, Copilot, Antigravity uchun qat‘iy qoidalar)', value: 'airules', checked: true }
      ],
      validate: (selected) => (selected.length > 0 ? true : 'Kamida bitta modulni tanlashingiz kerak!')
    }
  ]);

  const detailedQuestions = [];

  // 2. Next.js Public sozlamalari
  if (baseAnswers.components.includes('public')) {
    detailedQuestions.push({
      type: 'checkbox',
      name: 'publicLibs',
      message: '🌐 [Next.js] Qo‘shimcha qaysi kutubxonalarni o‘rnatmoqchisiz?',
      choices: [
        { name: '@tanstack/react-query (Server state & keshlash)', value: 'react-query', checked: true },
        { name: 'Zustand (Client global state)', value: 'zustand', checked: true },
        { name: 'React Hook Form + Zod (Form boshqaruvi va validatsiya)', value: 'form-zod', checked: true },
        { name: 'Axios (HTTP client)', value: 'axios', checked: true },
        { name: 'Lucide React (Ikonkalar to‘plami)', value: 'lucide', checked: true },
        { name: 'Framer Motion (Animatsiyalar)', value: 'framer-motion', checked: false }
      ]
    });
  }

  // 3. React Admin sozlamalari
  if (baseAnswers.components.includes('admin')) {
    detailedQuestions.push(
      {
        type: 'list',
        name: 'adminUI',
        message: '📊 [Admin Panel] Qaysi UI dizayn tizimidan foydalanmoqchisiz?',
        choices: [
          { name: 'Tailwind CSS + Lucide Icons (Eng moslashuvchan va yengil)', value: 'tailwind' },
          { name: 'Ant Design (Tayyor korporativ Admin UI komponentlari & jadvallar)', value: 'antd' },
          { name: 'Mantine UI (Zamonaviy va boy komponentlar kutubxonasi)', value: 'mantine' }
        ]
      },
      {
        type: 'checkbox',
        name: 'adminLibs',
        message: '📊 [Admin Panel] Qo‘shimcha toollar:',
        choices: [
          { name: 'React Router DOM (Sahifalar marshruti)', value: 'router', checked: true },
          { name: '@tanstack/react-table (Katta ma\'lumotlar jadvallari)', value: 'table', checked: true },
          { name: 'Recharts (Dashboard grafik va diagrammalari)', value: 'recharts', checked: true },
          { name: '@tanstack/react-query (Server data fetching)', value: 'react-query', checked: true },
          { name: 'Zustand (Admin holat boshqaruvi)', value: 'zustand', checked: true },
          { name: 'Axios (API so‘rovlar)', value: 'axios', checked: true }
        ]
      }
    );
  }

  // 4. Go Backend sozlamalari
  if (baseAnswers.components.includes('backend')) {
    detailedQuestions.push(
      {
        type: 'list',
        name: 'goFramework',
        message: '⚡ [Go Backend] Qaysi HTTP router/frameworkni tanlaysiz?',
        choices: [
          { name: 'Gin Web Framework (Eng mashhur, qulay va keng tarqalgan)', value: 'gin' },
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
          { name: 'PostgreSQL + GORM (Clean Architecture & Auto-migration)', value: 'gorm' },
          { name: 'PostgreSQL + pgx/sqlx (Yuqori tezlikdagi toza SQL)', value: 'pgx' },
          { name: 'Hozircha database ulanmasin (Minimal shablon)', value: 'none' }
        ]
      },
      {
        type: 'checkbox',
        name: 'goExtras',
        message: '⚡ [Go Backend] Qo‘shimcha modullar:',
        choices: [
          { name: 'JWT Autentifikatsiya middleware (golang-jwt/jwt/v5)', value: 'jwt', checked: true },
          { name: 'CORS Middleware (Frontendlar bilan muammosiz bog‘lanish)', value: 'cors', checked: true },
          { name: 'Swagger / OpenAPI tayyor struktura', value: 'swagger', checked: true }
        ]
      }
    );
  }

  // 5. DevOps vositalari
  if (baseAnswers.components.includes('devops')) {
    detailedQuestions.push({
      type: 'checkbox',
      name: 'devopsTools',
      message: '🛠 [DevOps] Qaysi qo‘shimcha vositalar avtomatik generatsiya qilinsin?',
      choices: [
        { name: 'docker-compose.yml (PostgreSQL, Redis va servislar)', value: 'docker', checked: true },
        { name: 'Makefile (Yagona boshqaruv va bitta buyruqda ishga tushirish)', value: 'makefile', checked: true },
        { name: 'Git initsializatsiyasi va mukammal .gitignore', value: 'git', checked: true },
        { name: 'Loyiha uchun to‘liq yo‘riqnoma (Root README.md)', value: 'readme', checked: true }
      ]
    });
  }

  // 6. AI Agent Guardrails
  if (baseAnswers.components.includes('airules')) {
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

  return {
    ...baseAnswers,
    ...detailedAnswers
  };
}

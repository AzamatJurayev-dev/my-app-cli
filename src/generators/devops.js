import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export async function generateDevops(rootPath, projectName, options) {
  const selectedTools = options.devopsTools || ['docker', 'makefile', 'git', 'husky', 'readme'];
  const spinner = logger.spinner('DevOps vositalari va Yagona "npm run dev" sozlanmoqda...').start();

  try {
    const allComponents = options.allActiveComponents || options.components || [];
    const hasPublic = allComponents.includes('public');
    const hasAdmin = allComponents.includes('admin');
    const hasBackend = allComponents.includes('backend');

    const publicFolder = `${projectName}-public`;
    const adminFolder = `${projectName}-admin`;
    const backendFolder = `${projectName}-backend`;

    // 1. .gitignore yaratish
    if (selectedTools.includes('git') || !fs.existsSync(path.join(rootPath, '.gitignore'))) {
      const gitignoreContent = `# Node.js dependencies & builds
node_modules/
.next/
dist/
build/
*.tsbuildinfo
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Environment Variables
.env
.env.local
.env.*.local
!.env.example

# Go build files
bin/
*.exe
*.exe~
*.dll
*.so
*.dylib

# Docker
.dockerignore

# OS & IDE
.DS_Store
Thumbs.db
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
`;
      fs.writeFileSync(path.join(rootPath, '.gitignore'), gitignoreContent);

      // git init
      try {
        execSync('git init', { cwd: rootPath, stdio: 'ignore' });
      } catch (e) {
        // git bo'lmasa o'tkazib yuborish
      }
    }

    // 2. Root package.json: Yagona "npm run dev" (concurrently) va Pre-commit Hooks (Husky)
    const packageJsonPath = path.join(rootPath, 'package.json');
    let rootPkg = {
      name: `${projectName}-workspace`,
      private: true,
      scripts: {
        "prepare": "husky"
      },
      "lint-staged": {
        "*.{ts,tsx,js,jsx}": ["eslint --fix"]
      }
    };

    if (fs.existsSync(packageJsonPath)) {
      try {
        const existingPkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        rootPkg = { ...existingPkg, scripts: { ...(existingPkg.scripts || {}) } };
      } catch (e) {
        // format xato bo'lsa yangitdan shakllantiramiz
      }
    }

    // Skriptlar ro'yxatini shakllantirish
    const devNames = [];
    const devColors = [];
    const devCommands = [];

    if (hasBackend) {
      rootPkg.scripts["dev:backend"] = `cd ${backendFolder} && go run cmd/api/main.go`;
      devNames.push('BACKEND');
      devColors.push('cyan');
      devCommands.push('npm run dev:backend');
    }

    if (hasPublic) {
      rootPkg.scripts["dev:public"] = `npm --prefix ${publicFolder} run dev`;
      devNames.push('PUBLIC');
      devColors.push('blue');
      devCommands.push('npm run dev:public');
    }

    if (hasAdmin) {
      rootPkg.scripts["dev:admin"] = `npm --prefix ${adminFolder} run dev`;
      devNames.push('ADMIN');
      devColors.push('magenta');
      devCommands.push('npm run dev:admin');
    }

    if (devCommands.length > 1) {
      rootPkg.scripts["dev"] = `npx --yes concurrently -n "${devNames.join(',')}" -c "${devColors.join(',')}" ${devCommands.map(c => `\\"${c}\\"`).join(' ')}`;
    } else if (devCommands.length === 1) {
      rootPkg.scripts["dev"] = devCommands[0];
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(rootPkg, null, 2));

    // .husky papkasi va pre-commit hook
    if (selectedTools.includes('husky') || fs.existsSync(path.join(rootPath, '.husky'))) {
      const huskyDir = path.join(rootPath, '.husky');
      fs.mkdirSync(huskyDir, { recursive: true });

      const preCommitHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
`;
      fs.writeFileSync(path.join(huskyDir, 'pre-commit'), preCommitHook);
    }

    // 3. docker-compose.yml (agar backend mavjud bo'lsa yoki tanlansa)
    if (hasBackend || selectedTools.includes('docker')) {
      const dockerCompose = `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ${projectName}-postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: ${projectName}_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ${projectName}-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
`;
      fs.writeFileSync(path.join(rootPath, 'docker-compose.yml'), dockerCompose);
    }

    // 4. Makefile
    let makefileLines = [
      '.PHONY: help dev docker-up docker-down docker-logs',
      '',
      'help:',
      '\t@echo "Mavjud buyruqlar:"',
      '\t@echo "  npm run dev      - Barcha qismlarni (Backend, Public, Admin) bir vaqtda ishga tushirish"',
      '\t@echo "  make dev         - Barcha servislarni yurgazish"',
      '\t@echo "  make docker-up   - PostgreSQL va Redis konteynerlarini ishga tushirish"',
      '\t@echo "  make docker-down - Barcha konteynerlarni toxtatish"',
      '\t@echo "  make docker-logs - Konteyner loglarini kuzatish"'
    ];

    if (hasBackend) {
      makefileLines.push(
        '\t@echo "  make dev-backend - Go backend serverini ishga tushirish"',
        '\t@echo "  make migrate-up  - Database migratsiyasini bajarish (users jadvali)"',
        '\t@echo "  make seed        - Dastlabki superadmin ma\'lumotlarini kiritish"'
      );
    }
    if (hasPublic) {
      makefileLines.push('\t@echo "  make dev-public  - Next.js veb ilovasini ishga tushirish"');
    }
    if (hasAdmin) {
      makefileLines.push('\t@echo "  make dev-admin   - React Admin panelini ishga tushirish"');
    }

    makefileLines.push('', 'dev:', '\tnpm run dev', '');

    if (hasBackend) {
      makefileLines.push(
        'dev-backend:',
        `\tcd ${backendFolder} && go run cmd/api/main.go`,
        '',
        'migrate-up:',
        `\tcd ${backendFolder} && go run cmd/migrate/main.go`,
        '',
        'seed:',
        `\tcd ${backendFolder} && go run cmd/seed/main.go`,
        ''
      );
    }
    if (hasPublic) {
      makefileLines.push('dev-public:', `\tcd ${publicFolder} && npm run dev`, '');
    }
    if (hasAdmin) {
      makefileLines.push('dev-admin:', `\tcd ${adminFolder} && npm run dev`, '');
    }

    makefileLines.push(
      'docker-up:',
      '\tdocker compose up -d',
      '',
      'docker-down:',
      '\tdocker compose down',
      '',
      'docker-logs:',
      '\tdocker compose logs -f'
    );

    fs.writeFileSync(path.join(rootPath, 'Makefile'), makefileLines.join('\n'));

    // 5. Root README.md
    const readmeLines = [
      `# 🚀 ${projectName}`,
      '',
      `Ushbu loyiha **create-my-stack** vositasi orqali generatsiya qilingan full-stack arxitekturadir.`,
      '',
      '## 🗂 Loyiha tarkibi:',
      ''
    ];

    if (hasPublic) {
      readmeLines.push(`- **[${publicFolder}](./${publicFolder})**: Next.js 15+ App Router, Tailwind CSS, Shadcn UI sozlamalari, toza Auth logikasi.`);
    }
    if (hasAdmin) {
      readmeLines.push(`- **[${adminFolder}](./${adminFolder})**: React + Vite Admin Panel (Ant Design, toza Auth logikasi).`);
    }
    if (hasBackend) {
      readmeLines.push(`- **[${backendFolder}](./${backendFolder})**: Go Clean Architecture (Framework: ${options.goFramework || 'Gin'}, GORM, JWT Auth, Migrations, Seed).`);
    }

    readmeLines.push(
      '',
      '## ⚡ Eng qulay yagona ishga tushirish (Bitta terminalda):',
      '```bash',
      '# 1. Konteynerlarni ko‘tarish (agar kerak bo‘lsa):',
      'make docker-up',
      '',
      '# 2. Barcha faol servislarni (Backend, Public, Admin) BIR VAQTDA ishga tushirish:',
      'npm run dev',
      '```',
      '',
      '## 🛠 Alohida ishga tushirish buyruqlari:',
      ''
    );

    if (hasBackend) {
      readmeLines.push(
        '### Database Migratsiyasi va Superadmin Seed:',
        '```bash',
        'make migrate-up',
        'make seed',
        '```',
        'Dastlabki Superadmin hisobi:',
        '- **Email:** `admin@example.com`',
        '- **Parol:** `Admin123!`',
        '',
        '### Backend serverni alohida ishga tushirish:',
        '```bash',
        'npm run dev:backend   # yoki: make dev-backend',
        '```',
        `Server: http://localhost:8080`,
        ''
      );
    }

    if (hasPublic) {
      readmeLines.push(
        '### Public Web (Next.js) alohida ishga tushirish:',
        '```bash',
        'npm run dev:public    # yoki: make dev-public',
        '```',
        `Veb-ilova: http://localhost:3000`,
        ''
      );
    }

    if (hasAdmin) {
      readmeLines.push(
        '### Admin Panel (React + Vite) alohida ishga tushirish:',
        '```bash',
        'npm run dev:admin     # yoki: make dev-admin',
        '```',
        `Admin panel: http://localhost:5173`,
        ''
      );
    }

    fs.writeFileSync(path.join(rootPath, 'README.md'), readmeLines.join('\n'));

    spinner.succeed('DevOps, Yagona "npm run dev" va barcha konfiguratsiyalar muvaffaqiyatli yangilandi!');
    return `DevOps vositalari (Yagona "npm run dev", Makefile, Docker, Husky)`;
  } catch (err) {
    spinner.fail(`DevOps vositalarini yaratishda xatolik: ${err.message}`);
    throw err;
  }
}

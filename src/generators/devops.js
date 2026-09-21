import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export async function generateDevops(rootPath, projectName, options) {
  const selectedTools = options.devopsTools || [];
  const spinner = logger.spinner('DevOps va yordamchi vositalar shakllantirilmoqda...').start();

  try {
    const hasPublic = options.components.includes('public');
    const hasAdmin = options.components.includes('admin');
    const hasBackend = options.components.includes('backend');

    const publicFolder = `${projectName}-public`;
    const adminFolder = `${projectName}-admin`;
    const backendFolder = `${projectName}-backend`;

    // 1. .gitignore yaratish
    if (selectedTools.includes('git')) {
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
        // git bo'lmasa xato bermasdan o'tkazib yuborish
      }
    }

    // 2. docker-compose.yml
    if (selectedTools.includes('docker')) {
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

    // 3. Makefile
    if (selectedTools.includes('makefile')) {
      let makefileLines = [
        '.PHONY: help docker-up docker-down docker-logs',
        '',
        'help:',
        '\t@echo "Mavjud buyruqlar:"',
        '\t@echo "  make docker-up   - PostgreSQL va Redis konteynerlarini ishga tushirish"',
        '\t@echo "  make docker-down - Barcha konteynerlarni toxtatish"',
        '\t@echo "  make docker-logs - Konteyner loglarini kuzatish"'
      ];

      if (hasBackend) {
        makefileLines.push(
          '\t@echo "  make dev-backend - Go backend serverini ishga tushirish"',
          '',
          'dev-backend:',
          `\tcd ${backendFolder} && go run cmd/api/main.go`
        );
      }
      if (hasPublic) {
        makefileLines.push(
          '\t@echo "  make dev-public  - Next.js veb ilovasini ishga tushirish"',
          '',
          'dev-public:',
          `\tcd ${publicFolder} && npm run dev`
        );
      }
      if (hasAdmin) {
        makefileLines.push(
          '\t@echo "  make dev-admin   - React Admin panelini ishga tushirish"',
          '',
          'dev-admin:',
          `\tcd ${adminFolder} && npm run dev`
        );
      }

      makefileLines.push(
        '',
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
    }

    // 4. Root README.md
    if (selectedTools.includes('readme')) {
      const readmeLines = [
        `# 🚀 ${projectName}`,
        '',
        `Ushbu loyiha **create-my-stack** vositasi orqali generatsiya qilingan full-stack arxitekturadir.`,
        '',
        '## 🗂 Loyiha tarkibi:',
        ''
      ];

      if (hasPublic) {
        readmeLines.push(`- **[${publicFolder}](./${publicFolder})**: Next.js 15+ App Router, Tailwind CSS, TypeScript.`);
      }
      if (hasAdmin) {
        readmeLines.push(`- **[${adminFolder}](./${adminFolder})**: React + Vite Admin Panel (UI: ${options.adminUI || 'Tailwind'}).`);
      }
      if (hasBackend) {
        readmeLines.push(`- **[${backendFolder}](./${backendFolder})**: Go Clean Architecture (Framework: ${options.goFramework || 'Gin'}, DB: ${options.goDatabase || 'GORM'}).`);
      }

      readmeLines.push(
        '',
        '## ⚡ Ishga tushirish yo‘riqnomasi:',
        '',
        '### 1. Ma\'lumotlar bazasini ishga tushirish (Docker):',
        '```bash',
        'docker compose up -d',
        '```',
        ''
      );

      if (hasBackend) {
        readmeLines.push(
          '### 2. Backend serverni ishga tushirish:',
          '```bash',
          `cd ${backendFolder}`,
          'go run cmd/api/main.go',
          '```',
          `Server http://localhost:8080 da ishga tushadi. Sog'lomlik testi: \`http://localhost:8080/api/health\``,
          ''
        );
      }

      if (hasPublic) {
        readmeLines.push(
          '### 3. Public Web (Next.js) ishga tushirish:',
          '```bash',
          `cd ${publicFolder}`,
          'npm run dev',
          '```',
          `Veb-ilova http://localhost:3000 da ishga tushadi.`,
          ''
        );
      }

      if (hasAdmin) {
        readmeLines.push(
          '### 4. Admin Panel (React + Vite) ishga tushirish:',
          '```bash',
          `cd ${adminFolder}`,
          'npm run dev',
          '```',
          `Admin panel http://localhost:5173 da ishga tushadi.`,
          ''
        );
      }

      fs.writeFileSync(path.join(rootPath, 'README.md'), readmeLines.join('\n'));
    }

    spinner.succeed('DevOps vositalari va konfiguratsiyalar muvaffaqiyatli tayyorlandi!');
    return `DevOps vositalari (${selectedTools.join(', ')})`;
  } catch (err) {
    spinner.fail(`DevOps vositalarini yaratishda xatolik: ${err.message}`);
    throw err;
  }
}

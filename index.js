#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { logger } from './src/utils/logger.js';
import { askQuestions } from './src/prompts.js';
import { generatePublic } from './src/generators/public.js';
import { generateAdmin } from './src/generators/admin.js';
import { generateBackend } from './src/generators/backend.js';
import { generateDevops } from './src/generators/devops.js';
import { generateAiRules } from './src/generators/aiRules.js';
import { generateCrud } from './src/generators/crud.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const VERSION = pkg.version;

async function main() {
  const args = process.argv.slice(2);

  // 1. --version / -v
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`create-my-stack v${VERSION}`);
    process.exit(0);
  }

  // 2. --help / -h
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${chalk.bold.cyan('🚀 create-my-stack')} v${VERSION}
Universal Fullstack Generator (Next.js 15, React Vite, Go Clean Architecture)

${chalk.bold.yellow('FOYDALANISH:')}
  create-my-stack                       Interaktiv rejimda yangi loyiha ochish yoki modul qo‘shish
  create-my-stack <nomi>                Ko‘rsatilgan nom bilan loyiha ochish
  create-my-stack <nomi> --all          Barcha standart modullar bilan tezkor generatsiya (savollarsiz)
  create-my-stack make:crud <Model>     Mavjud loyihaga yangi Clean Architecture CRUD modeli qo‘shish

${chalk.bold.yellow('BUYRUQLAR:')}
  make:crud <Model>                     Backend va Frontend uchun to‘liq CRUD yaratadi (masalan: Product)

${chalk.bold.yellow('FLAGLAR:')}
  --all                                 Barcha tavsiya etilgan defaultlar bilan tezkor yaratish
  -v, --version                         Versiyani ko‘rsatish
  -h, --help                            Yordam menyusini ko‘rsatish

${chalk.bold.yellow('MISOL:')}
  create-my-stack my-app --all
  create-my-stack make:crud Product
`);
    process.exit(0);
  }

  // 3. make:crud <EntityName> sub-command
  if (args[0] === 'make:crud') {
    const entityName = args[1];
    if (!entityName || !entityName.trim()) {
      logger.error('Model nomi kiritilmadi! Misol: create-my-stack make:crud Product');
      process.exit(1);
    }
    try {
      await generateCrud(entityName.trim());
    } catch (err) {
      logger.error(`CRUD yaratishda xatolik: ${err.message}`);
      process.exit(1);
    }
    process.exit(0);
  }

  try {
    logger.banner();

    // Fast flag: --all
    const isFastAll = args.includes('--all');
    let answers;

    if (isFastAll) {
      const projectName = args.find((a) => !a.startsWith('-')) || 'my-app';
      console.log(chalk.yellow(`⚡ Fast Mode (--all): [${projectName}] loyihasi barcha standart sozlamalar bilan yaratilmoqda...\n`));
      answers = {
        projectName,
        rootPath: path.resolve(process.cwd(), projectName),
        isIncremental: false,
        components: ['public', 'admin', 'backend', 'devops', 'airules'],
        allActiveComponents: ['public', 'admin', 'backend', 'devops', 'airules'],
        publicLibs: ['shadcn', 'react-query', 'zustand', 'form-zod', 'axios', 'lucide'],
        adminUI: 'antd',
        adminLibs: ['router', 'auth-logic', 'table', 'recharts', 'react-query', 'zustand', 'axios'],
        goFramework: 'gin',
        goDatabase: 'gorm',
        goExtras: ['auth-flow', 'migrate-seed', 'jwt', 'cors', 'swagger'],
        devopsTools: ['docker', 'makefile', 'git', 'husky', 'readme'],
        aiToolList: ['universal', 'cursor', 'claude', 'copilot', 'windsurf']
      };
    } else {
      const cliName = args.find((a) => !a.startsWith('-'));
      answers = await askQuestions(cliName);
    }

    const rootPath = answers.rootPath || path.resolve(process.cwd(), answers.projectName);

    if (!fs.existsSync(rootPath)) {
      fs.mkdirSync(rootPath, { recursive: true });
    }

    const summaryDetails = [];

    // 2. Next.js Public qismi (agar yangi tanlangan bo'lsa)
    if (answers.components.includes('public')) {
      const detail = await generatePublic(rootPath, answers.projectName, answers);
      summaryDetails.push(detail);
    }

    // 3. React Admin qismi (agar yangi tanlangan bo'lsa)
    if (answers.components.includes('admin')) {
      const detail = await generateAdmin(rootPath, answers.projectName, answers);
      summaryDetails.push(detail);
    }

    // 4. Go Backend qismi (agar yangi tanlangan bo'lsa)
    if (answers.components.includes('backend')) {
      const detail = await generateBackend(rootPath, answers.projectName, answers);
      summaryDetails.push(detail);
    }

    // 5. DevOps va Yagona "npm run dev" (har doim barcha modullarni birlashtirib sinxronlaydi)
    if (answers.isIncremental || answers.components.includes('devops')) {
      const detail = await generateDevops(rootPath, answers.projectName, answers);
      summaryDetails.push(detail);
    }

    // 6. AI Agent Qoidalari va Guardrails (har doim barcha modullarni himoyalaydi)
    if (answers.isIncremental || answers.components.includes('airules')) {
      const detail = await generateAiRules(rootPath, answers.projectName, answers);
      summaryDetails.push(detail);
    }

    // 7. Yakuniy chiroyli xulosa
    logger.summaryBox(answers.projectName, summaryDetails);
  } catch (error) {
    if (error.isTtyError || (error.message && error.message.includes('User force closed'))) {
      console.log('\n❌ Jarayon bekor qilindi.\n');
      process.exit(0);
    }
    logger.error(`Kutilmagan xatolik yuz berdi: ${error.message}`);
    process.exit(1);
  }
}

main();

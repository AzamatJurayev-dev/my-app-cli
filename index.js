#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { logger } from './src/utils/logger.js';
import { askQuestions } from './src/prompts.js';
import { generatePublic } from './src/generators/public.js';
import { generateAdmin } from './src/generators/admin.js';
import { generateBackend } from './src/generators/backend.js';
import { generateDevops } from './src/generators/devops.js';
import { generateAiRules } from './src/generators/aiRules.js';

async function main() {
  try {
    logger.banner();

    // 1. Foydalanuvchi bilan interaktiv muloqot
    const answers = await askQuestions();

    const rootPath = path.resolve(process.cwd(), answers.projectName);

    if (!fs.existsSync(rootPath)) {
      fs.mkdirSync(rootPath, { recursive: true });
    }

    const summaryDetails = [];

    // 2. Next.js Public qismi
    if (answers.components.includes('public')) {
      const detail = await generatePublic(rootPath, answers.projectName, answers);
      summaryDetails.push(detail);
    }

    // 3. React Admin qismi
    if (answers.components.includes('admin')) {
      const detail = await generateAdmin(rootPath, answers.projectName, answers);
      summaryDetails.push(detail);
    }

    // 4. Go Backend qismi
    if (answers.components.includes('backend')) {
      const detail = await generateBackend(rootPath, answers.projectName, answers);
      summaryDetails.push(detail);
    }

    // 5. DevOps va Root konfiguratsiyalar
    if (answers.components.includes('devops')) {
      const detail = await generateDevops(rootPath, answers.projectName, answers);
      summaryDetails.push(detail);
    }

    // 6. AI Agent Qoidalari va Guardrails
    if (answers.components.includes('airules')) {
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

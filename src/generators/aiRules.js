import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

export async function generateAiRules(rootPath, projectName, options = {}) {
  const spinner = logger.spinner('AI Agent Qoidalari va Guardrails generatsiya qilinmoqda...').start();

  try {
    const allComponents = options.allActiveComponents || options.components || [];
    const hasPublic = allComponents.includes('public');
    const hasAdmin = allComponents.includes('admin');
    const hasBackend = allComponents.includes('backend');

    const publicName = `${projectName}-public`;
    const adminName = `${projectName}-admin`;
    const backendName = `${projectName}-backend`;

    const selectedAi = options.aiToolList || ['universal', 'cursor', 'claude', 'copilot', 'windsurf'];

    // Universal AI Constitution content
    const aiRulesContent = `# 🛡️ AI CODING AGENT RULES & CONSTITUTION

> **CRITICAL INSTRUCTION FOR ALL AI CODING AGENTS (Cursor, Claude Code, GitHub Copilot, Antigravity, Windsurf):**
> You are working in a production-grade monorepo containing:
${hasPublic ? `> - Public Frontend: \`${publicName}\` (Next.js 15+ App Router, TypeScript, Tailwind CSS)\n` : ''}${hasAdmin ? `> - Admin Panel: \`${adminName}\` (React + Vite + TypeScript)\n` : ''}${hasBackend ? `> - Backend API: \`${backendName}\` (Go Clean Architecture)\n` : ''}>
> You MUST strictly adhere to the following non-negotiable rules. Disobeying these rules constitutes a failure of your task.

---

## 🛑 1. STRICT SCOPE & MINIMAL CHANGES (NO UNNECESSARY CODE)

1. **Surgical Precision**: Only touch files and lines strictly necessary to fulfill the user's explicit request. Do NOT touch unrelated code.
2. **No Over-Engineering**: Solve the problem in the simplest, cleanest, and most maintainable way. Do NOT add speculative features, unrequested abstractions, extra design patterns, or premature optimizations.
3. **No Unsolicited Refactoring**: Do NOT refactor existing working code, rename variables, or rearrange files unless explicitly instructed by the user.
4. **No Unapproved Dependencies**: Do NOT add or install new npm/Go packages without explicit permission from the user.

---

## 🔍 2. COMPULSORY IMPACT ANALYSIS (BEFORE DELETING OR RENAMING)

1. **Never Delete Blindly**: Before deleting or renaming ANY function, struct, interface, type, variable, file, or API endpoint, you MUST perform a full repository search (\`ripgrep\` / \`grep\`) to locate all references and callers.
2. **Zero Broken References**:
   - If a symbol is removed or changed, every caller and import MUST be updated or cleanly removed.
   - Never leave dangling imports, broken types, or dead code.
3. **File Deletion Safeguard**: Confirm that no documentation, configuration, or environment scripts depend on a file before deleting it.

---

## ✅ 3. COMPULSORY VERIFICATION (VERIFY BEFORE YOU DECLARE DONE)

**You MUST NEVER report a task as "done" or "completed" without executing verification commands:**

${hasBackend ? `### Go Backend (\`${backendName}\`):
- Run \`go vet ./...\` and ensure 0 warnings.
- Run \`go test ./...\` and ensure all tests pass.
- Run \`go build ./cmd/api/main.go\` to ensure it compiles without errors.
` : ''}
${hasPublic ? `### Next.js Public (\`${publicName}\`):
- Run \`npx tsc --noEmit\` (TypeScript check) and verify 0 type errors.
- Run \`npm run lint\` and verify no linting errors.
` : ''}
${hasAdmin ? `### React Admin (\`${adminName}\`):
- Run \`npx tsc --noEmit\` (TypeScript check) and verify 0 type errors.
- Run \`npm run build\` to ensure the production bundle builds cleanly.
` : ''}
**If ANY verification command fails, you MUST analyze and fix the errors before concluding your response.**

---

## 🧪 4. MANDATORY TESTING POLICY

1. **Test Business Logic**: Every new feature, calculation, usecase, or service logic MUST be accompanied by unit tests.
2. **Never Disable Tests**: Never comment out, disable, or delete failing tests to make a build pass. Fix the underlying implementation.
3. **Test Integrity**: Ensure all newly added tests are deterministic and do not depend on random state or unmocked network services.

---

## 🏛️ 5. ARCHITECTURAL BOUNDARIES & CLEAN PRACTICES

${hasBackend ? `### Go Clean Architecture (\`${backendName}\`):
- **Layers Order**: \`domain\` -> \`usecase\` -> \`repository\` / \`delivery\`
- **\`internal/domain\`**: Pure entities and interface definitions. MUST NOT import any other internal package or external HTTP/DB driver.
- **\`internal/usecase\`**: Pure business logic. Depends ONLY on \`domain\` and repository interfaces.
- **\`internal/delivery\` (HTTP)**: Handles HTTP requests/responses, input validation, and calls usecases. NEVER call repositories directly from handlers!
- **Auth & Passwords**: Passwords MUST always be hashed with \`bcrypt\`. Never store plaintext passwords. JWT tokens must be verified via \`middleware.AuthMiddleware\`.
- **Database Migrations**: Always register new entity models in \`cmd/migrate/main.go\`. Run \`make migrate-up\` and \`make seed\` for database updates.
- **Zero Circular Dependencies**: Any circular import is a fatal design bug.
` : ''}
${hasPublic ? `### Next.js 15+ App Router (\`${publicName}\`):
- Default to **Server Components**. Add \`'use client'\` only at the leaf nodes where user interactivity, React hooks, or browser APIs are needed.
- **Strict TypeScript**: Never use \`any\`. Define clear interfaces for props and API responses.
- **Auth Logic**: Use the centralized \`src/services/auth.service.ts\` and \`src/hooks/use-auth.ts\`. Do not bypass \`apiClient\` interceptors.
- Clean error boundaries and proper loading UI states (\`loading.tsx\`, \`error.tsx\`).
` : ''}
${hasAdmin ? `### React Admin (\`${adminName}\`):
- Decouple UI components from data fetching. Use React Query / custom hooks.
- **Auth Logic**: Use \`src/api/auth.service.ts\` and \`src/hooks/useAuth.ts\`. Tokens are automatically managed by \`apiClient\` interceptors.
- Centralize API calls in \`src/api/\` with the configured \`apiClient\`.
` : ''}

---

## ❓ 6. NO ASSUMPTIONS (ASK WHEN IN DOUBT)

If a user request is ambiguous, contradictory, or requires breaking changes:
- Do NOT guess or make unwarranted assumptions.
- Stop, formulate a clear, concise question, and ask the user for clarification before modifying code.
`;

    // 1. AGENTS.md (Universal standard)
    if (selectedAi.includes('universal')) {
      fs.writeFileSync(path.join(rootPath, 'AGENTS.md'), aiRulesContent);
      fs.writeFileSync(path.join(rootPath, 'RULES.md'), aiRulesContent);
    }

    // 2. .cursorrules & .cursor/rules/
    if (selectedAi.includes('cursor')) {
      fs.writeFileSync(path.join(rootPath, '.cursorrules'), aiRulesContent);

      const cursorRulesDir = path.join(rootPath, '.cursor', 'rules');
      fs.mkdirSync(cursorRulesDir, { recursive: true });

      const cursorMdc = `---
description: Project Guardrails, verification rules, and clean architecture standards
globs: **/*
alwaysApply: true
---

${aiRulesContent}
`;
      fs.writeFileSync(path.join(cursorRulesDir, 'guardrails.mdc'), cursorMdc);
    }

    // 3. CLAUDE.md (Anthropic Claude Code)
    if (selectedAi.includes('claude')) {
      const claudeMdContent = `# CLAUDE.md - Project Guidelines for Claude Code

## Project Overview
This is a modular fullstack project:
${hasPublic ? `- Next.js Public: \`${publicName}\`\n` : ''}${hasAdmin ? `- React Admin: \`${adminName}\`\n` : ''}${hasBackend ? `- Go Backend: \`${backendName}\`\n` : ''}

## Essential Commands

${hasBackend ? `### Go Backend:
\`\`\`bash
cd ${backendName}
go run cmd/api/main.go   # Start API server (port 8080)
go vet ./...             # Run static analysis
go test ./...            # Run tests
\`\`\`
` : ''}
${hasPublic ? `### Next.js Public:
\`\`\`bash
cd ${publicName}
npm run dev              # Start dev server (port 3000)
npx tsc --noEmit         # Typecheck
npm run lint             # Lint
\`\`\`
` : ''}
${hasAdmin ? `### React Admin:
\`\`\`bash
cd ${adminName}
npm run dev              # Start dev server (port 5173)
npx tsc --noEmit         # Typecheck
npm run build            # Build
\`\`\`
` : ''}

${aiRulesContent}
`;
      fs.writeFileSync(path.join(rootPath, 'CLAUDE.md'), claudeMdContent);
    }

    // 4. .github/copilot-instructions.md
    if (selectedAi.includes('copilot')) {
      const githubDir = path.join(rootPath, '.github');
      fs.mkdirSync(githubDir, { recursive: true });
      fs.writeFileSync(path.join(githubDir, 'copilot-instructions.md'), aiRulesContent);
    }

    // 5. .windsurfrules
    if (selectedAi.includes('windsurf')) {
      fs.writeFileSync(path.join(rootPath, '.windsurfrules'), aiRulesContent);
    }

    spinner.succeed('AI Guardrails va qoidalar to‘liq yaratildi (AGENTS.md, .cursorrules, CLAUDE.md, Copilot, Windsurf)!');
    return 'AI Guardrails & Rules (Cursor, Claude, Copilot, Windsurf, AGENTS.md)';
  } catch (err) {
    spinner.fail(`AI qoidalarini yaratishda xatolik: ${err.message}`);
    throw err;
  }
}

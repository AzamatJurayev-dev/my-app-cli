import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export async function generateAdmin(rootPath, projectName, options) {
  const adminName = `${projectName}-admin`;
  const adminPath = path.join(rootPath, adminName);
  const spinner = logger.spinner(`[2/3] React Admin (Vite) loyihasi yaratilmoqda (${adminName})...`).start();

  try {
    // 1. Vite template react-ts (cwd: rootPath orqali backslash xatoliklarining oldi olinadi)
    execSync(`npx --yes create-vite@latest "${adminName}" --template react-ts`, {
      cwd: rootPath,
      stdio: 'ignore'
    });

    // 2. Arxitektura papkalari
    const adminDirs = [
      'components/layout',
      'components/tables',
      'pages',
      'hooks',
      'api',
      'types',
      'utils'
    ];
    adminDirs.forEach((dir) => fs.mkdirSync(path.join(adminPath, 'src', dir), { recursive: true }));

    // 3. Paketlar ro'yxatini shakllantirish
    const pkgsToInstall = [];
    const uiChoice = options.adminUI || 'tailwind';
    const selected = options.adminLibs || [];

    if (uiChoice === 'antd') {
      pkgsToInstall.push('antd', '@ant-design/icons');
    } else if (uiChoice === 'mantine') {
      pkgsToInstall.push('@mantine/core', '@mantine/hooks');
    } else {
      pkgsToInstall.push('lucide-react', 'clsx');
    }

    if (selected.includes('router')) pkgsToInstall.push('react-router-dom');
    if (selected.includes('table')) pkgsToInstall.push('@tanstack/react-table');
    if (selected.includes('recharts')) pkgsToInstall.push('recharts');
    if (selected.includes('react-query')) pkgsToInstall.push('@tanstack/react-query');
    if (selected.includes('zustand')) pkgsToInstall.push('zustand');
    if (selected.includes('axios')) pkgsToInstall.push('axios');

    if (pkgsToInstall.length > 0) {
      spinner.text = `[2/3] Admin uchun paketlar o'rnatilmoqda (${uiChoice.toUpperCase()}, ${pkgsToInstall.join(', ')})...`;
      execSync(`npm install ${pkgsToInstall.join(' ')}`, {
        cwd: adminPath,
        stdio: 'ignore'
      });
    }

    // 4. Boshlang'ich fayllar
    // .env
    const envContent = `VITE_API_URL=http://localhost:8080/api\n`;
    fs.writeFileSync(path.join(adminPath, '.env'), envContent);

    // api/client.ts
    const apiClientContent = `import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});
`;
    fs.writeFileSync(path.join(adminPath, 'src/api/client.ts'), apiClientContent);

    // types/index.ts
    const typesContent = `export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin" | "editor";
}
`;
    fs.writeFileSync(path.join(adminPath, 'src/types/index.ts'), typesContent);

    // pages/Dashboard.tsx
    const dashboardContent = `import React from "react";

export const Dashboard: React.FC = () => {
  return (
    <div style={{ padding: "24px" }}>
      <h1>Dashboard</h1>
      <p>Xush kelibsiz! Admin boshqaruv paneli tayyor.</p>
    </div>
  );
};
`;
    fs.writeFileSync(path.join(adminPath, 'src/pages/Dashboard.tsx'), dashboardContent);

    spinner.succeed(`React Admin muvaffaqiyatli tayyorlandi: ${adminName}`);
    return `${adminName} (Vite + React-TS, UI: ${uiChoice.toUpperCase()})`;
  } catch (err) {
    spinner.fail(`React Admin yaratishda xatolik: ${err.message}`);
    throw err;
  }
}

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export async function generatePublic(rootPath, projectName, options) {
  const publicName = `${projectName}-public`;
  const publicPath = path.join(rootPath, publicName);
  const spinner = logger.spinner(`[1/3] Next.js loyihasi yaratilmoqda (${publicName})...`).start();

  try {
    // 1. Next.js create-next-app (cwd: rootPath orqali Windows path muammolari oldi olinadi)
    execSync(
      `npx --yes create-next-app@latest "${publicName}" --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes`,
      { cwd: rootPath, stdio: 'ignore' }
    );

    // 2. Arxitektura papkalari
    const publicDirs = [
      'components/ui',
      'components/shared',
      'hooks',
      'services',
      'types',
      'lib',
      'constants'
    ];
    publicDirs.forEach((dir) => fs.mkdirSync(path.join(publicPath, 'src', dir), { recursive: true }));

    // 3. Qo'shimcha paketlar ro'yxatini shakllantirish
    const pkgsToInstall = ['clsx', 'tailwind-merge'];
    const selected = options.publicLibs || [];

    if (selected.includes('react-query')) pkgsToInstall.push('@tanstack/react-query');
    if (selected.includes('zustand')) pkgsToInstall.push('zustand');
    if (selected.includes('form-zod')) pkgsToInstall.push('react-hook-form', '@hookform/resolvers', 'zod');
    if (selected.includes('axios')) pkgsToInstall.push('axios');
    if (selected.includes('lucide')) pkgsToInstall.push('lucide-react');
    if (selected.includes('framer-motion')) pkgsToInstall.push('framer-motion');

    if (pkgsToInstall.length > 0) {
      spinner.text = `[1/3] Next.js uchun paketlar o'rnatilmoqda: ${pkgsToInstall.join(', ')}...`;
      execSync(`npm install ${pkgsToInstall.join(' ')}`, {
        cwd: publicPath,
        stdio: 'ignore'
      });
    }

    // 4. Foydali utility va helper fayllar
    // cn helper
    const utilsContent = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
    fs.writeFileSync(path.join(publicPath, 'src/lib/utils.ts'), utilsContent);

    // axios client
    if (selected.includes('axios')) {
      const axiosClient = `import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});
`;
      fs.writeFileSync(path.join(publicPath, 'src/lib/axios.ts'), axiosClient);
    }

    // zustand store
    if (selected.includes('zustand')) {
      const zustandStore = `import { create } from "zustand";

interface AppState {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "light",
  toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
}));
`;
      fs.writeFileSync(path.join(publicPath, 'src/hooks/use-app-store.ts'), zustandStore);
    }

    // .env.local
    const envLocal = `NEXT_PUBLIC_API_URL=http://localhost:8080/api\n`;
    fs.writeFileSync(path.join(publicPath, '.env.local'), envLocal);

    spinner.succeed(`Next.js (Public) muvaffaqiyatli tayyorlandi: ${publicName}`);
    return `${publicName} (Next.js 15, Tailwind, ${pkgsToInstall.length} kutubxona)`;
  } catch (err) {
    spinner.fail(`Next.js yaratishda xatolik: ${err.message}`);
    throw err;
  }
}

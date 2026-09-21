import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export async function generateAdmin(rootPath, projectName, options) {
  const adminName = `${projectName}-admin`;
  const adminPath = path.join(rootPath, adminName);
  const uiChoice = options.adminUI || 'antd';
  const selected = options.adminLibs || [];

  const spinner = logger.spinner(`[2/3] React Admin (Vite + ${uiChoice.toUpperCase()}) yaratilmoqda (${adminName})...`).start();

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

    // 3. Paketlar ro'yxati
    const pkgsToInstall = ['axios', 'zustand', 'react-router-dom'];

    if (uiChoice === 'antd') {
      pkgsToInstall.push('antd', '@ant-design/icons');
    } else if (uiChoice === 'mantine') {
      pkgsToInstall.push('@mantine/core', '@mantine/hooks');
    } else {
      pkgsToInstall.push('lucide-react', 'clsx');
    }

    if (selected.includes('table')) pkgsToInstall.push('@tanstack/react-table');
    if (selected.includes('recharts')) pkgsToInstall.push('recharts');
    if (selected.includes('react-query')) pkgsToInstall.push('@tanstack/react-query');

    spinner.text = `[2/3] Admin uchun paketlar o'rnatilmoqda (${uiChoice.toUpperCase()}, ${pkgsToInstall.join(', ')})...`;
    execSync(`npm install ${pkgsToInstall.join(' ')}`, {
      cwd: adminPath,
      stdio: 'ignore'
    });

    // 4. .env
    const envContent = `VITE_API_URL=http://localhost:8080/api\n`;
    fs.writeFileSync(path.join(adminPath, '.env'), envContent);

    // 5. Types: src/types/auth.ts
    const authTypes = `export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
`;
    fs.writeFileSync(path.join(adminPath, 'src/types/auth.ts'), authTypes);

    // 6. Axios Client with Interceptors (src/api/client.ts)
    const apiClientContent = `import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request Interceptor: har bir so'rovga tokenni ulash
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token && config.headers) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Response Interceptor: 401 Unauthorized holatida tokenni tozalash
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_token");
    }
    return Promise.reject(error);
  }
);
`;
    fs.writeFileSync(path.join(adminPath, 'src/api/client.ts'), apiClientContent);

    // 7. Auth Service (src/api/auth.service.ts)
    const authServiceContent = `import { apiClient } from "./client";
import { AuthResponse, LoginCredentials, User } from "../types/auth";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("admin_token", response.data.token);
    }
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  logout(): void {
    localStorage.removeItem("admin_token");
  },
};
`;
    fs.writeFileSync(path.join(adminPath, 'src/api/auth.service.ts'), authServiceContent);

    // 8. Auth Store / Hook (src/hooks/useAuth.ts)
    const authHookContent = `import { create } from "zustand";
import { authService } from "../api/auth.service";
import { LoginCredentials, User } from "../types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("admin_token"),
  isAuthenticated: !!localStorage.getItem("admin_token"),
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await authService.login(credentials);
      set({ user: res.user, token: res.token, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
`;
    fs.writeFileSync(path.join(adminPath, 'src/hooks/useAuth.ts'), authHookContent);

    // 9. pages/Dashboard.tsx
    const dashboardContent = `import React from "react";

export const Dashboard: React.FC = () => {
  return (
    <div style={{ padding: "24px" }}>
      <h1>Admin Dashboard</h1>
      <p>Boshqaruv paneli muvaffaqiyatli ishga tushdi.</p>
    </div>
  );
};
`;
    fs.writeFileSync(path.join(adminPath, 'src/pages/Dashboard.tsx'), dashboardContent);

    spinner.succeed(`React Admin muvaffaqiyatli tayyorlandi: ${adminName} (${uiChoice.toUpperCase()} + Auth Logic)`);
    return `${adminName} (React-TS, UI: ${uiChoice.toUpperCase()}, Auth Logic & Interceptors)`;
  } catch (err) {
    spinner.fail(`React Admin yaratishda xatolik: ${err.message}`);
    throw err;
  }
}

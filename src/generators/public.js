import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export async function generatePublic(rootPath, projectName, options) {
  const publicName = `${projectName}-public`;
  const publicPath = path.join(rootPath, publicName);
  const spinner = logger.spinner(`[1/3] Next.js loyihasi yaratilmoqda (${publicName})...`).start();

  try {
    // 1. Next.js create-next-app
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

    // 3. Paketlar ro'yxati
    const pkgsToInstall = ['clsx', 'tailwind-merge', 'axios', 'zustand', 'lucide-react'];
    const selected = options.publicLibs || [];

    if (selected.includes('react-query')) pkgsToInstall.push('@tanstack/react-query');
    if (selected.includes('form-zod')) pkgsToInstall.push('react-hook-form', '@hookform/resolvers', 'zod');
    if (selected.includes('framer-motion')) pkgsToInstall.push('framer-motion');

    spinner.text = `[1/3] Next.js uchun paketlar o'rnatilmoqda (Shadcn tayyorlov, ${pkgsToInstall.join(', ')})...`;
    execSync(`npm install ${pkgsToInstall.join(' ')}`, {
      cwd: publicPath,
      stdio: 'ignore'
    });

    // 4. Shadcn UI konfiguratsiyasi (components.json)
    const shadcnConfig = {
      $schema: "https://ui.shadcn.com/schema.json",
      style: "default",
      rsc: true,
      tsx: true,
      tailwind: {
        config: "tailwind.config.ts",
        css: "src/app/globals.css",
        baseColor: "slate",
        cssVariables: true,
        prefix: ""
      },
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
        ui: "@/components/ui",
        lib: "@/lib",
        hooks: "@/hooks"
      },
      iconLibrary: "lucide"
    };
    fs.writeFileSync(path.join(publicPath, 'components.json'), JSON.stringify(shadcnConfig, null, 2));

    // 5. Utility fayllar (cn helper)
    const utilsContent = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
    fs.writeFileSync(path.join(publicPath, 'src/lib/utils.ts'), utilsContent);

    // 6. Types: types/auth.ts
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

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}
`;
    fs.writeFileSync(path.join(publicPath, 'src/types/auth.ts'), authTypes);

    // 7. Axios Client with Request & Response Interceptors (src/lib/axios.ts)
    const axiosClient = `import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Avtomatik ravishda token ulash (Request Interceptor)
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
  }
  return config;
});

// 401 Unauthorized holatida tokenni tozalash (Response Interceptor)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
    return Promise.reject(error);
  }
);
`;
    fs.writeFileSync(path.join(publicPath, 'src/lib/axios.ts'), axiosClient);

    // 8. Auth Service (src/services/auth.service.ts)
    const authService = `import { apiClient } from "@/lib/axios";
import { AuthResponse, LoginCredentials, RegisterData, User } from "@/types/auth";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
    if (typeof window !== "undefined" && response.data.token) {
      localStorage.setItem("auth_token", response.data.token);
    }
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);
    if (typeof window !== "undefined" && response.data.token) {
      localStorage.setItem("auth_token", response.data.token);
    }
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  },
};
`;
    fs.writeFileSync(path.join(publicPath, 'src/services/auth.service.ts'), authService);

    // 9. Auth Store / Hook (src/hooks/use-auth.ts)
    const authHook = `import { create } from "zustand";
import { authService } from "@/services/auth.service";
import { LoginCredentials, RegisterData, User } from "@/types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("auth_token") : null,
  isAuthenticated: typeof window !== "undefined" ? !!localStorage.getItem("auth_token") : false,
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

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authService.register(data);
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
    fs.writeFileSync(path.join(publicPath, 'src/hooks/use-auth.ts'), authHook);

    // 10. .env.local
    const envLocal = `NEXT_PUBLIC_API_URL=http://localhost:8080/api\n`;
    fs.writeFileSync(path.join(publicPath, '.env.local'), envLocal);

    spinner.succeed(`Next.js (Public) muvaffaqiyatli tayyorlandi: ${publicName} (Shadcn + Auth Logic)`);
    return `${publicName} (Next.js 15, Tailwind, Shadcn UI, Auth Logic & Interceptors)`;
  } catch (err) {
    spinner.fail(`Next.js yaratishda xatolik: ${err.message}`);
    throw err;
  }
}

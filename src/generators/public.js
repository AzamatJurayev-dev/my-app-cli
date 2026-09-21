import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export async function generatePublic(rootPath, projectName, options) {
  const publicName = `${projectName}-public`;
  const publicPath = path.join(rootPath, publicName);
  const spinner = logger.spinner(`[1/3] Next.js loyihasi yaratilmoqda (${publicName})...`).start();

  try {
    // 1. Next.js create-next-app (cwd: rootPath)
    execSync(
      `npx --yes create-next-app@latest "${publicName}" --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git --yes`,
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

    // 4.1. Shadcn CSS o'zgaruvchilari (globals.css ga qo'shish)
    const globalsCssPath = path.join(publicPath, 'src/app/globals.css');
    if (fs.existsSync(globalsCssPath)) {
      const globalsContent = fs.readFileSync(globalsCssPath, 'utf8');
      const shadcnVars = `
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
`;
      fs.writeFileSync(globalsCssPath, globalsContent + shadcnVars);
    }

    // 5. Utility fayllar (cn helper)
    const utilsContent = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
    fs.writeFileSync(path.join(publicPath, 'src/lib/utils.ts'), utilsContent);

    // 6. Modulli Tiplar (*.type.ts):
    // 6.1. src/types/common.type.ts
    const commonTypes = `export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface QueryParams {
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}
`;
    fs.writeFileSync(path.join(publicPath, 'src/types/common.type.ts'), commonTypes);

    // 6.2. src/types/auth.type.ts
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
    fs.writeFileSync(path.join(publicPath, 'src/types/auth.type.ts'), authTypes);

    // 6.3. Barrel export: src/types/index.ts
    const indexTypes = `export * from "./common.type";
export * from "./auth.type";
`;
    fs.writeFileSync(path.join(publicPath, 'src/types/index.ts'), indexTypes);

    // 7. Axios Client with Request & Response Interceptors (src/lib/axios.ts)
    const axiosClient = `import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request Interceptor: Avtomatik ravishda token ulash
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
  }
  return config;
});

// Response Interceptor: 401 Unauthorized holatida tokenni tozalash
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
import { AuthResponse, LoginCredentials, RegisterData, User } from "@/types";

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
import { LoginCredentials, RegisterData, User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // SSR safety: hydrate state from localStorage on client mount
  hydrate: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        set({ token, isAuthenticated: true });
      }
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.login(credentials);
      set({ user: res.user, token: res.token, isAuthenticated: true });
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message || "Login xatosi" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.register(data);
      set({ user: res.user, token: res.token, isAuthenticated: true });
    } catch (err: any) {
      set({ error: err?.response?.data?.error || err.message || "Register xatosi" });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },
}));
`;
    fs.writeFileSync(path.join(publicPath, 'src/hooks/use-auth.ts'), authHook);

    // 10. .env.local
    const envLocal = `NEXT_PUBLIC_API_URL=http://localhost:8080/api\n`;
    fs.writeFileSync(path.join(publicPath, '.env.local'), envLocal);

    spinner.succeed(`Next.js (Public) muvaffaqiyatli tayyorlandi: ${publicName} (Shadcn + Modulli Tiplar)`);
    return `${publicName} (Next.js 15, Tailwind, Shadcn UI, Modulli Tiplar & Auth)`;
  } catch (err) {
    spinner.fail(`Next.js yaratishda xatolik: ${err.message}`);
    throw err;
  }
}

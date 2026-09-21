import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';

// Matn formatlash yordamchilari
function toPascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

function toPlural(str) {
  if (str.endsWith('y') && !str.endsWith('ey') && !str.endsWith('ay') && !str.endsWith('oy') && !str.endsWith('uy')) {
    return str.slice(0, -1) + 'ies';
  }
  if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z') || str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  return str + 's';
}

export async function generateCrud(entityInput, workingDir = process.cwd()) {
  if (!entityInput || !entityInput.trim()) {
    throw new Error("Model nomi kiritilmadi! Masalan: create-my-stack make:crud Product");
  }

  const rawName = entityInput.trim();
  const entityPascal = toPascalCase(rawName);      // Product
  const entityCamel = toCamelCase(rawName);        // product
  const entitySnake = toSnakeCase(rawName);        // product
  const entityPlural = toPlural(entityCamel);      // products
  const entityPluralPascal = toPlural(entityPascal);// Products

  console.log(chalk.bold.cyan(`\n🧩 CRUD GENERATOR: [${entityPascal}] modeli yaratilmoqda...\n`));

  // Loyiha papkalarini aniqlash
  let rootPath = workingDir;
  let dirEntries = fs.readdirSync(rootPath, { withFileTypes: true });

  let backendDir = dirEntries.find((d) => d.isDirectory() && d.name.endsWith('-backend'))?.name;
  let publicDir = dirEntries.find((d) => d.isDirectory() && d.name.endsWith('-public'))?.name;
  let adminDir = dirEntries.find((d) => d.isDirectory() && d.name.endsWith('-admin'))?.name;

  // Agar joriy papkada topilmasa, bir pog'ona yuqorini tekshirish
  if (!backendDir && !publicDir && !adminDir) {
    const parentDir = path.dirname(rootPath);
    const parentEntries = fs.readdirSync(parentDir, { withFileTypes: true });
    backendDir = parentEntries.find((d) => d.isDirectory() && d.name.endsWith('-backend'))?.name;
    publicDir = parentEntries.find((d) => d.isDirectory() && d.name.endsWith('-public'))?.name;
    adminDir = parentEntries.find((d) => d.isDirectory() && d.name.endsWith('-admin'))?.name;
    if (backendDir || publicDir || adminDir) {
      rootPath = parentDir;
    }
  }

  if (!backendDir && !publicDir && !adminDir) {
    throw new Error("Hech qanday faol modul topilmadi (-backend, -public yoki -admin mavjud bo'lgan root papkada ishga tushiring)!");
  }

  const generatedFiles = [];

  // ==========================================
  // 1. GO BACKEND CRUD
  // ==========================================
  if (backendDir) {
    const backendPath = path.join(rootPath, backendDir);

    // 1.1. Domain: internal/domain/<entity>.go
    const domainContent = `package domain

import "time"

type ${entityPascal} struct {
	ID          uint      \`json:"id" gorm:"primaryKey"\`
	Name        string    \`json:"name" gorm:"not null"\`
	Description string    \`json:"description"\`
	Price       float64   \`json:"price" gorm:"default:0"\`
	Status      string    \`json:"status" gorm:"default:active"\`
	CreatedAt   time.Time \`json:"created_at"\`
	UpdatedAt   time.Time \`json:"updated_at"\`
}

type Create${entityPascal}Request struct {
	Name        string  \`json:"name" binding:"required"\`
	Description string  \`json:"description"\`
	Price       float64 \`json:"price"\`
	Status      string  \`json:"status"\`
}

type Update${entityPascal}Request struct {
	Name        string  \`json:"name"\`
	Description string  \`json:"description"\`
	Price       float64 \`json:"price"\`
	Status      string  \`json:"status"\`
}

type ${entityPascal}Filter struct {
	Limit  int \`form:"limit"\`
	Offset int \`form:"offset"\`
}

type ${entityPascal}Repository interface {
	Create(item *${entityPascal}) error
	FindByID(id uint) (*${entityPascal}, error)
	FindAll(filter *${entityPascal}Filter) ([]${entityPascal}, int64, error)
	Update(item *${entityPascal}) error
	Delete(id uint) error
}

type ${entityPascal}Usecase interface {
	Create(req *Create${entityPascal}Request) (*${entityPascal}, error)
	GetByID(id uint) (*${entityPascal}, error)
	List(filter *${entityPascal}Filter) ([]${entityPascal}, int64, error)
	Update(id uint, req *Update${entityPascal}Request) (*${entityPascal}, error)
	Delete(id uint) error
}
`;
    const domainFile = path.join(backendPath, 'internal', 'domain', `${entitySnake}.go`);
    fs.writeFileSync(domainFile, domainContent);
    generatedFiles.push(`Go Domain: internal/domain/${entitySnake}.go`);

    // 1.2. Repository: internal/repository/<entity>_repository.go
    const repoContent = `package repository

import (
	"errors"

	"${backendDir}/internal/domain"
	"gorm.io/gorm"
)

type ${entityCamel}Repository struct {
	db *gorm.DB
}

func New${entityPascal}Repository(db *gorm.DB) domain.${entityPascal}Repository {
	return &${entityCamel}Repository{db: db}
}

func (r *${entityCamel}Repository) Create(item *domain.${entityPascal}) error {
	if r.db == nil {
		return errors.New("database mavjud emas")
	}
	return r.db.Create(item).Error
}

func (r *${entityCamel}Repository) FindByID(id uint) (*domain.${entityPascal}, error) {
	if r.db == nil {
		return nil, errors.New("database mavjud emas")
	}
	var item domain.${entityPascal}
	if err := r.db.First(&item, id).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *${entityCamel}Repository) FindAll(filter *domain.${entityPascal}Filter) ([]domain.${entityPascal}, int64, error) {
	if r.db == nil {
		return nil, 0, errors.New("database mavjud emas")
	}
	var items []domain.${entityPascal}
	var total int64

	db := r.db.Model(&domain.${entityPascal}{})
	db.Count(&total)

	limit := 20
	if filter != nil && filter.Limit > 0 {
		limit = filter.Limit
	}

	offset := 0
	if filter != nil && filter.Offset > 0 {
		offset = filter.Offset
	}

	if err := db.Limit(limit).Offset(offset).Order("id DESC").Find(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *${entityCamel}Repository) Update(item *domain.${entityPascal}) error {
	if r.db == nil {
		return errors.New("database mavjud emas")
	}
	return r.db.Save(item).Error
}

func (r *${entityCamel}Repository) Delete(id uint) error {
	if r.db == nil {
		return errors.New("database mavjud emas")
	}
	return r.db.Delete(&domain.${entityPascal}{}, id).Error
}
`;
    const repoFile = path.join(backendPath, 'internal', 'repository', `${entitySnake}_repository.go`);
    fs.writeFileSync(repoFile, repoContent);
    generatedFiles.push(`Go Repository: internal/repository/${entitySnake}_repository.go`);

    // 1.3. Usecase: internal/usecase/<entity>_usecase.go
    const usecaseContent = `package usecase

import (
	"${backendDir}/internal/domain"
)

type ${entityCamel}Usecase struct {
	repo domain.${entityPascal}Repository
}

func New${entityPascal}Usecase(repo domain.${entityPascal}Repository) domain.${entityPascal}Usecase {
	return &${entityCamel}Usecase{repo: repo}
}

func (u *${entityCamel}Usecase) Create(req *domain.Create${entityPascal}Request) (*domain.${entityPascal}, error) {
	item := &domain.${entityPascal}{
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Status:      req.Status,
	}
	if item.Status == "" {
		item.Status = "active"
	}

	if err := u.repo.Create(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (u *${entityCamel}Usecase) GetByID(id uint) (*domain.${entityPascal}, error) {
	return u.repo.FindByID(id)
}

func (u *${entityCamel}Usecase) List(filter *domain.${entityPascal}Filter) ([]domain.${entityPascal}, int64, error) {
	return u.repo.FindAll(filter)
}

func (u *${entityCamel}Usecase) Update(id uint, req *domain.Update${entityPascal}Request) (*domain.${entityPascal}, error) {
	item, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		item.Name = req.Name
	}
	if req.Description != "" {
		item.Description = req.Description
	}
	if req.Price > 0 {
		item.Price = req.Price
	}
	if req.Status != "" {
		item.Status = req.Status
	}

	if err := u.repo.Update(item); err != nil {
		return nil, err
	}
	return item, nil
}

func (u *${entityCamel}Usecase) Delete(id uint) error {
	return u.repo.Delete(id)
}
`;
    const usecaseFile = path.join(backendPath, 'internal', 'usecase', `${entitySnake}_usecase.go`);
    fs.writeFileSync(usecaseFile, usecaseContent);
    generatedFiles.push(`Go Usecase: internal/usecase/${entitySnake}_usecase.go`);

    // 1.4. Handler: internal/delivery/http/handlers/<entity>_handler.go
    const handlerContent = `package handlers

import (
	"net/http"
	"strconv"

	"${backendDir}/internal/domain"
	"github.com/gin-gonic/gin"
)

type ${entityPascal}Handler struct {
	usecase domain.${entityPascal}Usecase
}

func New${entityPascal}Handler(usecase domain.${entityPascal}Usecase) *${entityPascal}Handler {
	return &${entityPascal}Handler{usecase: usecase}
}

func (h *${entityPascal}Handler) Create(c *gin.Context) {
	var req domain.Create${entityPascal}Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item, err := h.usecase.Create(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, item)
}

func (h *${entityPascal}Handler) GetByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "noto'g'ri id"})
		return
	}

	item, err := h.usecase.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ma'lumot topilmadi"})
		return
	}

	c.JSON(http.StatusOK, item)
}

func (h *${entityPascal}Handler) List(c *gin.Context) {
	var filter domain.${entityPascal}Filter
	_ = c.ShouldBindQuery(&filter)

	items, total, err := h.usecase.List(&filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  items,
		"total": total,
	})
}

func (h *${entityPascal}Handler) Update(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "noto'g'ri id"})
		return
	}

	var req domain.Update${entityPascal}Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item, err := h.usecase.Update(uint(id), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}

func (h *${entityPascal}Handler) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "noto'g'ri id"})
		return
	}

	if err := h.usecase.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "muvaffaqiyatli o'chirildi"})
}
`;
    const handlerFile = path.join(backendPath, 'internal', 'delivery', 'http', 'handlers', `${entitySnake}_handler.go`);
    fs.writeFileSync(handlerFile, handlerContent);
    generatedFiles.push(`Go Handler: internal/delivery/http/handlers/${entitySnake}_handler.go`);

    // 1.5. Avtomatik migratsiyaga qo'shish (cmd/migrate/main.go)
    const migrateFile = path.join(backendPath, 'cmd', 'migrate', 'main.go');
    if (fs.existsSync(migrateFile)) {
      let migrateCode = fs.readFileSync(migrateFile, 'utf8');
      if (!migrateCode.includes(`&domain.${entityPascal}{}`)) {
        migrateCode = migrateCode.replace(
          /AutoMigrate\((.*?)\)/s,
          (match, p1) => `AutoMigrate(${p1.trim()}, &domain.${entityPascal}{})`
        );
        fs.writeFileSync(migrateFile, migrateCode);
        generatedFiles.push(`Go AutoMigrate: cmd/migrate/main.go yangilandi (&domain.${entityPascal}{})`);
      }
    }

    // 1.6. Avtomatik routerga qo'shish (cmd/api/main.go)
    const mainGoFile = path.join(backendPath, 'cmd', 'api', 'main.go');
    if (fs.existsSync(mainGoFile)) {
      let mainGoCode = fs.readFileSync(mainGoFile, 'utf8');
      if (!mainGoCode.includes(`${entityCamel}Handler`)) {
        const repoInit = `\n\t${entityCamel}Repo := repository.New${entityPascal}Repository(db)\n\t${entityCamel}Usecase := usecase.New${entityPascal}Usecase(${entityCamel}Repo)\n\t${entityCamel}Handler := handlers.New${entityPascal}Handler(${entityCamel}Usecase)`;
        mainGoCode = mainGoCode.replace(
          /authHandler := handlers\.NewAuthHandler\(authUsecase\)/,
          `authHandler := handlers.NewAuthHandler(authUsecase)${repoInit}`
        );

        const routeGroup = `\n\t\t// ${entityPascal} CRUD yo'llari\n\t\t${entityPlural} := api.Group("/${entityPlural}")\n\t\t{\n\t\t\t${entityPlural}.GET("", ${entityCamel}Handler.List)\n\t\t\t${entityPlural}.GET("/:id", ${entityCamel}Handler.GetByID)\n\t\t\t${entityPlural}.POST("", ${entityCamel}Handler.Create)\n\t\t\t${entityPlural}.PUT("/:id", ${entityCamel}Handler.Update)\n\t\t\t${entityPlural}.DELETE("/:id", ${entityCamel}Handler.Delete)\n\t\t}`;
        mainGoCode = mainGoCode.replace(
          /auth\.POST\("\/login", authHandler\.Login\)\s*\}/s,
          `auth.POST("/login", authHandler.Login)\n\t\t}${routeGroup}`
        );

        fs.writeFileSync(mainGoFile, mainGoCode);
        generatedFiles.push(`Go Routes: cmd/api/main.go yangilandi (/api/${entityPlural})`);
      }
    }
  }

  // ==========================================
  // 2. FRONTEND PUBLIC (Next.js)
  // ==========================================
  if (publicDir) {
    const publicPath = path.join(rootPath, publicDir);

    // 2.1. src/types/<entity>.type.ts
    const typeContent = `export interface ${entityPascal} {
  id: number;
  name: string;
  description?: string;
  price: number;
  status: "active" | "inactive" | string;
  created_at?: string;
  updated_at?: string;
}

export interface Create${entityPascal}Dto {
  name: string;
  description?: string;
  price: number;
  status?: string;
}

export interface Update${entityPascal}Dto {
  name?: string;
  description?: string;
  price?: number;
  status?: string;
}

export interface ${entityPascal}FilterDto {
  limit?: number;
  offset?: number;
}
`;
    const typeFile = path.join(publicPath, 'src', 'types', `${entitySnake}.type.ts`);
    fs.mkdirSync(path.join(publicPath, 'src', 'types'), { recursive: true });
    fs.writeFileSync(typeFile, typeContent);
    generatedFiles.push(`Public Types: src/types/${entitySnake}.type.ts`);

    // 2.2. Barrel export: src/types/index.ts
    const indexFile = path.join(publicPath, 'src', 'types', 'index.ts');
    let indexContent = fs.existsSync(indexFile) ? fs.readFileSync(indexFile, 'utf8') : '';
    if (!indexContent.includes(`./${entitySnake}.type`)) {
      indexContent += `\nexport * from "./${entitySnake}.type";`;
      fs.writeFileSync(indexFile, indexContent.trim() + '\n');
    }

    // 2.3. src/services/<entity>.service.ts
    const serviceContent = `import { apiClient } from "@/lib/axios";
import {
  ${entityPascal},
  Create${entityPascal}Dto,
  Update${entityPascal}Dto,
  ${entityPascal}FilterDto
} from "@/types";

export const ${entityCamel}Service = {
  async getAll(params?: ${entityPascal}FilterDto): Promise<{ data: ${entityPascal}[]; total: number }> {
    const response = await apiClient.get<{ data: ${entityPascal}[]; total: number }>("/${entityPlural}", { params });
    return response.data;
  },

  async getById(id: number): Promise<${entityPascal}> {
    const response = await apiClient.get<${entityPascal}>(\`/${entityPlural}/\${id}\`);
    return response.data;
  },

  async create(data: Create${entityPascal}Dto): Promise<${entityPascal}> {
    const response = await apiClient.post<${entityPascal}>("/${entityPlural}", data);
    return response.data;
  },

  async update(id: number, data: Update${entityPascal}Dto): Promise<${entityPascal}> {
    const response = await apiClient.put<${entityPascal}>(\`/${entityPlural}/\${id}\`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(\`/${entityPlural}/\${id}\`);
    return response.data;
  },
};
`;
    const serviceFile = path.join(publicPath, 'src', 'services', `${entitySnake}.service.ts`);
    fs.mkdirSync(path.join(publicPath, 'src', 'services'), { recursive: true });
    fs.writeFileSync(serviceFile, serviceContent);
    generatedFiles.push(`Public Service: src/services/${entitySnake}.service.ts`);
  }

  // ==========================================
  // 3. FRONTEND ADMIN (React + Vite)
  // ==========================================
  if (adminDir) {
    const adminPath = path.join(rootPath, adminDir);

    // 3.1. src/types/<entity>.type.ts
    const adminTypeContent = `export interface ${entityPascal} {
  id: number;
  name: string;
  description?: string;
  price: number;
  status: "active" | "inactive" | string;
  created_at?: string;
  updated_at?: string;
}

export interface Create${entityPascal}Dto {
  name: string;
  description?: string;
  price: number;
  status?: string;
}

export interface Update${entityPascal}Dto {
  name?: string;
  description?: string;
  price?: number;
  status?: string;
}

export interface ${entityPascal}FilterDto {
  limit?: number;
  offset?: number;
}
`;
    const adminTypeFile = path.join(adminPath, 'src', 'types', `${entitySnake}.type.ts`);
    fs.mkdirSync(path.join(adminPath, 'src', 'types'), { recursive: true });
    fs.writeFileSync(adminTypeFile, adminTypeContent);
    generatedFiles.push(`Admin Types: src/types/${entitySnake}.type.ts`);

    // 3.2. Barrel export: src/types/index.ts
    const adminIndexFile = path.join(adminPath, 'src', 'types', 'index.ts');
    let adminIndexContent = fs.existsSync(adminIndexFile) ? fs.readFileSync(adminIndexFile, 'utf8') : '';
    if (!adminIndexContent.includes(`./${entitySnake}.type`)) {
      adminIndexContent += `\nexport * from "./${entitySnake}.type";`;
      fs.writeFileSync(adminIndexFile, adminIndexContent.trim() + '\n');
    }

    // 3.3. src/api/<entity>.service.ts
    const adminServiceContent = `import { apiClient } from "./client";
import {
  ${entityPascal},
  Create${entityPascal}Dto,
  Update${entityPascal}Dto,
  ${entityPascal}FilterDto
} from "../types";

export const ${entityCamel}Service = {
  async getAll(params?: ${entityPascal}FilterDto): Promise<{ data: ${entityPascal}[]; total: number }> {
    const response = await apiClient.get<{ data: ${entityPascal}[]; total: number }>("/${entityPlural}", { params });
    return response.data;
  },

  async getById(id: number): Promise<${entityPascal}> {
    const response = await apiClient.get<${entityPascal}>(\`/${entityPlural}/\${id}\`);
    return response.data;
  },

  async create(data: Create${entityPascal}Dto): Promise<${entityPascal}> {
    const response = await apiClient.post<${entityPascal}>("/${entityPlural}", data);
    return response.data;
  },

  async update(id: number, data: Update${entityPascal}Dto): Promise<${entityPascal}> {
    const response = await apiClient.put<${entityPascal}>(\`/${entityPlural}/\${id}\`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(\`/${entityPlural}/\${id}\`);
    return response.data;
  },
};
`;
    const adminServiceFile = path.join(adminPath, 'src', 'api', `${entitySnake}.service.ts`);
    fs.mkdirSync(path.join(adminPath, 'src', 'api'), { recursive: true });
    fs.writeFileSync(adminServiceFile, adminServiceContent);
    generatedFiles.push(`Admin Service: src/api/${entitySnake}.service.ts`);
  }

  logger.success(`[${entityPascal}] uchun to‘liq CRUD moduli muvaffaqiyatli yaratildi!`);
  console.log(chalk.bold.white('\n📦 Yaratilgan fayllar:'));
  generatedFiles.forEach((f) => console.log(`  ${chalk.green('✔')} ${f}`));
  console.log(chalk.cyan(`\n⚡ Bazasini yangilash uchun:`));
  console.log(chalk.yellow(`  make migrate-up\n`));
}

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export async function generateBackend(rootPath, projectName, options) {
  const backendName = `${projectName}-backend`;
  const backendPath = path.join(rootPath, backendName);
  const framework = options.goFramework || 'gin';
  const dbChoice = options.goDatabase || 'gorm';
  const extras = options.goExtras || [];
  const withAuth = extras.includes('auth-flow');
  const withMigrateSeed = extras.includes('migrate-seed');

  const spinner = logger.spinner(`[3/3] Go Backend loyihasi yaratilmoqda (${backendName})...`).start();

  try {
    fs.mkdirSync(backendPath, { recursive: true });

    // 1. Clean Architecture papkalari
    const goDirs = [
      'cmd/api',
      'cmd/migrate',
      'cmd/seed',
      'config',
      'internal/delivery/http/handlers',
      'internal/delivery/http/middleware',
      'internal/domain',
      'internal/usecase',
      'internal/repository',
      'pkg/logger',
      'pkg/utils'
    ];
    goDirs.forEach((dir) => fs.mkdirSync(path.join(backendPath, dir), { recursive: true }));

    // 2. config/config.go
    const configGo = `package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port      string
	DBURL     string
	JWTSecret string
}

func LoadConfig() *Config {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgrespassword@localhost:5432/${projectName}_db?sslmode=disable"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "supersecretjwtkey_change_in_production"
	}

	return &Config{
		Port:      port,
		DBURL:     dbURL,
		JWTSecret: jwtSecret,
	}
}
`;
    fs.writeFileSync(path.join(backendPath, 'config/config.go'), configGo);

    // 3. Database configuration (config/database.go)
    const dbFile = `package config

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDB(dsn string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Printf("⚠️ DB ulanishida ogohlantirish (Server davom etadi): %v", err)
		return nil
	}
	log.Println("✔ PostgreSQL (GORM) muvaffaqiyatli ulandi")
	return db
}
`;
    fs.writeFileSync(path.join(backendPath, 'config/database.go'), dbFile);

    // 4. internal/domain/user.go
    const userDomain = `package domain

import "time"

type User struct {
	ID        uint      \`json:"id" gorm:"primaryKey"\`
	Name      string    \`json:"name" gorm:"not null"\`
	Email     string    \`json:"email" gorm:"uniqueIndex;not null"\`
	Password  string    \`json:"-" gorm:"not null"\`
	Role      string    \`json:"role" gorm:"default:user"\`
	CreatedAt time.Time \`json:"created_at"\`
	UpdatedAt time.Time \`json:"updated_at"\`
}

type RegisterRequest struct {
	Name     string \`json:"name" binding:"required"\`
	Email    string \`json:"email" binding:"required,email"\`
	Password string \`json:"password" binding:"required,min=6"\`
}

type LoginRequest struct {
	Email    string \`json:"email" binding:"required,email"\`
	Password string \`json:"password" binding:"required"\`
}

type AuthResponse struct {
	Token string \`json:"token"\`
	User  *User  \`json:"user"\`
}

type UserRepository interface {
	Create(user *User) error
	FindByEmail(email string) (*User, error)
	FindByID(id uint) (*User, error)
}

type AuthUsecase interface {
	Register(req *RegisterRequest) (*AuthResponse, error)
	Login(req *LoginRequest) (*AuthResponse, error)
	GetMe(userID uint) (*User, error)
}
`;
    fs.writeFileSync(path.join(backendPath, 'internal/domain/user.go'), userDomain);

    // 5. internal/repository/user_repository.go
    const userRepo = `package repository

import (
	"errors"

	"${backendName}/internal/domain"
	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) domain.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *domain.User) error {
	if r.db == nil {
		return errors.New("database mavjud emas")
	}
	return r.db.Create(user).Error
}

func (r *userRepository) FindByEmail(email string) (*domain.User, error) {
	if r.db == nil {
		return nil, errors.New("database mavjud emas")
	}
	var user domain.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByID(id uint) (*domain.User, error) {
	if r.db == nil {
		return nil, errors.New("database mavjud emas")
	}
	var user domain.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
`;
    fs.writeFileSync(path.join(backendPath, 'internal/repository/user_repository.go'), userRepo);

    // 6. JWT Token Middleware (internal/delivery/http/middleware/auth.go)
    const jwtMiddleware = `package middleware

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID uint   \`json:"user_id"\`
	Email  string \`json:"email"\`
	Role   string \`json:"role"\`
	jwt.RegisteredClaims
}

func GenerateToken(userID uint, email, role, secret string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ValidateToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("noto'g'ri token")
}

func AuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header talab qilinadi"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Noto'g'ri token formati (Bearer <token>)"})
			c.Abort()
			return
		}

		claims, err := ValidateToken(parts[1], secret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Yaroqsiz yoki muddati o'tgan token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("userEmail", claims.Email)
		c.Set("userRole", claims.Role)
		c.Next()
	}
}
`;
    fs.writeFileSync(path.join(backendPath, 'internal/delivery/http/middleware/auth.go'), jwtMiddleware);

    // 7. internal/usecase/auth_usecase.go
    const authUsecase = `package usecase

import (
	"errors"

	"${backendName}/internal/delivery/http/middleware"
	"${backendName}/internal/domain"
	"golang.org/x/crypto/bcrypt"
)

type authUsecase struct {
	userRepo  domain.UserRepository
	jwtSecret string
}

func NewAuthUsecase(userRepo domain.UserRepository, jwtSecret string) domain.AuthUsecase {
	return &authUsecase{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
	}
}

func (u *authUsecase) Register(req *domain.RegisterRequest) (*domain.AuthResponse, error) {
	existing, _ := u.userRepo.FindByEmail(req.Email)
	if existing != nil {
		return nil, errors.New("ushbu email allaqachon ro'yxatdan o'tgan")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &domain.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     "user",
	}

	if err := u.userRepo.Create(user); err != nil {
		return nil, err
	}

	token, err := middleware.GenerateToken(user.ID, user.Email, user.Role, u.jwtSecret)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		Token: token,
		User:  user,
	}, nil
}

func (u *authUsecase) Login(req *domain.LoginRequest) (*domain.AuthResponse, error) {
	user, err := u.userRepo.FindByEmail(req.Email)
	if err != nil || user == nil {
		return nil, errors.New("email yoki parol noto'g'ri")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("email yoki parol noto'g'ri")
	}

	token, err := middleware.GenerateToken(user.ID, user.Email, user.Role, u.jwtSecret)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		Token: token,
		User:  user,
	}, nil
}

func (u *authUsecase) GetMe(userID uint) (*domain.User, error) {
	return u.userRepo.FindByID(userID)
}
`;
    fs.writeFileSync(path.join(backendPath, 'internal/usecase/auth_usecase.go'), authUsecase);

    // 8. internal/delivery/http/handlers/auth_handler.go
    const authHandler = `package handlers

import (
	"net/http"

	"${backendName}/internal/domain"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authUsecase domain.AuthUsecase
}

func NewAuthHandler(authUsecase domain.AuthUsecase) *AuthHandler {
	return &AuthHandler{authUsecase: authUsecase}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req domain.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.authUsecase.Register(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req domain.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.authUsecase.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Foydalanuvchi aniqlanmadi"})
		return
	}

	user, err := h.authUsecase.GetMe(userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Foydalanuvchi topilmadi"})
		return
	}

	c.JSON(http.StatusOK, user)
}
`;
    fs.writeFileSync(path.join(backendPath, 'internal/delivery/http/handlers/auth_handler.go'), authHandler);

    // 9. cmd/migrate/main.go (Database migratsiyasi)
    const migrateMain = `package main

import (
	"log"

	"${backendName}/config"
	"${backendName}/internal/domain"
)

func main() {
	cfg := config.LoadConfig()
	log.Println("⏳ Database migratsiyasi boshlanmoqda...")

	db := config.InitDB(cfg.DBURL)
	if db == nil {
		log.Fatal("❌ Databasega ulanib bo'lmadi!")
	}

	if err := db.AutoMigrate(&domain.User{}); err != nil {
		log.Fatalf("❌ Migratsiya xatosi: %v", err)
	}

	log.Println("✔ Migratsiya muvaffaqiyatli yakunlandi: 'users' jadvali yaratildi/yangilandi.")
}
`;
    fs.writeFileSync(path.join(backendPath, 'cmd/migrate/main.go'), migrateMain);

    // 10. cmd/seed/main.go (Superadmin yaratish)
    const seedMain = `package main

import (
	"log"

	"${backendName}/config"
	"${backendName}/internal/domain"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	cfg := config.LoadConfig()
	log.Println("🌱 Dastlabki ma'lumotlar (Seed) kiritilmoqda...")

	db := config.InitDB(cfg.DBURL)
	if db == nil {
		log.Fatal("❌ Databasega ulanib bo'lmadi!")
	}

	// Jadvallarni tekshirib olish
	_ = db.AutoMigrate(&domain.User{})

	var existing domain.User
	if err := db.Where("email = ?", "admin@example.com").First(&existing).Error; err == nil {
		log.Println("ℹ Superadmin (admin@example.com) allaqachon mavjud.")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("Admin123!"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("❌ Parol xeshlashda xato: %v", err)
	}

	adminUser := domain.User{
		Name:     "Super Admin",
		Email:    "admin@example.com",
		Password: string(hashedPassword),
		Role:     "superadmin",
	}

	if err := db.Create(&adminUser).Error; err != nil {
		log.Fatalf("❌ Superadmin yaratishda xato: %v", err)
	}

	log.Println("✔ Superadmin muvaffaqiyatli yaratildi!")
	log.Println("  Email: admin@example.com")
	log.Println("  Parol: Admin123!")
}
`;
    fs.writeFileSync(path.join(backendPath, 'cmd/seed/main.go'), seedMain);

    // 11. cmd/api/main.go (Serverni ishga tushirish)
    const mainGoCode = `package main

import (
	"fmt"
	"net/http"

	"${backendName}/config"
	"${backendName}/internal/delivery/http/handlers"
	"${backendName}/internal/delivery/http/middleware"
	"${backendName}/internal/repository"
	"${backendName}/internal/usecase"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	// 1. Database ulanishi
	db := config.InitDB(cfg.DBURL)

	// 2. Clean Architecture qatlamlari
	userRepo := repository.NewUserRepository(db)
	authUsecase := usecase.NewAuthUsecase(userRepo, cfg.JWTSecret)
	authHandler := handlers.NewAuthHandler(authUsecase)

	// 3. Router va Middleware sozlamalari
	r := gin.Default()
	r.Use(cors.Default())

	api := r.Group("/api")
	{
		// Health check
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "healthy",
				"service": "${backendName}",
				"version": "1.0.0",
			})
		})

		// Auth ochiq yo'llar
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Auth himoyalangan yo'llar (JWT talab qilinadi)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			protected.GET("/auth/me", authHandler.GetMe)
		}
	}

	fmt.Printf("🚀 Gin Backend %s-portda ishga tushdi...\\n", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		fmt.Printf("Server xatosi: %v\\n", err)
	}
}
`;
    fs.writeFileSync(path.join(backendPath, 'cmd/api/main.go'), mainGoCode);

    // 12. .env va .env.example
    const envExample = `PORT=8080
DB_URL=postgres://postgres:postgrespassword@localhost:5432/${projectName}_db?sslmode=disable
JWT_SECRET=supersecretjwtkey_change_in_production
`;
    fs.writeFileSync(path.join(backendPath, '.env.example'), envExample);
    fs.writeFileSync(path.join(backendPath, '.env'), envExample);

    // 13. go mod init va zarur paketlar
    spinner.text = `[3/3] Go Clean Architecture paketlari o'rnatilmoqda (Gin, GORM, JWT, bcrypt)...`;
    execSync(`go mod init ${backendName}`, { cwd: backendPath, stdio: 'ignore' });

    const goPackages = [
      'github.com/gin-gonic/gin',
      'github.com/gin-contrib/cors',
      'github.com/joho/godotenv',
      'github.com/golang-jwt/jwt/v5',
      'golang.org/x/crypto/bcrypt',
      'gorm.io/gorm',
      'gorm.io/driver/postgres'
    ];

    for (const pkg of goPackages) {
      try {
        execSync(`go get ${pkg}`, { cwd: backendPath, stdio: 'ignore' });
      } catch (e) {
        // tarmoq offline bo'lsa ham davom etadi
      }
    }

    try {
      execSync(`go mod tidy`, { cwd: backendPath, stdio: 'ignore' });
    } catch (e) {
      // ignore
    }

    spinner.succeed(`Go Clean Architecture Backend tayyorlandi: ${backendName} (Auth + Migratsiya + Seed)`);
    return `${backendName} (Go Clean Architecture: Gin, GORM, JWT Auth, Migrations, Seed)`;
  } catch (err) {
    spinner.fail(`Go Backend yaratishda xatolik: ${err.message}`);
    throw err;
  }
}

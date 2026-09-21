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

  const spinner = logger.spinner(`[3/3] Go Backend loyihasi yaratilmoqda (${backendName})...`).start();

  try {
    fs.mkdirSync(backendPath, { recursive: true });

    // 1. Clean Architecture papkalari
    const goDirs = [
      'cmd/api',
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
		dbURL = "postgres://postgres:postgres@localhost:5432/myapp_db?sslmode=disable"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "supersecretjwtkey"
	}

	return &Config{
		Port:      port,
		DBURL:     dbURL,
		JWTSecret: jwtSecret,
	}
}
`;
    fs.writeFileSync(path.join(backendPath, 'config/config.go'), configGo);

    // 3. internal/domain/user.go
    const userDomain = `package domain

import "time"

type User struct {
	ID        uint      \`json:"id" gorm:"primaryKey"\`
	Name      string    \`json:"name"\`
	Email     string    \`json:"email" gorm:"unique;not null"\`
	Password  string    \`json:"-"\`
	Role      string    \`json:"role" gorm:"default:user"\`
	CreatedAt time.Time \`json:"created_at"\`
	UpdatedAt time.Time \`json:"updated_at"\`
}
`;
    fs.writeFileSync(path.join(backendPath, 'internal/domain/user.go'), userDomain);

    // 4. JWT Middleware (agar tanlangan bo'lsa)
    if (extras.includes('jwt')) {
      const jwtMiddleware = `package middleware

import (
	"errors"
	"time"

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
`;
      fs.writeFileSync(path.join(backendPath, 'internal/delivery/http/middleware/auth.go'), jwtMiddleware);
    }

    // 5. Database fayli
    if (dbChoice === 'gorm') {
      const dbFile = `package config

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDB(dsn string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Printf("⚠️ DB ulanishida ogohlantirish: %v", err)
		return nil
	}
	log.Println("✔ PostgreSQL (GORM) muvaffaqiyatli ulandi")
	return db
}
`;
      fs.writeFileSync(path.join(backendPath, 'config/database.go'), dbFile);
    }

    // 6. main.go shakllantirish
    let mainGoCode = '';
    if (framework === 'gin') {
      mainGoCode = `package main

import (
	"fmt"
	"net/http"

	"${backendName}/config"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	r := gin.Default()
	r.Use(cors.Default())

	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "healthy",
				"service": "${backendName}",
				"version": "1.0.0",
			})
		})
	}

	fmt.Printf("🚀 Gin Backend %s-portda ishga tushdi...\\n", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		fmt.Printf("Server xatosi: %v\\n", err)
	}
}
`;
    } else if (framework === 'fiber') {
      mainGoCode = `package main

import (
	"fmt"

	"${backendName}/config"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	cfg := config.LoadConfig()

	app := fiber.New()
	app.Use(cors.New())

	api := app.Group("/api")
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "${backendName}",
			"version": "1.0.0",
		})
	})

	fmt.Printf("🚀 Fiber Backend %s-portda ishga tushdi...\\n", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		fmt.Printf("Server xatosi: %v\\n", err)
	}
}
`;
    } else if (framework === 'chi') {
      mainGoCode = `package main

import (
	"fmt"
	"net/http"

	"${backendName}/config"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	cfg := config.LoadConfig()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Route("/api", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(\`{"status":"healthy","service":"${backendName}","version":"1.0.0"}\`))
		})
	})

	fmt.Printf("🚀 Chi Backend %s-portda ishga tushdi...\\n", cfg.Port)
	if err := http.ListenAndServe(":" + cfg.Port, r); err != nil {
		fmt.Printf("Server xatosi: %v\\n", err)
	}
}
`;
    } else {
      // standard net/http
      mainGoCode = `package main

import (
	"fmt"
	"net/http"

	"${backendName}/config"
)

func main() {
	cfg := config.LoadConfig()

	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(\`{"status":"healthy","service":"${backendName}","version":"1.0.0"}\`))
	})

	fmt.Printf("🚀 Standart net/http Backend %s-portda ishga tushdi...\\n", cfg.Port)
	if err := http.ListenAndServe(":" + cfg.Port, nil); err != nil {
		fmt.Printf("Server xatosi: %v\\n", err)
	}
}
`;
    }

    fs.writeFileSync(path.join(backendPath, 'cmd/api/main.go'), mainGoCode);

    // 7. .env va .env.example
    const envExample = `PORT=8080
DB_URL=postgres://postgres:postgres@localhost:5432/myapp_db?sslmode=disable
JWT_SECRET=supersecretjwtkey_change_in_production
`;
    fs.writeFileSync(path.join(backendPath, '.env.example'), envExample);
    fs.writeFileSync(path.join(backendPath, '.env'), envExample);

    // 8. go mod init va go get paketlari
    spinner.text = `[3/3] Go modullari o'rnatilmoqda (${framework.toUpperCase()})...`;
    execSync(`go mod init ${backendName}`, { cwd: backendPath, stdio: 'ignore' });

    // Asosiy dependency-lar
    const goPackages = ['github.com/joho/godotenv'];
    if (framework === 'gin') {
      goPackages.push('github.com/gin-gonic/gin', 'github.com/gin-contrib/cors');
    } else if (framework === 'fiber') {
      goPackages.push('github.com/gofiber/fiber/v2');
    } else if (framework === 'chi') {
      goPackages.push('github.com/go-chi/chi/v5', 'github.com/go-chi/cors');
    }

    if (dbChoice === 'gorm') {
      goPackages.push('gorm.io/gorm', 'gorm.io/driver/postgres');
    } else if (dbChoice === 'pgx') {
      goPackages.push('github.com/jackc/pgx/v5');
    }

    if (extras.includes('jwt')) {
      goPackages.push('github.com/golang-jwt/jwt/v5');
    }

    for (const pkg of goPackages) {
      try {
        execSync(`go get ${pkg}`, { cwd: backendPath, stdio: 'ignore' });
      } catch (e) {
        // tarmoq yoki offline holatda xato bersa ham davom etamiz
      }
    }

    try {
      execSync(`go mod tidy`, { cwd: backendPath, stdio: 'ignore' });
    } catch (e) {
      // ignore
    }

    spinner.succeed(`Go Backend muvaffaqiyatli tayyorlandi: ${backendName}`);
    return `${backendName} (Framework: ${framework.toUpperCase()}, DB: ${dbChoice.toUpperCase()})`;
  } catch (err) {
    spinner.fail(`Go Backend yaratishda xatolik: ${err.message}`);
    throw err;
  }
}

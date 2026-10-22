# Aicode 工作区（前端 + 后端）

前后端分仓库、在工作区内并列放置，命名对齐常见企业 monorepo（如 `aisports-web` / `aisports-api`）。

```
mfe-workspace/
├── aicode-web/          → 指向前端 monorepo（Vite + Module Federation，对应 aisports-web）
└── aicode-platform/     → Java Spring Boot 接口服务（MySQL 5.7，对应 aisports-api / service）
    ├── pom.xml
    ├── sql/init.sql
    ├── docker-compose.yml
    └── src/main/java/...
```

## 启动顺序

```bash
# 1. MySQL（在 aicode-platform 目录）
cd aicode-platform
docker compose up -d

# 2. 接口服务（需 Java 8 + Maven）
mvn spring-boot:run
# 默认 http://localhost:8080

# 3. 前端（在 aicode-web 目录）
cd ../aicode-web
npm install
npm run dev
# 默认 http://localhost:5000
```

演示登录：`demo@company.com` / `demo123`

详细接口说明见 [aicode-platform/README.md](./aicode-platform/README.md)。  
前端微前端说明见 [aicode-web/README.md](./aicode-web/README.md)。

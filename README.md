# App Framework

React Web、React Native + Expo 移动端、Fastify API 的 pnpm monorepo 框架，内置密码登录与 JWT 鉴权，不含业务代码。

```text
apps/web             Web 界面与浏览器路由
apps/mobile          Android / iOS 原生界面与 Expo Router
apps/server          API、MySQL 与迁移（结构参照 fastify/demo）
apps/cli             命令行入口
packages/contracts   API 请求 schema 与推导类型
packages/api-client  HTTP 请求与鉴权
```

客户端依赖共享包，服务端依赖 contracts。共享包不依赖应用；数据库只在服务端访问。Web 和移动端分别实现界面。

## 开发

需要 Node.js 24 和 pnpm 8.15.9。

后端使用本机 Docker 中的 MySQL。复制 `deploy/.env.local.example` 为 `deploy/.env.local`，设置数据库密码、登录密码 `APP_PASSWORD` 和令牌签名密钥 `JWT_SECRET`（可用 `openssl rand -base64 32` 生成）。数据库按 `deploy/.env.local` 中的库名、用户和密码初始化，监听 `127.0.0.1:3306`。

除 `/health`、`/api/auth/login` 和接口文档外，所有 `/api` 接口都需要登录令牌。Web 和移动端首次打开时输入 `APP_PASSWORD` 登录，令牌有效期 30 天；更换 `JWT_SECRET` 会使所有令牌失效。登录接口每分钟最多 5 次，其他接口每个 IP 每分钟最多 `RATE_LIMIT_MAX` 次（默认 100）。

表结构由 `apps/server/migrations` 中的 postgrator 迁移维护，文件名为 `编号.do.名称.sql`，执行记录在 `schemaversion` 表中。修改表结构时新增迁移文件，不修改已执行的文件。服务启动不会执行迁移，首次开发或更新表结构后先运行 `pnpm db:migrate`。

```sh
pnpm install
docker compose -f deploy/mysql.compose.yaml up -d
pnpm db:migrate
pnpm dev
```

Web 为 `http://localhost:5173`，API 为 `http://localhost:3000/api`，接口文档为 `http://localhost:3000/api/docs`。

移动端先复制 `apps/mobile/.env.example` 为 `apps/mobile/.env.local`，设置 `EXPO_PUBLIC_API_URL`。Android 模拟器访问电脑时可使用 `http://10.0.2.2:3000/api`，iOS 模拟器可使用 `http://localhost:3000/api`。此变量会打包进客户端，不能放秘密信息。

```sh
pnpm dev:mobile
pnpm ios
pnpm android
```

## 新增业务模块

- 服务端：在 `apps/server/src/plugins/app` 放 repository 等应用插件，在 `apps/server/src/routes/api/<模块>/index.ts` 写接口，`routes/api/autohooks.ts` 统一校验令牌；表结构写到 `apps/server/migrations`。
- 契约：请求与响应 schema 放 `packages/contracts`，在 `packages/api-client` 的 `createApi` 中增加对应请求方法。
- Web：在 `apps/web/src/routes` 新增页面，注册到 `src/router.tsx` 与 `src/router/routes.ts`，在 `src/layouts/AppLayout.tsx` 增加导航。
- 移动端：在 `apps/mobile/app` 新增页面，Tab 页放 `app/(tabs)`。

## 验证与构建

服务端测试连接本机 MySQL，使用 `deploy/mysql-init/test-user.sql` 创建的 `app_test` 用户（密码 `app_test`），该用户仅有 `app_test_` 前缀数据库的权限。`deploy/.env.test` 设置 `MYSQL_HOST=127.0.0.1`、`MYSQL_PORT=3306`、`MYSQL_USER=app_test`、`MYSQL_PASSWORD=app_test`。每个用例使用独立数据库，结束后删除。

```sh
pnpm typecheck
pnpm test
pnpm build
```

## Docker

复制 `deploy/.env.production.example` 为 `deploy/.env.production`，配置从容器内可访问的 MySQL 连接、`APP_PASSWORD`、`JWT_SECRET`，然后在项目根目录构建并启动：

```sh
pnpm install --frozen-lockfile
pnpm build:docker
docker compose build
docker compose run --rm app-framework node apps/server/dist/scripts/migrate.js
docker compose up -d
```

`pnpm build:docker` 在本地构建 Web、服务端和共享包，再用 `pnpm deploy` 把服务端及其生产依赖输出到 `output/docker/server`。访问 `http://localhost:3000`，Web 和 API 由同一个 Fastify 服务提供，健康检查地址为 `/health`。`deploy/reload-production.sh` 构建镜像并通过 SSH 发布到服务器，使用前修改其中的 `server` 和 `remote_dir`。

使用手册见 [docs/GUIDE.md](docs/GUIDE.md)。

# App Framework 介绍与使用手册

## 一、框架介绍

### 1.1 定位

App Framework 是一个全栈 TypeScript monorepo 框架，一套代码仓库同时提供：

- **Web 端**：React 单页应用
- **移动端**：React Native + Expo，iOS / Android 原生界面
- **服务端**：Fastify API + MySQL
- **命令行**：commander CLI

框架已内置密码登录、JWT 鉴权、限流、安全头、接口文档、健康检查、数据库迁移、Docker 部署，不含任何业务代码，拿来即可开始写业务模块。

### 1.2 技术栈

| 层 | 技术 |
| --- | --- |
| 包管理 | pnpm 8.15.9 workspace，Node.js 24 |
| 服务端 | Fastify 5、@fastify/autoload、TypeBox、mysql2、postgrator、@fastify/jwt |
| 共享包 | TypeBox schema（contracts）、axios（api-client） |
| Web | React 19、React Router 8、Vite 8、Tailwind CSS 4、shadcn/ui（Radix）、TanStack Query 5、lucide-react |
| 移动端 | Expo 57、React Native 0.86、Expo Router、expo-secure-store、TanStack Query 5 |
| 部署 | Docker、Docker Compose、MySQL 8.4 |

### 1.3 目录结构

```text
app-framework/
├── apps/
│   ├── server/                  Fastify API
│   │   ├── migrations/          数据库迁移 SQL（编号.do.名称.sql）
│   │   ├── src/
│   │   │   ├── server.ts        创建实例、日志、优雅退出、监听端口
│   │   │   ├── app.ts           加载插件与路由、全局错误与 404 处理
│   │   │   ├── migrate.ts       迁移执行函数
│   │   │   ├── scripts/migrate.ts  命令行迁移入口
│   │   │   ├── plugins/
│   │   │   │   ├── external/    第三方插件配置（env、jwt、mysql、限流等）
│   │   │   │   └── app/         业务插件（repository 等），目前为空
│   │   │   └── routes/api/
│   │   │       ├── autohooks.ts 统一校验登录令牌
│   │   │       └── auth/        登录接口
│   │   └── test/                node:test 测试
│   ├── web/                     React Web
│   │   └── src/
│   │       ├── main.tsx         入口
│   │       ├── router.tsx       路由表（懒加载）
│   │       ├── router/routes.ts 页面标题定义
│   │       ├── routes/          页面（app.tsx 登录守卫、login.tsx、home.tsx）
│   │       ├── layouts/         侧边栏布局
│   │       ├── components/ui/   shadcn 组件
│   │       ├── providers/       QueryClient
│   │       ├── api.ts           令牌存储与 API 实例
│   │       └── styles.css       主题变量与布局样式
│   ├── mobile/                  Expo 移动端
│   │   ├── app/                 Expo Router 页面（_layout、login、(tabs)）
│   │   └── src/                 api、通用组件、样式
│   └── cli/                     命令行
├── packages/
│   ├── contracts/               请求/响应 schema 与类型，前后端共用
│   └── api-client/              HTTP 客户端，Web 与移动端共用
├── deploy/                      环境变量示例、本地 MySQL、发布脚本
├── Dockerfile
└── compose.yaml
```

### 1.4 依赖关系

```text
apps/web ─────┐
apps/mobile ──┼──> packages/api-client ──> packages/contracts
              │                                  ▲
apps/server ──┴──────────────────────────────────┘
```

- 共享包不依赖任何应用；数据库只在服务端访问。
- 接口的请求和响应结构只在 `packages/contracts` 定义一次：服务端用它做校验和序列化，客户端用它的推导类型。
- 共享包的 `exports` 中，`development` 和 `react-native` 条件指向源码，默认指向 `dist`。开发时修改共享包立即生效；类型检查使用 `dist` 中的声明，所以修改共享包后要先运行 `pnpm build:packages`。

### 1.5 服务端请求流程

```text
请求 → helmet 安全头 → 全局限流 → under-pressure 负载保护
     → routes/api/autohooks.ts 校验 JWT（/api/auth/login 除外）
     → TypeBox schema 校验 body / params / query
     → 路由 handler → repository → MySQL
     → 按 response schema 序列化 → 压缩 → 响应
```

插件加载顺序（`src/app.ts`）：

1. `plugins/external`：第三方插件，先加载，其他插件依赖它们。
2. `plugins/app`：业务插件，例如 repository。
3. `routes`：目录即路径前缀，`routes/api/notes/index.ts` 对应 `/api/notes`。

### 1.6 内置能力

| 能力 | 说明 | 位置 |
| --- | --- | --- |
| 环境变量校验 | 启动时校验，缺失直接报错 | `plugins/external/env.ts` |
| 登录 | `POST /api/auth/login`，密码与 `APP_PASSWORD` 比对，每分钟最多 5 次 | `routes/api/auth` |
| JWT 鉴权 | 令牌有效期 30 天，所有 `/api` 路由默认需要令牌 | `plugins/external/jwt.ts`、`routes/api/autohooks.ts` |
| 限流 | 每 IP 每分钟 `RATE_LIMIT_MAX` 次；404 额外限流 | `plugins/external/rate-limit.ts`、`app.ts` |
| 安全头 | helmet | `plugins/external/helmet.ts` |
| 压缩 | brotli / gzip | `plugins/external/compress.ts` |
| 接口文档 | Swagger UI，地址 `/api/docs`，只显示带 `tags` 的路由 | `plugins/external/swagger.ts` |
| 健康检查 | `GET /health`，同时检查数据库连接 | `plugins/external/under-pressure.ts` |
| 静态资源 | 生产环境由 Fastify 提供 `apps/web/dist`，非 `/api` 的 GET 回退到 `index.html` | `plugins/external/static.ts`、`app.ts` |
| 错误处理 | 5xx 只返回 `Internal Server Error` 并记录日志，4xx 返回错误信息 | `app.ts` |
| 数据库 | `fastify.db` 提供 `all`、`get`、`run`、`transaction` | `plugins/external/mysql.ts` |
| 迁移 | postgrator，记录在 `schemaversion` 表 | `src/migrate.ts` |

### 1.7 客户端内置能力

- **Web**：未登录时显示登录页；令牌存 `localStorage`；任何接口返回 401 时自动清除令牌回到登录页；路由懒加载，加载失败显示错误边界。
- **移动端**：`Stack.Protected` 按令牌切换登录页与主界面；令牌存 `expo-secure-store`；App 回到前台时 TanStack Query 自动刷新。
- **api-client**：自动附加 `Authorization: Bearer <token>`；失败时抛出 `ApiError`（包含服务端的 `message` 和 HTTP `status`），并打印原始错误。

## 二、快速开始

### 2.1 环境要求

- Node.js 24
- pnpm 8.15.9
- Docker（运行本地 MySQL）
- 移动端：iOS 需要 Xcode，Android 需要 Android Studio

### 2.2 配置环境变量

```bash
cp deploy/.env.local.example deploy/.env.local
```

填写 `deploy/.env.local`：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `PORT` | 否 | 服务端口，默认 3000 |
| `MYSQL_HOST` / `MYSQL_PORT` | 是 | 数据库地址 |
| `MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD` | 是 | 库名、用户、密码；本地 MySQL 容器首次启动时按这些值创建 |
| `APP_PASSWORD` | 是 | 登录密码 |
| `JWT_SECRET` | 是 | 令牌签名密钥，至少 32 个字符，可用 `openssl rand -base64 32` 生成 |
| `RATE_LIMIT_MAX` | 否 | 每 IP 每分钟请求上限，默认 100 |
| `LOG_LEVEL` | 否 | 非终端运行时的日志级别，未设置时不输出 |
| `FASTIFY_CLOSE_GRACE_DELAY` | 否 | 优雅退出等待毫秒数，默认 500 |

### 2.3 启动

```bash
pnpm install
```

```bash
docker compose -f deploy/mysql.compose.yaml up -d
```

```bash
pnpm db:migrate
```

```bash
pnpm dev
```

- Web：http://localhost:5173 （Vite 把 `/api` 代理到 3000 端口）
- API：http://localhost:3000/api
- 接口文档：http://localhost:3000/api/docs

`deploy/mysql.compose.yaml` 监听 `127.0.0.1:3306`，与其他占用 3306 的 MySQL 不能同时运行。

### 2.4 启动移动端

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
```

设置 `EXPO_PUBLIC_API_URL`：iOS 模拟器用 `http://localhost:3000/api`，Android 模拟器用 `http://10.0.2.2:3000/api`，真机用电脑的局域网 IP 或线上 HTTPS 地址。该变量会打包进客户端，不能放秘密信息。

```bash
pnpm dev:mobile
```

编译原生开发包：

```bash
pnpm ios
```

```bash
pnpm android
```

### 2.5 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 构建共享包后同时启动 Web 和 API |
| `pnpm start` | 启动本地 MySQL 后执行 `pnpm dev` |
| `pnpm dev:mobile` | 启动 Expo |
| `pnpm db:migrate` | 执行数据库迁移 |
| `pnpm typecheck` | 全部包类型检查 |
| `pnpm test` | 服务端测试 |
| `pnpm build` | 构建全部包 |
| `pnpm build:packages` | 只构建共享包 |
| `pnpm build:docker` | 构建 Docker 镜像所需产物 |
| `pnpm reload:pro` | 构建镜像并发布到服务器 |

## 三、开发一个业务模块

下面以「笔记」为例，走一遍从数据库到 Web、移动端的完整流程。

### 3.1 数据库迁移

新建 `apps/server/migrations/001.do.notes.sql`：

```sql
CREATE TABLE notes (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  title VARCHAR(191) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL
) ENGINE=InnoDB;
```

```bash
pnpm db:migrate
```

规则：

- 文件名格式为 `编号.do.名称.sql`，编号递增。
- 已执行的迁移不要修改，改表结构时新增文件。
- 服务启动不会自动迁移，部署时需先执行迁移。

### 3.2 定义契约

在 `packages/contracts/src/index.ts` 中增加：

```ts
import { Type, type Static } from "typebox";

export const NoteSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  content: Type.String(),
  created_at: Type.String({ format: "date-time" }),
});

export type Note = Static<typeof NoteSchema>;
```

在 `packages/contracts/src/inputs.ts` 中增加：

```ts
export const CreateNoteSchema = Type.Object(
  {
    title: Type.String({ minLength: 1, maxLength: 191 }),
    content: Type.String(),
  },
  { additionalProperties: false },
);

export type CreateNoteInput = Static<typeof CreateNoteSchema>;
```

### 3.3 Repository 插件

新建 `apps/server/src/plugins/app/notes/notes-repository.ts`：

```ts
import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import type { Note } from "@app/contracts";

declare module "fastify" {
  interface FastifyInstance {
    notesRepository: ReturnType<typeof createNotesRepository>;
  }
}

export function createNotesRepository(fastify: FastifyInstance) {
  const database = fastify.db;

  return {
    list() {
      return database.all<Note>("SELECT id,title,content,created_at FROM notes ORDER BY created_at DESC");
    },

    async create(note: Note) {
      await database.run("INSERT INTO notes (id,title,content,created_at) VALUES (?,?,?,?)", note.id, note.title, note.content, new Date(note.created_at));
    },

    async remove(id: string) {
      return (await database.run("DELETE FROM notes WHERE id=?", id)).affectedRows > 0;
    },
  };
}

export default fp(
  async function (fastify: FastifyInstance) {
    fastify.decorate("notesRepository", createNotesRepository(fastify));
  },
  {
    name: "notes-repository",
    dependencies: ["mysql"],
  },
);
```

要点：

- 必须用 `fastify-plugin`（`fp`）包装，装饰器才能被路由访问。
- `declare module "fastify"` 为 `fastify.notesRepository` 提供类型。
- `dependencies: ["mysql"]` 保证数据库插件先加载。

### 3.4 路由

新建 `apps/server/src/routes/api/notes/index.ts`，目录名即路径 `/api/notes`：

```ts
import { randomUUID } from "node:crypto";
import { type FastifyPluginAsyncTypebox, Type } from "@fastify/type-provider-typebox";
import { CreateNoteSchema, NoteSchema } from "@app/contracts";

const tags = ["笔记"];

const plugin: FastifyPluginAsyncTypebox = async fastify => {
  const { notesRepository } = fastify;

  fastify.get("/", { schema: { response: { 200: Type.Array(NoteSchema) }, tags } }, async function () {
    return notesRepository.list();
  });

  fastify.post("/", { schema: { body: CreateNoteSchema, response: { 201: NoteSchema }, tags } }, async function (request, reply) {
    const note = { id: randomUUID(), ...request.body, created_at: new Date().toISOString() };
    await notesRepository.create(note);
    reply.code(201);
    return note;
  });

  fastify.delete("/:id", { schema: { params: Type.Object({ id: Type.String() }), tags } }, async function (request, reply) {
    if (!(await notesRepository.remove(request.params.id))) return reply.notFound("笔记不存在");
    reply.code(204);
  });
};

export default plugin;
```

要点：

- 使用 `FastifyPluginAsyncTypebox`，`request.body`、`request.params` 的类型会从 schema 自动推导。
- 必须写 `tags`，否则不会出现在 `/api/docs`。
- 无需处理鉴权，`autohooks.ts` 已对 `/api` 下的路由统一校验。
- 4xx 错误使用 `@fastify/sensible` 提供的 `reply.notFound()`、`reply.badRequest()`、`reply.conflict()` 等。
- 多条 SQL 需要原子执行时使用事务：

```ts
await fastify.db.transaction(async db => {
  await db.run("UPDATE ...", ...);
  await db.run("INSERT ...", ...);
});
```

### 3.5 API 客户端

在 `packages/api-client/src/index.ts` 的 `createApi` 返回对象中增加：

```ts
listNotes: () => request<Note[]>({ url: "/notes" }),
createNote: (data: CreateNoteInput) => request<Note>({ url: "/notes", method: "POST", data }),
deleteNote: (id: string) => request<void>({ url: `/notes/${id}`, method: "DELETE" }),
```

并从 `@app/contracts` 导入 `Note`、`CreateNoteInput`。修改完成后运行：

```bash
pnpm build:packages
```

### 3.6 Web 页面

新建 `apps/web/src/routes/notes.tsx`：

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/api";

export default function NotesPage() {
  const queryClient = useQueryClient();
  const notes = useQuery({ queryKey: ["notes"], queryFn: api.listNotes });
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ["notes"] });
  const create = useMutation({ mutationFn: api.createNote, onSuccess });
  const remove = useMutation({ mutationFn: api.deleteNote, onSuccess });
  const error = notes.error ?? create.error ?? remove.error;

  return <>
    <div className="page-heading"><h1>笔记</h1></div>
    <div className="grid gap-4">
      <Card><CardContent>
        <form className="form-fields" onSubmit={event => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          create.mutate({ title: String(form.get("title")), content: String(form.get("content")) });
          event.currentTarget.reset();
        }}>
          <label>标题<Input name="title" required/></label>
          <label>内容<Input name="content"/></label>
          <Button type="submit" disabled={create.isPending}>添加</Button>
        </form>
      </CardContent></Card>
      {error && <Alert variant="destructive"><AlertDescription>{error.message}</AlertDescription></Alert>}
      {notes.data?.length === 0 && <p className="empty">暂无笔记</p>}
      {notes.data?.map(note => <Card key={note.id}>
        <CardHeader className="flex flex-row items-start justify-between">
          <div><CardTitle>{note.title}</CardTitle><CardDescription>{new Date(note.created_at).toLocaleString("zh-CN")}</CardDescription></div>
          <Button variant="ghost" size="icon" onClick={() => remove.mutate(note.id)}><Trash2/></Button>
        </CardHeader>
        <CardContent>{note.content}</CardContent>
      </Card>)}
    </div>
  </>;
}
```

注册页面，共三处：

`apps/web/src/router/routes.ts`

```ts
export type Page = "home" | "notes";

export const routes: Record<Page, { title: string }> = {
  home: { title: "首页" },
  notes: { title: "笔记" },
};
```

`apps/web/src/router.tsx`

```tsx
const loadNotesRoute = async () => ({ Component: (await import("@/routes/notes")).default });
// children 中增加
{ path: "notes", lazy: loadNotesRoute },
```

`apps/web/src/layouts/AppLayout.tsx`

```tsx
import { House, StickyNote } from "lucide-react";
// 侧边栏中增加
<button className={`nav-item ${page === "notes" ? "active" : ""}`} onClick={() => onPageChange("notes")}><StickyNote/>{routes.notes.title}</button>
```

可用的 UI 组件（`@/components/ui/*`）：`Alert`、`Button`、`Card`、`Dialog`、`Input`、`Select`、`Switch`。更多组件可用 shadcn CLI 添加（`components.json` 已配置）。样式优先使用 Tailwind 类，主题颜色变量在 `styles.css` 的 `:root` 中。

### 3.7 移动端页面

新建 `apps/mobile/app/(tabs)/notes.tsx`：

```tsx
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { api } from "../../src/api";
import { Button, QueryStatus, Screen, confirmDelete, useSave } from "../../src/components";
import { styles } from "../../src/theme";

export default function NotesScreen() {
  const notes = useQuery({ queryKey: ["notes"], queryFn: api.listNotes });
  const remove = useSave(api.deleteNote);
  if (!notes.data) return <QueryStatus queries={[notes]} />;

  return <Screen queries={[notes]}>
    {notes.data.map(note => <View key={note.id} style={styles.card}>
      <Text style={styles.value}>{note.title}</Text>
      <Text style={styles.label}>{note.content}</Text>
      <Button danger title="删除" onPress={() => confirmDelete(note.title, () => remove.mutate(note.id))} />
    </View>)}
  </Screen>;
}
```

在 `apps/mobile/app/(tabs)/_layout.tsx` 中注册：

```tsx
<Tabs.Screen name="notes" options={{ title: "笔记", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>▤</Text> }} />
```

非 Tab 页面（如表单页）放在 `apps/mobile/app/` 下，并在 `app/_layout.tsx` 的 `Stack.Protected guard={!!token}` 中增加 `<Stack.Screen name="..." />`。

移动端通用组件（`src/components.tsx`）：

| 组件 | 用途 |
| --- | --- |
| `Screen` | 可滚动页面，传入 `queries` 后支持下拉刷新和错误显示 |
| `QueryStatus` | 加载中或加载失败（带重新加载按钮）状态 |
| `Form` | 带提交按钮、错误显示、键盘避让的表单页 |
| `Field` | 带标签的输入框 |
| `Choices` | 单选标签组 |
| `Button` | 按钮，`danger` 为红色 |
| `Metric` | 标签 + 数值的一行 |
| `useSave` | 提交成功后刷新所有查询的 mutation |
| `confirmDelete` | 删除确认弹窗 |

### 3.8 测试

新建 `apps/server/test/notes.test.ts`：

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp, setupTestDatabase } from "./helper.js";

setupTestDatabase();

test("notes can be created, listed and deleted", async () => {
  const app = buildApp();
  try {
    await app.ready();
    const headers = { authorization: `Bearer ${app.jwt.sign({})}` };
    const created = await app.inject({ method: "POST", url: "/api/notes", headers, payload: { title: "标题", content: "内容" } });
    assert.equal(created.statusCode, 201);
    assert.equal((await app.inject({ url: "/api/notes", headers })).json().length, 1);
    assert.equal((await app.inject({ method: "DELETE", url: `/api/notes/${created.json().id}`, headers })).statusCode, 204);
  } finally {
    await app.close();
  }
});
```

- `setupTestDatabase()` 为每个用例创建独立数据库并执行全部迁移，用例结束后删除。
- 测试使用 `app_test` 用户，只能操作 `app_test_` 前缀的数据库。该用户由 `deploy/mysql-init/test-user.sql` 在 MySQL 容器首次初始化时创建。
- 新建 `deploy/.env.test`：

```text
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=app_test
MYSQL_PASSWORD=app_test
```

```bash
pnpm test
```

### 3.9 CLI

在 `apps/cli/src/index.ts` 中用 commander 增加命令：

```ts
program
  .command("hello")
  .description("示例命令")
  .action(() => console.log("hello"));
```

```bash
pnpm --filter @app/cli build
```

```bash
node apps/cli/dist/index.js hello
```

## 四、数据库约定

`fastify.db` 的接口：

| 方法 | 返回 |
| --- | --- |
| `all<T>(sql, ...values)` | 全部行 `T[]` |
| `get<T>(sql, ...values)` | 第一行或 `undefined` |
| `run(sql, ...values)` | `ResultSetHeader`（`affectedRows`、`insertId`） |
| `transaction(db => ...)` | 在同一连接中执行，异常时回滚并抛出 |

类型转换：

- `DATE` 读出为 `YYYY-MM-DD` 字符串。
- `DATETIME` 读出为 ISO 字符串（`2026-01-02T03:04:05.678Z`），写入时传 `Date` 对象，统一按 UTC 存储。
- `DECIMAL` 读出为 number。
- 参数使用 `?` 占位，不要拼接 SQL。

## 五、部署

### 5.1 Docker

```bash
cp deploy/.env.production.example deploy/.env.production
```

填写容器内可访问的 MySQL 连接、`APP_PASSWORD`、`JWT_SECRET`。Docker Desktop 连接宿主机 MySQL 时 `MYSQL_HOST` 用 `host.docker.internal`。

```bash
pnpm install --frozen-lockfile
```

```bash
pnpm build:docker
```

```bash
docker compose build
```

```bash
docker compose run --rm app-framework node apps/server/dist/scripts/migrate.js
```

```bash
docker compose up -d
```

- `pnpm build:docker` 在本地编译，并用 `pnpm deploy` 把服务端及生产依赖输出到 `output/docker/server`；镜像只复制该目录和 `apps/web/dist`，不在镜像内编译。
- Web 与 API 由同一个 Fastify 服务提供，访问 http://localhost:3000。
- 镜像内置健康检查，访问 `/health`。
- `compose.yaml` 使用 `network_mode: host`，容器中的 `127.0.0.1` 即宿主机。

### 5.2 一键发布

`deploy/reload-production.sh` 依次完成：构建产物 → 构建 linux/amd64 镜像 → 通过 SSH 上传镜像和配置 → 执行迁移 → 重启 → 等待健康检查。使用前修改脚本中的：

```bash
server=wb                       # SSH 主机别名
remote_dir='~/app-framework'    # 服务器上的目录
```

```bash
pnpm reload:pro
```

## 六、项目定制清单

基于本框架新建项目时，按需修改：

| 位置 | 内容 |
| --- | --- |
| 根 `package.json` 及各包 `package.json` | 项目名、`@app/*` 包作用域 |
| `apps/web/index.html` | 页面标题 |
| `apps/web/src/layouts/AppLayout.tsx` | 品牌名称与标识 |
| `apps/web/src/routes/login.tsx`、`apps/mobile/app/login.tsx` | 登录页文案 |
| `apps/web/src/styles.css` | 主题颜色 |
| `apps/mobile/app.json` | App 名称、`slug`、`scheme`、`bundleIdentifier`、`package` |
| `apps/mobile/src/theme.ts` | 移动端颜色 |
| `apps/server/src/plugins/external/swagger.ts` | 接口文档标题 |
| `apps/cli/package.json`、`apps/cli/src/index.ts` | 命令名 |
| `compose.yaml`、`deploy/*` | 服务名、库名、发布服务器 |

## 七、常见问题

**修改共享包后类型报错找不到新导出？**
运行 `pnpm build:packages`，类型检查读取的是 `dist` 中的声明。

**新接口没出现在接口文档里？**
路由 schema 需要设置 `tags`。

**接口返回的字段被删掉了？**
响应按 `response` schema 序列化，schema 中没有的字段不会返回；请求体中 schema 没有声明的字段也会被移除。

**接口一直返回 401？**
除 `/api/auth/login` 外的 `/api` 路由都需要令牌；`JWT_SECRET` 更换后旧令牌全部失效，重新登录即可。

**某个接口不需要登录？**
在 `routes/api/autohooks.ts` 的 `onRequest` 中按 URL 放行，或把路由放到 `routes/api` 之外的目录。

**真机连不上 API？**
`EXPO_PUBLIC_API_URL` 不能用 `localhost`，改用电脑局域网 IP 或线上地址；修改后重启 Expo。

**测试报 `Tests require the isolated app_test user`？**
检查 `deploy/.env.test`；若 MySQL 容器初始化时还没有 `test-user.sql`，需手动执行该文件创建用户。

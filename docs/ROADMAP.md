# 项目路线图与接续手册

本文档是**下次会话的接续起点**。任何完全没有上下文的新对话，只要阅读本文档就能理解现状、约束、决策与后续开发规格。

## 进度总览

| 阶段 | 状态 | 完成时间 |
|------|------|---------|
| 首轮：OAuth 登录基础设施 | ✅ 完成 | 2026-07-19 |
| A：管理后台仪表盘 | ✅ 完成 | 2026-07-20 |
| B：博客浏览事件采集 | ✅ 完成 | 2026-07-20（与 A 一并交付） |
| C：阅读量趋势图（recharts） | ✅ 完成 | 2026-07-21 |
| D：评论系统 | ✅ 完成 | 2026-07-22 |
| E：广告弹窗与用户偏好 | ⏳ 未开始 | — |

**已知遗留 / 小任务**：
- OAuth callback 目前不消费 `?next=` 参数，登录后固定跳首页；middleware 已把 `next` 塞到登录 URL，但真正吃它需要改 `state` 编码 + callback 重定向逻辑。改动量小，等下一次开工时顺手做。
- 仪表盘的 `todayViews` 与趋势图按 **UTC 当日**分桶，跨时区用户看"今天"的边界会不吻合本地。要按用户时区分桶需要客户端传 offset 或读用户偏好，本轮先按 UTC。
- D1 里其他表（`blog_post_views`、`blog_view_events`、`users`、`user_identities`）的时间戳都没显式 strftime 成 ISO。目前它们没暴露给前端做相对时间显示，暂时不修。**如果哪天要 SELECT 这些 timestamp 给前端展示，必须先在 SQL 里 `strftime('%Y-%m-%dT%H:%M:%SZ', ...)`**，否则会重现"8h ago"那个坑。参考 `lib/comments/store.ts` 的做法。

---

## 一、项目背景与技术栈快照

### 项目定位

个人作品集（Portfolio）网站，含博客模块，部署在 **Cloudflare Workers**。项目仓库名 `protfolio`（原文即拼写差异，未纠正以保持兼容）。

### 技术栈（版本以 `package.json` 为准）

| 层 | 技术 | 关键约束 |
|---|---|---|
| 框架 | **Next.js 15.5 App Router** + **React 19** | 服务端组件优先；仅在需要交互 / 浏览器 API 时用 `"use client"` |
| 部署 | **Cloudflare Workers**（通过 `@opennextjs/cloudflare` 1.19） | 服务端代码在 Workers 运行时，无 Node.js 全部 API；用 `getCloudflareContext()` 访问绑定 |
| 数据库 | **Cloudflare D1**（SQLite） | 绑定名 `BLOG_VIEWS_DB`；schema 由 `migrations/*.sql` 管理 |
| 存储 | **R2**（Next 增量缓存） | 绑定名 `NEXT_INC_CACHE_R2_BUCKET` |
| 样式 | **Tailwind CSS v4**（CSS-first `@theme`） | 主题色令牌在 `app/globals.css` 的 `@theme` 块；`tailwind.config.ts` 仅为 IDE intellisense 镜像 |
| 动画 | GSAP + ScrollTrigger | `"use client"` 组件里用 `gsap.context()` + `ctx.revert()` 清理 |
| 图标 | `lucide-react` | 已装 |
| 类工具 | `clsx` | 条件 className |
| 博客源 | 本地 Markdown（`content/blog/*.md`） | `gray-matter` + `remark`；`lib/mdx.ts` 是唯一入口。CLAUDE.md 中"Notion 是数据源"的描述已过时 |
| 测试 | Node 原生 test runner | `node --experimental-strip-types --test tests/**/*.test.ts` — 不用 Jest/Vitest |
| lint | `next/core-web-vitals` + `next/typescript` | `--max-warnings=0`，零警告策略 |

### 关键设计约束（下次会话务必遵守）

1. **分层模式**：`lib/xxx.ts`（纯逻辑，可单测，无 Cloudflare 依赖）↔ `lib/xxx-store.ts`（D1 数据访问，用 `getCloudflareContext()`）↔ `app/api/*/route.ts`（HTTP 路由）↔ `components/`（UI）。任何新特性都要照此分层。
2. **i18n prop-drilling**：字典是 JSON（`i18n/dicts/{en,zh}.json`），通过 `getDict(lang)` 动态导入；**没有 React Context**，字典由服务端页面读取后作为 prop 传给客户端组件。
3. **路由约定**：所有面向用户的页面都在 `app/[lang]/` 下（`lang` ∈ `"en" | "zh"`）。`middleware.ts` 只做 `/` → `/en` 的默认重定向。
4. **UI 组件规范**：`components/ui/` 是设计系统原语（`Button`、`Card`、`SectionTitle`），使用 `forwardRef` + `clsx` + `displayName`，尽量做服务端组件；`components/` 根目录为业务组件（大多 `"use client"`）。
5. **Tailwind 主题色令牌**：`background`（`#0a0a0f` 深底）、`surface`（`#111118`）、`border`（`#1e1e2e`）、`primary`（`#6366f1` 靛蓝）、`neon-purple`（`#a855f7`）、`neon-cyan`（`#22d3ee`）；字体 `heading`（Space Grotesk）、`body`（Inter）、`mono`（JetBrains Mono）。
6. **绝对导入别名**：`@/*` → 项目根。
7. **环境变量**：本地开发用 `.dev.vars`（Wrangler 格式），公开示例在 `.dev.vars.example`。**D1 等 binding** 通过 `getCloudflareContext().env` 拿，**不通过 `process.env`**。字符串型 env vars（如 `NEXT_PUBLIC_*`）可通过 `process.env`。
8. **测试写法**：`import { test } from "node:test"` + `import assert from "node:assert/strict"`；测 `lib/` 纯层，不测 React/DOM。

### 常用命令

```bash
npm run dev       # localhost:3000
npm run lint      # ESLint --max-warnings=0
npm run typecheck # tsc --noEmit
npm test          # Node 原生 test runner
npm run build     # Next 生产构建
npm run cf-typegen # 从 wrangler.jsonc 生成 cloudflare-env.d.ts
npm run preview   # OpenNext 本地预览（含 Workers 运行时）
npm run deploy    # OpenNext 部署
```

---

## 二、本次已完成基础

### 本次交付范围
多 provider OAuth 登录基础设施（GitHub 作为首个 provider）、用户身份持久化到 D1、admin/user 双角色体系、导航栏显示登录状态、登录页、登出功能。登录成功后统一跳回首页，未来扩展 Google/Apple 等其他登录。

**不包含**：管理后台仪表盘、博客浏览事件采集、趋势图、评论、广告等，这些在后续阶段单独实施。

### 已实现文件清单

| 文件 | 职责 |
|------|------|
| `lib/auth/providers/types.ts` | OAuthProvider 接口定义、ProviderId 联合类型、NormalizedProfile 统一用户结构 |
| `lib/auth/providers/github.ts` | GitHub provider 实现（authorize URL 组装 → code 换 token → GitHub API 拉 profile → 标准化为 NormalizedProfile） |
| `lib/auth/providers/index.ts` | Provider 注册表（PROVIDERS map + getProvider + listEnabledProviders） |
| `lib/auth/jwt.ts` | JWT 签发（signJWT）、JWT 验证（verifyJWT）（使用 `jose` 库）、JWTPayload 类型定义 |
| `lib/auth/roles.ts` | parseAdminWhitelist、isAdminUser、determineRole 纯函数（从 ADMIN_GITHUB_USERS 白名单判定 role） |
| `lib/auth/state.ts` | OAuth state 生成与校验（含 lang 字段用于回跳保留语言）、CSRF 防护 |
| `lib/auth/user-store.ts` | D1 数据访问层（findUserByProviderIdentity / findUserByEmail / createUserWithIdentity / linkIdentityToUser / updateLastLogin / getUserById） |
| `migrations/0001_create_users_and_identities.sql` | D1 迁移：`users` 表 + `user_identities` 双表设计 + 唯一索引 |
| `app/api/auth/[provider]/route.ts` | OAuth 授权入口路由 → 生成 state → 跳转 provider 授权 URL |
| `app/api/auth/[provider]/callback/route.ts` | OAuth 回调路由 → 校验 state → 处理 identity upsert → 签发 JWT → 重定向首页 |
| `app/api/auth/logout/route.ts` | 登出路由 → 清除 JWT cookie |
| `app/api/auth/me/route.ts` | 获取当前登录用户信息 → 供前端显示 |
| `app/[lang]/login/page.tsx` | 公共登录页 → 遍历 enabled providers 动态渲染登录按钮 |
| `components/auth/SignInButton.tsx` | 登录按钮组件（客户端 → 跳转授权入口） |
| `components/auth/UserMenu.tsx` | 客户端用户菜单 → 检测登录状态 → 下拉菜单 → 退出登录 |
| `tests/auth-providers.test.ts` | 单元测试：GitHub provider URL 组装、profile 标准化映射 |
| `tests/auth-roles.test.ts` | 单元测试：parseAdminWhitelist、isAdminUser、determineRole |
| `tests/auth-state.test.ts` | 单元测试：state 生成与校验、lang 恢复 |
| `.dev.vars.example` | 模板文件：新增 GITHUB_CLIENT_ID、GITHUB_CLIENT_SECRET、JWT_SECRET、ADMIN_GITHUB_USERS 的占位注释 |
| `docs/ROADMAP.md` | 本路线图文档 |

### 数据模型（D1）

```sql
-- 主用户表：一个 user 可关联多个 provider identity
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,              -- 统一关联多个 provider 的同一个用户
  display_name TEXT,      -- 显示名称
  avatar_url TEXT,        -- 头像 URL
  role TEXT NOT NULL DEFAULT 'user', -- 角色："admin" | "user"
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 用户身份表：每个 provider 一个记录（同一个 GitHub 账号唯一对应一个 id）
CREATE TABLE IF NOT EXISTS user_identities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,          -- "github" | "google" | ...
  provider_user_id TEXT NOT NULL,  -- 该 provider 的用户 id
  username TEXT NOT NULL,          -- 该 provider 的用户名
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- 一个 provider 的账号只能绑定给一个 user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_identities_provider_user_id
  ON user_identities(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_user_identities_user_id
  ON user_identities(user_id);
```

**设计理由**：允许一个用户用多个第三方账户登录（如同一个 email 自动关联），为未来扩展预留，同时通过 UNIQUE 索引保证一个第三方账户不会被多人关联。

### 环境变量（`.dev.vars` / Wrangler Secrets）

| 变量名 | 用途 | 示例 |
|--------|------|------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App 客户端 ID | `xxxxxx` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App 客户端密钥 | `xxxxxx` |
| `JWT_SECRET` | JWT 签名密钥（随机串） | `openssl rand -hex 32` |
| `ADMIN_GITHUB_USERS` | 管理员 GitHub 用户名白名单（逗号分隔） | `chenduji,otheruser` |

**预留位置**：代码结构已预留 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` 等变量占位，未来加新 provider 只需要新增行。

### JWT Payload 结构

```typescript
interface JWTPayload {
  userId: number;        // users.id 主键
  username: string;      // 用户名（GitHub login）
  role: "admin" | "user";// 角色
  provider: ProviderId; // 登录 provider
  exp: number;          // 过期时间戳（JWT 标准）
}
```

JWT 存储在 `auth-jwt` HTTP-only Secure cookie 中，SameSite=Lax，路径 `/`。

### API Endpoint

| Endpoint | Method | 用途 | 响应 / 行为 |
|----------|--------|------|------------|
| `/api/auth/[provider]` | GET | 启动 OAuth 流程 | 生成 state cookie → 跳转 provider 授权 URL |
| `/api/auth/[provider]/callback` | GET | OAuth 回调 | 校验 state → 处理用户 → 设置 JWT cookie → 重定向 `/[lang]`（首页，保留 state 中的 lang） |
| `/api/auth/logout` | POST | 登出 | 清除 JWT cookie → 返回 200 |
| `/api/auth/me` | GET | 查询当前登录用户 | 验证 JWT → 返回 `{ userId, username, role, provider, displayName, avatarUrl }`，无效返回 401 |

### 可导入模块 & 函数

| 模块 | 导出项 |
|------|--------|
| `@/lib/auth/providers/types` | `ProviderId`, `NormalizedProfile`, `OAuthProvider`, `AuthorizeUrlParams`, `TokenResponse`, `ProviderConfig` |
| `@/lib/auth/providers` | `PROVIDERS`, `getProvider(id: ProviderId)`, `listEnabledProviders()` |
| `@/lib/auth/jwt` | `JWTPayload`, `signJWT(payload, secret)`, `verifyJWT(token, secret)` |
| `@/lib/auth/roles` | `parseAdminWhitelist(raw)`, `isAdminUser(username, whitelist)`, `determineRole(profile, whitelist)` |
| `@/lib/auth/state` | `generateState(lang)`, `validateState(stateCookie, stateQuery)` |
| `@/lib/auth/user-store` | `findUserByProviderIdentity`, `findUserByEmail`, `createUserWithIdentity`, `linkIdentityToUser`, `updateLastLogin`, `getUserById` |

### i18n 字典新增键（`auth.*` 命名空间）

已在 `i18n/dicts/en.json` 和 `i18n/dicts/zh.json` 新增：
- `auth.loginTitle`
- `auth.signIn`
- `auth.signInWith`（模板：`Sign in with {provider}`）
- `auth.signOut`
- `auth.loggingIn`

### UI 集成

- **导航栏**：Navigation.tsx 在 LanguageToggle 旁加入 UserMenu → 未登录显示"登录"链接，已登录显示头像下拉菜单（登出按钮）
- **公共登录页**：`/[lang]/login` 动态渲染所有 enabled provider 的登录按钮（GitHub 第一个，Google/Apple 为空时不显示）
- **所有交互都是"use client"** → 符合项目约定，路由和数据访问是服务端

---

## 三、关键决策历史

### 1. 为什么双表 `users` + `user_identities`，而不是单表？
**决策理由**：双表允许一个自然人用户关联多个不同 provider 的登录身份（同一个人既能用 GitHub 登录，也能用 Google 登录，未来自动合并成同一个账户），同时保证每个第三方 provider 账号只能被绑定给一个人。这符合业界标准 OAuth 数据模型，并且为未来评论、收藏等功能预留了用户身份——这些功能引用 `user.id`，完全不关心你用哪个 provider 登录。

### 2. 为什么参数化路由 `/api/auth/[provider]/` 而不是给每个 provider 单独目录？
**决策理由**：参数化路由更好体现了抽象性，新增 provider 时不需要新建路由文件，所有路由逻辑复用且基于接口多态分发——完全符合**开闭原则**（对扩展开放，对修改关闭）。在 Next.js App Router 中，动态路由完全支持这种模式，没有性能问题。

### 3. 为什么 `lib/auth/providers/` 做抽象层，而不是每个 provider 硬写？
**决策理由**：
- 隔离 provider 特定细节与通用流程（state 校验、JWT 签发、用户存储）
- 新增 provider 只需要新增一个实现文件 + 注册到注册表，路由/JWT/store/UI 完全不用改
- 纯接口契约，方便单元测试
- 符合用户要求：为后续 Google/Apple 等登录预留扩展空间

### 4. 为什么登录成功后统一跳回首页，而不是 admin 直接跳后台？
**决策理由**：用户要求"登录完成后自动跳回到网站首页"；统一入口符合用户直觉，且 admin 未来可以通过导航入口进入后台，前端通过 `/api/auth/me` 检测角色判断是否显示入口。这样无论 admin 还是普通用户，流程一致，更易维护。

### 5. 为什么用 OAuth provider → 拿 GitHub 用户名 → 白名单 → 判定 role，而不是单独存 role 在数据库？
**决策理由**：当前需求场景简单，admin 就是你本人（固定 GitHub 用户名），白名单从环境变量读取，不需要改数据库就能调整，更灵活。未来如果需要更多 admin，可以直接把逗号加个用户名，不用跑 migration。同时，determineRole 是纯函数，可单元测试。

### 6. 为什么用 `jose` 做 JWT，而不是 `jsonwebtoken` 或其他库？
**决策理由**：`jose` 是纯 TypeScript 实现，支持 ESM，没有 Node.js 内置模块依赖（完全在 Cloudflare Workers 跑），支持 Edge Runtime，而且体积小，API 简洁。`jsonwebtoken` 依赖 Node 的 `crypto` 模块，在 Workers 上可能有兼容问题。

### 7. 为什么 state 存储在 cookie 里？
**决策理由**：OAuth 要求 state 参数做 CSRF 防护 — 我们生成 state，存到 HTTP-only cookie，回调时比对 cookie 值和 query state 是否一致。这是最常见且安全的模式，不需要在服务器存储 session（纯 JWT 无服务器 session，符合当前 stateless 设计）。

### 8. 为什么 JWT 存在 HTTP-only Secure cookie，而不是存在 localStorage？
**决策理由**：HTTP-only cookie 无法被 XSS 窃取，比 localStorage 安全得多，并且浏览器自动携带，适合会话管理。SameSite=Lax 防止 CSRF。

### 9. 为什么登录页放在 `/[lang]/login`（通用路由）而不是 `/[lang]/admin/login`？
**决策理由**：因为任何人都可以登录（admin/user 两种角色），不是只有 admin 才能登录。放在通用路由更合理，普通用户也能访问。未来如果需要评论功能，普通用户必须能登录，页面已经就位。

### 10. 为什么用 recharts 而不是其他图表库 / 手工 SVG？
**决策理由**（提前记录给后续阶段）：
- 原生支持 React 19 peer dependency（recharts 3.9+）
- 完全 SVG 渲染，兼容 SSR/Edge Runtime
- 开箱即用具名组件（ResponsiveContainer / LineChart / BarChart / Tooltip）
- 活跃维护，生态完善，维护性好
- 可扩展，未来要加更多图表类型很容易
- 手工 SVG 虽然体积小，但扩展性差，不利于后期维护，不符合可维护性优先的目标

### 11. 为什么不实现评论、广告、后台仪表盘现在？
**决策理由**：用户要求本次只完成登录模块，其他功能后续对话接续。分阶段交付能保证每个模块做得更扎实，本次交付聚焦基础设施，为后续功能打好基础。

---

## 四、约定与规范速查

（拷贝自《项目背景与技术栈快照》，方便下次会话快速查阅）

### 1. 分层模式

严格按四层拆分：
- **`lib/xxx.ts`**：纯逻辑 / 类型，没有 Cloudflare / D1 依赖，可单元测试
- **`lib/xxx-store.ts`**：D1 数据访问层，仅这里调用 `getCloudflareContext()`
- **`app/api/*/route.ts`**：HTTP 路由，处理请求/响应，调用 `lib/xxx-store.ts`
- **`components/`**：UI 层，客户端交互；原语在 `components/ui/`，业务组件在根目录

### 2. "use client" 边界

只有**确实需要浏览器 API / useState / useEffect / useRouter**的组件才加 `"use client"`。UI 原语 (`Button` / `Card`) 不加，保持服务端。

### 3. i18n 约定（prop-drilling，无 Context）

- 字典文件：`i18n/dicts/en.json` / `i18n/dicts/zh.json`
- 服务端页面：`const dict = await getDict(lang)` → 将整个 dict 或按需的子 dict 作为 prop 传给客户端组件
- 不把字典放进 React Context，不使用翻译 Hook，保持服务端组件隔离
- 新增功能：在两个字典同步新增 `feature.key`，保持结构一致

### 4. 测试写法

- 只测 `lib/` 纯逻辑层，不测 React / DOM
- 使用 Node 原生 test runner：`import { test } from "node:test"` + `import assert from "node:assert/strict"`
- 文件命名：`tests/feature.test.ts`
- 运行：`npm test`

### 5. 样式与主题色

使用 Tailwind v4 CSS-first 主题，主题色令牌直接在 class 中用：

| 令牌 | 用途 |
|------|------|
| `bg-background` | 页面背景（深黑）|
| `bg-surface` | 卡片背景 |
| `border-border` | 边框色 |
| `text-primary` | 主文字 |
| `primary` / `neon-purple` / `neon-cyan` | 强调色 / 品牌色 |
| `font-heading` / `font-body` / `font-mono` | 字体族 |

所有自定义颜色必须使用这些令牌，不要手写 hex。

### 6. 绝对导入

所有导入从 `@/` 开始（`@/components/...`、`@/lib/...`），不要用 `../../` 相对路径跳多层。

### 7. 环境变量

- 本地 secrets：`.dev.vars`（Wrangler 自动读取），**不提交到 git**
- 公开模板：`.dev.vars.example`，把占位和注释提交
- D1 binding：通过 `getCloudflareContext().env.BLOG_VIEWS_DB` 获取，**绝对不要**读 `process.env`
- 公开 / NEXT_PUBLIC_ 变量：可从 `process.env` 读

---

## 五、后续阶段规格

每个阶段都是完整规格 — 下次会话直接按此实施即可。

---

### 阶段 A：管理后台仪表盘

**状态：✅ 已完成（2026-07-20）**

#### 实际交付时的偏差（相对下面规格）

- 页面**直接调用 `getDashboardStats()`**（服务端），不走 `fetch('/api/admin/stats')` self-fetch —— 少一跳更快。API 路由**保留**给未来客户端组件 / 外部工具用。
- 文章元数据来源不是 `lib/mdx.ts`：那个模块用 `fs.readdirSync`，Cloudflare Workers 运行时不允许。新增 `scripts/build-post-index.ts` 在 build 前 dump 出 `content/blog/index.json`，仪表盘运行时 import 这个 JSON。详见 `/Users/chendeji/.claude/projects/-Users-chendeji-Downloads-project-protfolio/memory/protfolio-runtime-fs-forbidden.md` 记忆。
- 新增 `lib/auth/session.ts` 抽出 JWT+role 校验共用逻辑；未在规格里但符合"分层"约定，后续 admin 路由都走这个。
- Middleware 加了 `/[lang]/admin/**` 的防御纵深重定向（未登录直接跳登录页），主校验仍在 `layout.tsx` 里。
- `todayViews` 用 UTC 当日边界（SQLite `datetime('now', 'start of day')`）。

#### 目标与范围

- 给管理员提供博客统计概览仪表盘
- 展示总文章数、总阅读量、分类数、今日阅读量数据卡片
- 展示所有博客文章按阅读量排行表格
- 展示按分类统计阅读量/文章数
- 不包含管理内容（增删改博客），只做只读统计
- **依赖本次交付**：OAuth 登录、admin role、D1 数据库

#### 数据模型变更

无需新增表，复用本次交付的 `users` 表 + `blog_post_views`（原有）+ `blog_view_events`（阶段 B 新建）

#### 需新增的文件

| 文件 | 职责 |
|------|------|
| `app/[lang]/admin/page.tsx` | 仪表盘主页（`force-dynamic`，服务端） |
| `app/[lang]/admin/layout.tsx` | 后台布局（顶部导航），服务端校验 JWT 与 admin role |
| `components/admin/AdminNav.tsx` | `"use client"`，顶部导航，显示用户名头像+登出 |
| `components/admin/StatsCard.tsx` | 统计卡片组件，复用现有 `Card` 组件 |
| `components/admin/PostsRankingTable.tsx` | 阅读量排行表格 |
| `components/admin/CategoryStats.tsx` | 分类统计组件 |
| `lib/admin/stats.ts` | 纯聚合逻辑（纯函数，可单测） |
| `lib/admin/stats-store.ts` | D1 查询层，获取聚合数据 |
| `app/api/admin/stats/route.ts` | 聚合数据 API，JWT+admin 校验 |

#### 需新增的依赖

- `recharts`（recharts@^3.9，React 19 peer 兼容）

#### API 契约

| Endpoint | Method | 用途 | 请求 / 响应 |
|----------|--------|------|------------|
| `/api/admin/stats` | GET | 获取仪表盘汇总数据 | 响应：`{ totalPosts, totalViews, totalCategories, todayViews, topPosts: [{ title, slug, lang, views }], categories: [{ name, postCount, totalViews }] }`，非 admin 返回 401/403 |

#### UI 组件清单

- AdminNav — 后台顶部导航，显示当前登录用户名头像+登出按钮
- StatsCard — 四个数据卡片（总文章/总阅读/分类/今日）
- PostsRankingTable — 按阅读量降序排列所有文章，显示阅读量、语言、分类
- CategoryStats — 按分类展示文章数+总阅读量

#### 验收标准

- 未登录用户访问 `/admin` 被重定向到 `/[lang]/login`
- 非 admin 登录用户访问 `/admin` 被重定向到首页
- 管理员登录后可以访问，所有数据正确聚合显示
- 符合现有 Tailwind 主题风格
- 类型检查通过，lint 零警告，单元测试通过

---

### 阶段 B：博客浏览事件采集

**状态：✅ 已完成（2026-07-20，与阶段 A 一并交付）**

`migrations/0002_create_blog_view_events.sql` 已应用到远程 D1；`incrementView()` 用 `db.batch()` 同一事务里 UPSERT views + INSERT event。

#### 目标与范围

- 在现有阅读计数基础上，记录每一次浏览的时间戳
- 用于阶段 C 生成每日/每月阅读量趋势图
- 在 `POST /api/blog/views` 累加阅读数时，插入一条事件记录
- 两个操作必须在同一个 D1 事务中保证一致性

#### 依赖前提

- 复用本次交付的 `blog-post-views` 表
- 依赖 Next.js 路由，API 路由已经存在

#### 数据模型变更

新建迁移 `migrations/0002_create_blog_view_events.sql`：

```sql
CREATE TABLE IF NOT EXISTS blog_view_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_key TEXT NOT NULL, -- "en:slug"
  lang TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_blog_view_events_created_at
  ON blog_view_events(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_view_events_post_key
  ON blog_view_events(post_key);
```

#### 需新增的文件

| 文件 | 职责 |
|------|------|
| （无新增文件，仅修改）`lib/blog-views-store.ts` | 新增 `recordViewEvent()` + `getTrendStats()` |
| （仅修改）`app/api/blog/views/route.ts` | 现有 POST 路由改为 `batch()` 事务：先 `incrementView` 再 `recordViewEvent` |

#### 需新增的依赖

无（纯 D1 SQL 操作，不需要新包）

#### API 契约

无需新增 API，修改现有 `POST /api/blog/views` 在原有逻辑基础上加事件记录，对外响应不变。

#### 验收标准

- 原有阅读计数功能正常工作
- 每次成功增量计数后，`blog_view_events` 表新增一条记录
- 索引正确建立，查询趋势数据性能良好
- 事务一致性：计数和事件记录要么都成功要么都失败
- 类型检查通过，lint 零警告

---

### 阶段 C：阅读量趋势图（recharts）

#### 目标与范围

- 在管理仪表盘展示阅读量趋势图，支持按天/按月切换
- 按天：最近 30 天柱状图
- 按月：最近 12 个月折线图
- 使用 recharts 库（可维护性优先）
- 符合项目深色主题

#### 依赖前提

- 依赖阶段 B 的 `blog_view_events` 表
- 依赖本次交付的登录与 admin 校验
- 依赖阶段 A 的仪表盘布局

#### 数据模型变更

无 — 复用阶段 B 新建的 `blog_view_events` 表

#### 需新增的文件

| 文件 | 职责 |
|------|------|
| `components/admin/TrendChart.tsx` | `"use client"`，趋势图组件，含天/月切换按钮，recharts 渲染柱状图/折线图 |
| `lib/admin/trends.ts` | 纯聚合逻辑（填充缺失日期、计算范围），可单测 |
| `app/api/admin/stats/trends/route.ts` | 趋势数据 API，`?granularity=day|month`，JWT+admin 校验 |

#### 需新增的依赖

已经在阶段 A 引入 recharts，无需重复。

#### API 契约

| Endpoint | Method | 用途 | 请求 / 响应 |
|----------|--------|------|------------|
| `/api/admin/stats/trends?granularity=day|month` | GET | 获取趋势数据 | 响应：`{ points: [{ label: "2025-01-01", count: number }] }`，非 admin 返回 401 |

#### UI 组件清单

- TrendChart — "use client"，天/月切换按钮，ResponsiveContainer + BarChart 或 LineChart + Tooltip，深色主题适配（文字浅色、网格半透明）

#### 验收标准

- 支持天（30天）/月（12月）切换
- Tooltip 悬浮显示日期和阅读量
- 图表自适应容器宽度
- 符合 Tailwind 深色主题，文字和网格可见但不突兀
- 类型检查通过，lint 零警告

---

### 阶段 D：评论系统

**状态：✅ 已完成（2026-07-22）**

#### 实际交付时的偏差

- 单层嵌套已实现（回复评论）；深度嵌套的 UI 收敛按 ROADMAP 里"一期可以先做单层"处理。
- 内容长度限制：5000 字符，服务端和客户端双重校验。
- 时间戳修正：D1 `CURRENT_TIMESTAMP` 输出无时区，V8 会当本地时间解析。`lib/comments/store.ts` 里 SELECT 和 INSERT ... RETURNING 都用 `strftime('%Y-%m-%dT%H:%M:%SZ', ...)` 明确 ISO 8601 UTC。别的表遇到同样场景照抄。
- Admin 删除功能保留，任意用户只能删自己的评论。
- `unused-imports` 干净：CommentItem 的 dict/currentUserId props 因为没实际用被移除。

#### 目标与范围

- 允许登录用户在博客文章下发表评论
- 管理员可以删除评论（不需要审核，所有人可见）
- 评论按时间倒序排列
- 支持嵌套回复（可选，一期可以先做单层）

#### 依赖前提

- 依赖本次交付的 `users` / `user_identities` 表（用户身份已经就绪）
- 依赖登录系统，必须登录才能评论

#### 数据模型变更

新建迁移 `migrations/0003_create_comments.sql`：

```sql
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_key TEXT NOT NULL, -- "en:slug"
  lang TEXT NOT NULL,
  slug TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE, -- 支持嵌套回复
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_comments_post_key ON comments(post_key);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
```

#### 需新增的文件

| 文件 | 职责 |
|------|------|
| `lib/comments/store.ts` | D1 数据访问层（list/created/delete） |
| `lib/comments/types.ts` | 类型定义 |
| `app/api/comments/[postKey]/route.ts` | GET 列表 / POST 新建 |
| `app/api/comments/[postKey]/[commentId]/route.ts` | DELETE 删除（仅 admin/作者本人） |
| `components/comments/CommentsSection.tsx` | `"use client"`，评论区整体组件 |
| `components/comments/CommentItem.tsx` | 单条评论 |
| `components/comments/CommentForm.tsx` | 发表评论表单 |

#### 需新增的依赖

无 — 纯 React 组件，不需要新包。

#### API 契约

| Endpoint | Method | 用途 |
|----------|--------|------|
| `/api/comments/[postKey]` | GET | 获取文章评论列表 |
| `/api/comments/[postKey]` | POST | 新建评论，需要登录 JWT |
| `/api/comments/[postKey]/[commentId]` | DELETE | 删除评论，仅 admin/作者 |

#### UI 组件清单

- CommentsSection — 整体容器，显示评论数 + 列表 + 新建表单
- CommentItem — 单条评论，显示用户头像、用户名、时间、内容、删除按钮（有权限时显示）
- CommentForm — 新建/回复 文本框 + 提交按钮

#### 验收标准

- 未登录用户不能发表评论，提示去登录
- 登录用户可以发表
- admin/作者可以删除
- 评论按时间倒序
- 样式符合主题
- 类型/lint 全过

---

### 阶段 E：广告弹窗与用户偏好

#### 目标与范围

- 对非登录用户展示博客阅读广告弹窗
- 允许登录用户勾选"不再显示"偏好
- 偏好存在 D1 `user_preferences` 表

#### 依赖前提

- 依赖本次交付的登录系统与 `users` 表

#### 数据模型变更

新建迁移 `migrations/0004_create_user_preferences.sql`：

```sql
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  hide_ads BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### 需新增的文件

| 文件 | 职责 |
|------|------|
| `lib/user-preferences/store.ts` | D1 数据访问：get / set |
| `components/ads/BlogAdPopup.tsx` | `"use client"`，广告弹窗，在博客文章页打开时触发 |
| （修改）`components/auth/UserMenu.tsx` | 偏好设置入口（可选） |

#### 需新增的依赖

无。

#### 验收标准

- 非登录用户每次打开博客文章显示弹窗（可以加会话级缓存避免重复）
- 登录用户如果设置 `hide_ads=true` 不显示
- 用户可以在弹窗或个人菜单设置偏好
- 偏好持久化到 D1
- 符合项目样式风格

---

## 六、可扩展点提示

### 添加新的 OAuth provider（Google / Apple / ...）

步骤：

1. 在 `lib/auth/providers/types.ts` 扩展 `ProviderId` 联合类型（加 `"google"`）
2. 新建 `lib/auth/providers/google.ts`，实现 `OAuthProvider` 接口
3. 在 `lib/auth/providers/index.ts` 把新 provider 注册到 `PROVIDERS` 映射
4. 在 `.dev.vars.example` 新增 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` 占位
5. 登录页自动会渲染新 provider 的按钮 — 不需要改 UI 代码
6. 用户数据自动会存入 `users` / `user_identities` 双表 — 不需要改存储代码

### 添加新的受 admin 保护的路由

只需要：

1. 在 `middleware.ts` 保证匹配 `/(en|zh)/admin/*` 做 JWT+role 校验 — 已经实现，不需要改
2. 新建 `app/[lang]/admin/feature/page.tsx` 即可，layout 会自动套用

### 在 users 表加新字段

直接修改 D1 migration 新增字段，现有代码不需要改存储逻辑（`createUserWithIdentity` 只需要更新 INSERT SQL），不影响已有的身份认证流程。

### 给 admin 仪表盘加新图表

只需要：
1. 在 `components/admin/` 新建图表组件，用 recharts
2. 在 `app/[lang]/admin/page.tsx` 加入组件
3. 如果需要新数据接口，新增 API 路由，遵循现有 JWT+admin 校验模式

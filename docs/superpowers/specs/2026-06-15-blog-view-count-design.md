# 博客浏览量展示设计文档

**日期：** 2026-06-15  
**作者：** Codex  
**状态：** 待评审

---

## 1. 背景与目标

当前博客内容来自 `content/blog/` 下的 Markdown 文件，通过 Next.js App Router 以静态页面形式输出。项目已经接入 Cloudflare Web Analytics 和 Microsoft Clarity，但这两者更适合后台分析，不适合直接作为前台公开展示的逐篇浏览量来源。

本次目标是在不破坏现有静态博客结构的前提下，为博客增加可公开展示的浏览量：

- 博客详情页显示该文章的浏览量
- 博客列表页显示每篇文章的浏览量
- 中英文文章分开计数
- 继续保留 Cloudflare Web Analytics 和 Clarity 作为后台分析工具

---

## 2. 用户体验目标

### 详情页

在文章标题下方、发布日期与阅读时长旁边，展示一个轻量浏览量文本，例如：

`1,234 views`

### 列表页

在博客卡片中，与发布日期同一视觉区域展示浏览量，例如：

`Jun 15, 2026 · 1,234 views`

### 计数语义

- 每篇文章展示的是“站内公开浏览量”
- 中英文文章分别显示自己的数字
- 该数字不追求与 Cloudflare Web Analytics 或 Clarity 后台完全一致

---

## 3. 方案对比

### 方案 A：直接读取第三方统计值

优点：

- 不需要自己维护浏览量数据

缺点：

- 更适合后台分析，不适合前台逐篇稳定展示
- 接口能力、统计口径、更新延迟都不受项目控制
- 与当前“每篇文章公开显示浏览量”的需求不匹配

### 方案 B：Cloudflare KV 计数

优点：

- 接入简单
- 与 Cloudflare 平台兼容

缺点：

- KV 为最终一致，不适合展示型计数
- 不支持天然的原子递增语义
- 列表页与详情页短时间可能显示不一致

### 方案 C：Cloudflare D1 计数

优点：

- 适合公开展示的累计浏览量
- 支持稳定的递增与读取
- 后续扩展热门文章、文章排行会更容易
- 与当前 Cloudflare 部署方式兼容

缺点：

- 比 KV 多一层数据库配置

### 结论

选择 **方案 C：Cloudflare D1 计数**。

---

## 4. 最终方案概述

浏览量系统将作为一个很薄的运行时层存在，不改变现有 Markdown 内容组织方式，也不把文章页面改造成重型动态页面。

整体流程如下：

1. 页面内容仍然由 Markdown 静态生成
2. 用户打开博客详情页后，浏览器调用站内接口为当前文章加 1
3. 详情页收到最新值后立即展示
4. 博客列表页在浏览器端批量拉取当前页所有文章的浏览量并展示

这样可以保持现有站点的静态优势，同时补齐一个小型、可维护的计数系统。

---

## 5. 数据模型

新增 D1 表：`blog_post_views`

建议结构：

```sql
CREATE TABLE IF NOT EXISTS blog_post_views (
  post_key TEXT PRIMARY KEY,
  lang TEXT NOT NULL,
  slug TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_post_views_lang_slug
ON blog_post_views(lang, slug);
```

### 字段说明

- `post_key`：文章唯一键，格式为 `${lang}:${slug}`
- `lang`：语言，例如 `en`、`zh`
- `slug`：文章 slug
- `views`：累计浏览量
- `updated_at`：最后一次更新的时间

### 设计理由

- 使用 `post_key` 可以简化主键设计
- `lang + slug` 分开存储，天然满足中英文分开计数的需求
- 结构足够简单，后续做热门文章排行也不需要改表

---

## 6. 接口设计

新增路由：`app/api/blog/views/route.ts`

### `POST /api/blog/views`

用途：

- 文章详情页打开时，为当前文章增加一次浏览量

请求体：

```json
{
  "lang": "en",
  "slug": "home-module-factory"
}
```

返回值：

```json
{
  "postKey": "en:home-module-factory",
  "views": 1234
}
```

数据库更新逻辑：

```sql
INSERT INTO blog_post_views (post_key, lang, slug, views, updated_at)
VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
ON CONFLICT(post_key) DO UPDATE SET
  views = views + 1,
  updated_at = CURRENT_TIMESTAMP;
```

### `GET /api/blog/views?keys=en:foo,zh:bar`

用途：

- 博客列表页批量拉取文章浏览量
- 详情页在必要时也可复用该接口读取当前值

返回值：

```json
{
  "en:foo": 123,
  "zh:bar": 45
}
```

约定：

- 查询结果中未命中的文章按 `0` 处理
- 接口返回时可显式补 `0`，也可由客户端在映射阶段兜底为 `0`

### 接口原则

- 仅支持站内文章使用，不做开放 API
- 不引入用户身份系统
- 接口尽量保持最小、简单、稳定

---

## 7. 计数策略

### 计数时机

只有在 **博客详情页真正打开并完成客户端挂载后** 才进行计数。

这意味着：

- 浏览博客列表页不会加 1
- 搜索引擎预抓取、Next.js 链接预取不会直接触发加 1
- 只有真正进入文章详情页，才算一次阅读

### 防重复策略

默认规则：

- 同一浏览器
- 同一篇文章
- **12 小时内最多计 1 次**

客户端使用 `localStorage` 记录最近一次记数时间：

- 首次打开文章：计数
- 12 小时内重复打开或刷新：不计数
- 超过 12 小时再次打开：允许再次计数

如果浏览器无法使用 `localStorage`：

- 仍允许本次访问计数
- 但不保证 12 小时内去重
- 页面功能本身不受影响

### 设计理由

- 完全不防重复会让刷新快速抬高数字
- 防得过严会低估真实重复阅读
- `12 小时一次` 对个人博客是一个平衡的默认值

### 非目标

- 不做强防刷
- 不做基于登录用户的唯一计数
- 不做基于 IP 的复杂识别

---

## 8. 页面接入方式

### 详情页

在 [`app/[lang]/blog/[slug]/page.tsx`](/Users/chendeji/Downloads/project/protfolio/app/[lang]/blog/[slug]/page.tsx) 中新增一个客户端子组件，例如 `PostViewCount`：

- 页面加载后读取 `lang` 和 `slug`
- 判断本地是否在 12 小时窗口内已经计数
- 若未计数，则调用 `POST /api/blog/views`
- 用返回的最新 `views` 更新界面

展示位置：

- 位于标题下方元信息区
- 与日期、阅读时长并列显示

### 列表页

在 [`components/Blog.tsx`](/Users/chendeji/Downloads/project/protfolio/components/Blog.tsx) 中新增列表用客户端读取逻辑，例如 `BlogViewCounts`：

- 收集当前页面所有文章的 `post_key`
- 一次性调用 `GET /api/blog/views?keys=...`
- 将结果映射回每张卡片

展示位置：

- 位于卡片日期同一行
- 作为次级信息显示

### 初始占位

在浏览量尚未返回前：

- 详情页显示 `-- views`
- 列表页显示 `-- views`

这样比直接显示 `0 views` 更不容易误导用户。

---

## 9. 保持静态博客结构不变

本方案的关键决策是：

- **不在服务端静态生成阶段读取浏览量**
- **不把博客页面改成依赖数据库的动态页面**

原因：

- 当前博客以静态输出为主，加载快、部署简单
- 浏览量属于典型的运行时数据，更适合在客户端补充
- 这样能最大限度降低对现有博客架构的影响

换句话说，文章内容仍是静态的，浏览量是运行时增强信息。

---

## 10. Cloudflare 配置需求

需要新增一个 D1 数据库绑定到 Worker。

后续实现阶段会包含：

- 在 `wrangler.jsonc` 中增加 `d1_databases` 配置
- 新增 D1 migration 文件
- 本地开发与 `preview` 环境的 D1 可用性验证

当前阶段不在文档中固化具体数据库 ID，只固定绑定名称与使用方式。

建议绑定名：

`BLOG_VIEWS_DB`

---

## 11. 错误处理

### 计数失败

如果 `POST /api/blog/views` 失败：

- 页面主体正常显示
- 浏览量区域保留 `-- views`
- 不影响文章阅读

### 批量读取失败

如果列表页批量获取失败：

- 所有卡片保留 `-- views`
- 不阻塞页面渲染

### 非法文章参数

如果接口收到未知 `lang` 或空 `slug`：

- 返回 `400`
- 不写入数据库

---

## 12. 测试与验证

实现阶段至少验证以下内容：

- 详情页首次打开会加 1
- 同一文章刷新不会在 12 小时内持续增加
- 不同文章分别计数
- 中英文文章分开计数
- 列表页能批量读到正确浏览量
- `npm run lint`
- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm run cf:build`
- `npm run preview`

---

## 13. 非目标

本次不包含：

- 后台管理面板
- 热门文章排序页面
- 阅读量历史趋势图
- 登录用户系统
- 严格防刷系统

这些都可以在本方案之上后续扩展。

---

## 14. 最终结论

本项目的博客浏览量功能应采用：

- **Cloudflare D1** 作为展示用浏览量存储
- **站内 API** 负责递增与读取
- **客户端轻量防重复计数** 负责避免刷新狂刷
- **博客详情页与博客列表页** 同时展示浏览量
- **中英文文章分开计数**

这是当前项目在“稳定性、实现复杂度、Cloudflare 兼容性、用户体验”之间最平衡的方案。

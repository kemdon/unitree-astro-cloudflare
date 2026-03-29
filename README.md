# Astro 自建 Admin 企业站

一个基于 `Astro + React islands + Zod` 的固定结构企业站系统，前台与 `/admin` 后台统一部署到 `Cloudflare Workers`，内容持久化使用 `D1`，媒体文件使用 `R2`。

这个项目不是通用 CMS。页面结构由固定 `block system` 驱动，后台只负责编辑固定 schema 下的数据。

## 当前能力

- 前台页面从 `D1` 读取站点配置和页面内容
- `/admin/site` 可编辑站点配置、导航、SEO、联系方式
- `/admin/pages` 可新建、编辑、删除页面，并支持 block 增删改和排序
- `/admin/preview/[id]` 可预览已保存页面
- `/admin/media` 可上传、查看、删除媒体文件，并统一输出 `/uploads/...` 引用路径
- `/admin` 与受保护 API 统一使用登录页 + Cookie 会话
- 中英文双语字段支持，前台通过 `?lang=zh` / `?lang=en` 切换
- 所有站点和页面数据都通过 `zod` 校验
- 核心模板页和默认导航已加入契约保护
- `products` 页支持自动列出已保存的产品详情页
- 已包含单元测试、API 测试和一个后台编辑 smoke e2e

## 技术栈

- `Astro`
- `@astrojs/cloudflare`
- `Cloudflare Workers`
- `Cloudflare D1`
- `Cloudflare R2`
- `React`
- `TypeScript`
- `Zod`
- `Vitest`
- `Playwright`
- `Wrangler`

## 目录说明

```txt
content/                 # 初始站点内容源，用于生成 D1 seed
public/uploads/          # 迁移前本地媒体源，可同步到 R2
migrations/              # D1 schema migrations
seed/d1-content.sql      # D1 初始化种子
scripts/                 # seed 生成、R2 同步等脚本
src/                     # 前台、后台、API、数据层
wrangler.jsonc           # Cloudflare Workers 配置
wrangler.template.jsonc  # 新项目初始化模板
```

关键文件：

- `src/lib/storage.ts`：D1 数据读写
- `src/lib/media.ts`：R2 媒体读写
- `src/pages/uploads/[...key].ts`：从 R2 回源 `/uploads/...`
- `migrations/0001_schema.sql`：D1 表结构
- `seed/d1-content.sql`：默认内容 seed
- `scripts/generate-d1-seed.mjs`：从 `content/` 重新生成 seed
- `scripts/sync-r2-media.mjs`：把 `public/uploads/` 同步到 R2

## 本地开发

后台登录账号建议通过环境变量配置，请不要把真实账号密码提交到仓库，也不要依赖模板内置的默认凭据。

本地开发可写入 `.dev.vars` 或 `.env`：

```env
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password
```

首次本地初始化：

```bash
npm install
npm run cf:setup:local
```

启动开发服务器：

```bash
npm run dev
```

常用命令：

```bash
npm run check
npm test
npm run test:e2e
npm run build
npm run preview
npm run cf:db:generate-seed
```

## 内容与媒体

### 页面与站点内容

- 运行时内容存储在 `D1`
- `content/site.json` 和 `content/pages/*.json` 仅作为初始化内容源
- 当你修改了 `content/` 下的默认内容后，执行 `npm run cf:db:generate-seed` 可重新生成 `seed/d1-content.sql`

页面约束：

- `id` 必须稳定
- `slug` 必须唯一
- `pageType` 用于区分普通页、产品列表页和产品详情页
- 首页通常使用 `id = "home"`、`slug = "/"`
- `product-detail` 模板页默认使用 `slug = "/products/product-detail"`
- `home`、`products`、`about`、`contact`、`product-detail` 属于保留模板页，不能删除，且必须保持约定 slug

### 产品详情复用约定

- `product-detail` 是详情页模板源，不进入主导航
- 实际产品详情页建议使用：
  - `id = product-*`
  - `slug = /products/<slug>`
- 后台可从 `product-detail` 或已有产品详情页复制出新草稿，再修改 slug 和文案后保存

### 媒体文件

- 运行时媒体文件存储在 `R2`
- 前台和后台统一使用 `/uploads/...` 作为引用路径
- `public/uploads/` 作为初始本地媒体源，可通过 `npm run cf:r2:sync:local` 或 `npm run cf:r2:sync:remote` 同步到 R2

## 后台鉴权

以下路径都受登录态保护：

- `/admin`
- `/api/site`
- `/api/pages`
- `/api/pages/*`
- `/api/media`

账号密码请通过环境变量注入，不要在文档中记录真实值。

可选覆盖变量：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

## Cloudflare 初始化与部署

详细步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

如果你要把这个仓库作为新项目底座复用，先看 [PROJECT_INIT_CHECKLIST.md](./PROJECT_INIT_CHECKLIST.md)。

当前 [wrangler.jsonc](./wrangler.jsonc) 已刻意清空项目特定的 `Worker`、`D1`、`R2` 值，避免误绑定到其他项目。新项目建议从 [wrangler.template.jsonc](./wrangler.template.jsonc) 复制配置并填写后再部署。

最常用的命令是：

```bash
npm run cf:setup:local
npm run cf:db:setup:remote
npm run cf:r2:sync:remote
npm run cf:deploy
```

## 测试状态

当前已覆盖：

- 国际化工具测试
- 页面唯一性规则测试
- `pages` API 测试
- `site` API 测试
- `media` API 测试
- 鉴权测试
- `/admin/pages` 编辑流程 smoke e2e

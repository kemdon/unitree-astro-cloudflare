# PRD v2：Astro 企业站生成系统（自建 Admin 全栈版）

## 1. 项目目标

构建一个基于 `Astro` 的单体全栈应用，用于快速生成和维护企业官网。

系统必须具备以下能力：

- 生成企业官网前台页面
- 内置 `/admin` 后台用于编辑站点配置和页面内容
- 支持部署到 `Vercel`，并保留后续兼容 `Cloudflare` 的空间

本项目的核心目标不是做通用 CMS，而是做一个结构固定、可预测、便于稳定维护的企业站系统。

第一版同时提供一套默认官网模板页结构：

- `home`
- `about`
- `contact`
- `products`
- `product-detail`

这些页面是模板骨架，不包含行业或公司示例业务文案。

---

## 2. 产品定位与边界

### 2.1 产品定位

这是一个面向企业官网场景的内容生成与编辑系统，特点是：

- 固定内容模型
- 固定页面渲染方式
- 固定 block 类型
- 轻量后台编辑

### 2.2 明确不做

以下能力明确不在本项目范围内：

- 通用 CMS
- 动态 schema 设计器
- 可视化拖拽搭建器
- 富文本复杂编辑器
- 权限系统
- 多用户系统
- 工作流审批
- 多租户

---

## 3. 核心原则

### 3.1 强约束

以下原则必须遵守：

1. 禁止引入复杂 CMS 逻辑
2. 禁止动态 schema，所有结构必须固定
3. 所有页面必须由 block system 驱动
4. 数据结构必须严格类型化，并通过 `zod` 校验
5. 前台不包含业务编辑逻辑，只负责渲染
6. Admin 只做配置编辑，不做复杂系统
7. 第一版必须基于文件系统存储

### 3.2 架构原则

- `schema first`：先定义类型和数据契约，再实现页面和编辑器
- `server first`：优先使用 Astro 服务端能力，减少不必要客户端状态
- `block first`：页面内容只能通过 block 组合生成
- `validate before save`：所有写入都必须先过 schema 校验
- `locale aware`：从 v1 开始支持中英文内容结构

---

## 4. 技术栈

### 4.1 必选

- `Astro`
- `TypeScript`
- `Zod`

### 4.2 UI 技术

- 前台：`Astro components`
- 后台：`Astro pages + React islands`

说明：

- 简单表单和基础保存流优先使用 Astro 服务端能力
- 动态 block 编辑器使用 React islands
- 不追求后台完全无客户端 JS，但要控制复杂度

### 4.3 第二阶段可选

- 数据库：`Neon` / `D1`
- 文件存储：`Vercel Blob` / `Cloudflare R2`
- 登录认证

---

## 5. 项目目录结构

第一版必须遵循以下目录结构：

```txt
project/
├─ src/
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ [...slug].astro
│  │  ├─ admin/
│  │  │  ├─ index.astro
│  │  │  ├─ pages.astro
│  │  │  ├─ site.astro
│  │  │  └─ media.astro
│  │  └─ api/
│  │     ├─ site.ts
│  │     ├─ pages.ts
│  │     ├─ pages/
│  │     │  └─ [id].ts
│  │     ├─ media.ts
│  ├─ components/
│  │  ├─ blocks/
│  │  │  ├─ Hero.astro
│  │  │  ├─ Features.astro
│  │  │  ├─ FAQ.astro
│  │  │  ├─ CTA.astro
│  │  │  └─ index.ts
│  │  └─ admin/
│  │     ├─ SiteForm.tsx
│  │     ├─ PageEditor.tsx
│  │     ├─ BlockEditor.tsx
│  │     └─ MediaUploader.tsx
│  ├─ lib/
│  │  ├─ schema.ts
│  │  ├─ storage.ts
│  │  ├─ blocks.ts
│  │  ├─ loader.ts
│  │  ├─ i18n.ts
│  │  └─ paths.ts
│  └─ styles/
├─ content/
│  ├─ site.json
│  └─ pages/
│     ├─ home.json
│     ├─ about.json
│     ├─ contact.json
│     ├─ products.json
│     └─ product-detail.json
├─ public/
│  └─ uploads/
├─ astro.config.mjs
├─ package.json
└─ tsconfig.json
```

---

## 6. 数据模型设计

## 6.1 国际化字段规范

系统从 v1 开始支持中英文双语字段。

定义一个统一的可翻译字段结构：

```ts
export const LocalizedStringSchema = z.object({
  zh: z.string(),
  en: z.string(),
})
```

原则：

- 所有会展示给用户的文案字段，优先使用 `LocalizedStringSchema`
- 非文案字段保持普通类型，例如 `slug`、`href`、`email`、`phone`
- 不允许某些 block 用双语、某些 block 随意用字符串，必须统一

不需要双语的字段示例：

- `id`
- `slug`
- `href`
- `phone`
- `email`
- 颜色值
- 图片地址

需要双语的字段示例：

- 页面标题
- SEO 标题
- SEO 描述
- Hero 标题与描述
- CTA 文案
- FAQ 问答
- 导航名称

---

## 6.2 SiteConfig Schema

```ts
export const LocalizedStringSchema = z.object({
  zh: z.string(),
  en: z.string(),
})

export const NavItemSchema = z.object({
  label: LocalizedStringSchema,
  href: z.string(),
})

export const SiteSchema = z.object({
  siteName: LocalizedStringSchema,
  defaultLocale: z.enum(["zh", "en"]).default("zh"),
  locales: z.array(z.enum(["zh", "en"])).default(["zh", "en"]),
  brand: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    logoText: LocalizedStringSchema.optional(),
  }),
  contact: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: LocalizedStringSchema.optional(),
  }),
  seo: z.object({
    defaultTitle: LocalizedStringSchema,
    defaultDescription: LocalizedStringSchema,
  }),
  navigation: z.array(NavItemSchema),
})
```

---

## 6.3 Page Schema

```ts
export const PageSeoSchema = z.object({
  title: LocalizedStringSchema,
  description: LocalizedStringSchema,
})
```

```ts
export const PageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: LocalizedStringSchema,
  seo: PageSeoSchema,
  blocks: z.array(BlockSchema),
})
```

约束：

- `id` 必须稳定，不依赖标题自动变化
- `slug` 必须唯一
- `home` 页面约定 slug 为 `/`
- `product-detail` 页面可作为详情模板页，默认 slug 建议为 `/products/product-detail`
- 内容文件名默认使用 `id`，不直接使用标题

---

## 6.4 Block Schema

`blocks` 不能使用 `z.any()`，必须使用严格的 discriminated union。

```ts
export const HeroBlockSchema = z.object({
  type: z.literal("hero"),
  props: z.object({
    eyebrow: LocalizedStringSchema.optional(),
    title: LocalizedStringSchema,
    description: LocalizedStringSchema,
    primaryCtaLabel: LocalizedStringSchema.optional(),
    primaryCtaHref: z.string().optional(),
    secondaryCtaLabel: LocalizedStringSchema.optional(),
    secondaryCtaHref: z.string().optional(),
    image: z.string().optional(),
  }),
})

export const FeaturesBlockSchema = z.object({
  type: z.literal("features"),
  props: z.object({
    title: LocalizedStringSchema,
    items: z.array(
      z.object({
        title: LocalizedStringSchema,
        description: LocalizedStringSchema,
        icon: z.string().optional(),
      })
    ),
  }),
})

export const FAQBlockSchema = z.object({
  type: z.literal("faq"),
  props: z.object({
    title: LocalizedStringSchema,
    items: z.array(
      z.object({
        question: LocalizedStringSchema,
        answer: LocalizedStringSchema,
      })
    ),
  }),
})

export const CTABlockSchema = z.object({
  type: z.literal("cta"),
  props: z.object({
    title: LocalizedStringSchema,
    description: LocalizedStringSchema.optional(),
    buttonLabel: LocalizedStringSchema,
    buttonHref: z.string(),
  }),
})

export const BlockSchema = z.discriminatedUnion("type", [
  HeroBlockSchema,
  FeaturesBlockSchema,
  FAQBlockSchema,
  CTABlockSchema,
])
```

要求：

- block 类型必须固定在白名单内
- 每个 block 必须有严格的 props schema
- Admin 添加 block 时只能从白名单中选择

---

## 7. Block System

## 7.1 Registry

```ts
import Hero from "../components/blocks/Hero.astro"
import Features from "../components/blocks/Features.astro"
import FAQ from "../components/blocks/FAQ.astro"
import CTA from "../components/blocks/CTA.astro"

export const blockRegistry = {
  hero: Hero,
  features: Features,
  faq: FAQ,
  cta: CTA,
}
```

要求：

- registry 必须与 `BlockSchema` 保持一致
- 新增 block 时必须同步更新：
  - schema
  - 组件
  - registry
  - admin 编辑器

## 7.2 渲染逻辑

渲染逻辑必须是纯映射，不允许混入业务逻辑。

```ts
export function getBlockComponent(type: Block["type"]) {
  return blockRegistry[type]
}
```

前台页面负责：

- 加载内容
- 选择 locale
- 遍历 blocks
- 渲染对应组件

前台页面不负责：

- 动态拼 schema
- 推断 block 结构
- 修复非法数据

---

## 8. 前台渲染实现

## 8.1 路由

必须实现：

- `/`：首页
- `/[...slug]`：通用内容页
- `/admin`：后台入口

## 8.2 页面加载规则

页面加载逻辑：

1. 根据当前路由解析 slug
2. 通过 `loader.ts` 读取对应 page 数据
3. 用 `zod` 校验
4. 根据当前 locale 取对应文案
5. 渲染 blocks

## 8.3 slug 与文件映射规范

约定：

- `content/pages/home.json` 对应首页
- `content/pages/products.json` 对应产品列表页
- `content/pages/product-detail.json` 对应详情模板页
- 页面文件名默认使用 `id`
- `slug` 字段决定前台访问路径
- 首页允许 `id = "home"` 且 `slug = "/"`

第一版默认模板页建议：

- `home`：`hero + features + cta`
- `about`：`hero + features + cta`
- `contact`：`hero + faq`
- `products`：`hero + features + cta`
- `product-detail`：`hero + features + faq + cta`

要求：

- 默认模板页必须提供结构骨架
- 默认模板页不应包含具体行业、公司名称、地址或示例业务文案
- `product-detail` 作为详情模板页，默认不进入主导航
- 实际产品详情页建议采用批量复制流程，而不是手工从零新建

产品详情页复用约定：

- `product-detail` 作为详情模板源页
- 实际详情页 `id` 建议使用 `product-*`
- 实际详情页 `slug` 建议使用 `/products/<slug>`
- 后台应支持从模板页或已有产品详情页复制出新草稿，再修改 slug 与内容后保存

示例：

```json
{
  "id": "about",
  "slug": "/about",
  "title": {
    "zh": "关于我们",
    "en": "About Us"
  }
}
```

---

## 9. Admin 设计

## 9.1 技术方案

Admin 采用混合方案：

- 基础页面与简单保存流：`Astro`
- 强交互编辑器：`React islands`

原因：

- `Site` 编辑相对简单，适合服务端优先模式
- `PageEditor` 和 `BlockEditor` 需要处理数组、增删、排序、动态字段，React 更合适
- 该方案比“全 React Admin”更轻，也比“纯 HTML Form”更可维护

## 9.2 /admin 页面能力

必须包含：

### 1. Site 设置

- 编辑 `site.json`
- 编辑导航、SEO、联系方式
- 支持双语字段输入

### 2. 页面管理

- 页面列表
- 新建页面
- 编辑页面
- 删除页面
- 调整 block 顺序

### 3. Block 编辑器

- 添加 block
- 修改 props
- 删除 block
- 上移 / 下移 block

### 4. 媒体管理

- 上传文件
- 查看文件列表
- 删除文件
- 复制可引用路径

## 9.3 Admin 限制

禁止实现：

- 拖拽式页面搭建器
- 任意 JSON 编辑器
- 复杂富文本
- 多用户权限
- workflow 审批

---

## 10. API 设计

API 使用 Astro endpoints 实现，必须保持输入输出稳定。

## 10.1 `GET /api/site`

返回站点配置。

```json
{
  "siteName": {
    "zh": "示例公司",
    "en": "Example Company"
  }
}
```

## 10.2 `PUT /api/site`

功能：

- 接收完整 site payload
- 使用 `SiteSchema` 校验
- 校验通过后写入 `content/site.json`

失败时返回：

```json
{
  "ok": false,
  "error": "Invalid site payload"
}
```

## 10.3 `GET /api/pages`

返回页面列表，默认返回简化信息或完整 page 数组，具体以实现时的编辑体验为准，但结构必须稳定。

## 10.4 `POST /api/pages`

功能：

- 创建新页面
- 接收完整 page payload
- 使用 `PageSchema` 校验
- 校验通过后写入 `content/pages/{id}.json`

## 10.5 `GET /api/pages/:id`

Astro 文件路由建议落在：

`src/pages/api/pages/[id].ts`

功能：

- 根据 `id` 读取单页
- 返回 page JSON

## 10.6 `PUT /api/pages/:id`

功能：

- 接收单页 payload
- 使用 `PageSchema` 校验
- 校验通过后写入 `content/pages/{id}.json`

## 10.7 `DELETE /api/pages/:id`

功能：

- 根据 `id` 删除单页

## 10.8 `GET /api/media`

返回媒体文件列表。

## 10.9 `POST /api/media`

功能：

- 接收上传文件
- 保存到 `public/uploads`
- 返回可引用路径

## 10.10 `DELETE /api/media`

功能：

- 根据文件名删除已上传文件

---

## 11. 页面与后台编辑原则

## 11.1 页面编辑目标

后台编辑能力只服务于以下内容：

- 站点基础配置
- 页面基础信息
- block 数组
- 媒体文件引用

## 11.2 编辑原则

- 后台不提供自由结构编辑
- 后台不允许绕过 schema 直接保存非法数据
- 后台只编辑固定字段，不承担内容生成职责
- 任何页面内容都必须来自固定 schema

---

## 12. 存储策略

## 12.1 第一版必须使用文件系统

```txt
content/
  site.json
  pages/*.json
```

要求：

- 所有数据先读文件
- 所有保存操作覆盖原文件
- 保存前必须校验
- 文件内容必须格式化，便于人工查看和调试

## 12.2 storage.ts 接口

```ts
export async function loadSite()
export async function saveSite(data)

export async function listPages()
export async function loadPage(id)
export async function savePage(id, data)
export async function deletePage(id)
```

## 12.3 loader.ts 职责

`loader.ts` 负责：

- 从 storage 层读取数据
- 执行 schema 校验
- 给前台返回已验证的数据

不负责：

- 自动修复坏数据
- 推断缺失字段
- 容错生成新结构

---

## 13. 国际化策略

## 13.1 v1 策略

第一版只要求：

- 数据结构支持 `zh/en`
- 页面渲染时能按 locale 选择文案
- 没有对应语言时，回退到默认语言

## 13.2 locale 规则

- `site.defaultLocale` 决定默认语言
- `site.locales` 决定支持语言集合
- `getLocalizedValue(value, locale, defaultLocale)` 负责取值
- 第一版前台通过查询参数 `?lang=zh` / `?lang=en` 切换语言
- 语言切换必须尽量保留当前 pathname，不强制跳回首页

示例：

```ts
export function getLocalizedValue(
  value: { zh: string; en: string },
  locale: "zh" | "en",
  defaultLocale: "zh" | "en"
) {
  return value[locale] || value[defaultLocale]
}
```

---

## 14. 媒体策略

## 14.1 第一版

第一版媒体策略保持简单：

- 图片使用字符串路径引用
- 默认存放在 `public/uploads/`
- `media` 管理页可以后续补全，第一版只需保留基本入口

## 14.2 不在第一版做的能力

- 云存储适配
- 图片裁剪
- 复杂媒体库
- 自动图片优化工作流

---

## 15. 部署要求

## 15.1 必须支持 Vercel

要求：

- 前台可静态输出或混合渲染
- `/admin` 与 `/api` 支持 SSR
- 文件系统方案适合本地开发与演示，但部署到 Vercel 时要明确其限制

说明：

- 如果生产环境需要持久写入，后续必须将 storage 从文件系统迁移到数据库或对象存储
- 因此第一版的“文件系统存储”更适合本地开发、预览和单机环境验证

## 15.2 Cloudflare

保留适配空间，但不作为第一阶段必须项。

---

## 16. 开发阶段规划

## 阶段 1：必须完成

- 建立 Astro 项目骨架
- 定义 `schema.ts`
- 完成 block system
- 完成页面渲染
- 完成文件存储
- 提供默认官网模板页骨架
- 完成基础 admin
- 完成基本双语支持
- 完成最小可用媒体管理

## 阶段 2：可选增强

- storage 替换为数据库
- 图片上传
- 登录系统
- 发布流程优化

---

## 17. 验收标准

满足以下条件，视为阶段 1 可交付：

- 可以通过配置文件渲染首页和普通页面
- 所有页面数据通过 `zod` 校验
- `/admin/site` 可以编辑并保存站点配置
- `/admin/pages` 可以编辑页面及 blocks
- `/admin/media` 可以上传、查看和删除媒体文件
- 页面支持 `zh/en` 双语字段
- 非法数据不会直接写入文件

---

## 18. 给 Coding 工具的最终约束

这是一个固定结构的企业站系统，不是 CMS。

你必须遵守以下规则：

1. 不要设计动态 schema
2. 不要引入复杂后台能力
3. 所有页面只能由 block system 驱动
4. 所有数据必须先过 `zod` 校验
5. 所有可翻译字段必须使用统一双语结构
6. `blocks.type` 只能来自白名单
7. 前台只负责渲染，Admin 只负责编辑
8. 第一版必须优先简单、稳定、可预测

---

## 19. 最重要的一句话

这个项目不是 CMS，不需要通用能力。

所有结构必须固定，所有页面必须由 block system 驱动。

目标是稳定维护企业站，而不是支持复杂内容编辑。

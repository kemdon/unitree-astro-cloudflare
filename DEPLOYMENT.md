# Cloudflare 部署说明

本项目已经按 `Cloudflare Workers + D1 + R2` 方式改造完成。

如果你当前是在把这个仓库作为底座复用，先看 [PROJECT_INIT_CHECKLIST.md](./PROJECT_INIT_CHECKLIST.md)。

当前 [wrangler.jsonc](./wrangler.jsonc) 中的项目特定资源值已清空；建议先参考 [wrangler.template.jsonc](./wrangler.template.jsonc) 填好新项目配置，再执行下面步骤。

运行时模型：

- 页面与站点配置：`D1`
- 媒体文件：`R2`
- 应用托管：`Workers`
- URL 形式：媒体依然走 `/uploads/...`

## 1. 准备 Cloudflare 资源

### 1.1 创建 D1 数据库

```bash
wrangler d1 create <your-d1-database-name>
```

创建完成后，Wrangler 会返回 `database_id`。把它写入 [wrangler.jsonc](./wrangler.jsonc) 的 `d1_databases[0].database_id`。

### 1.2 创建 R2 存储桶

```bash
wrangler r2 bucket create <your-r2-bucket-name>
```

如果你改了桶名，同时更新 [wrangler.jsonc](./wrangler.jsonc) 的 `r2_buckets[0].bucket_name`。

## 2. 本地开发初始化

安装依赖：

```bash
npm install
```

首次初始化本地 `D1/R2`：

```bash
npm run cf:setup:local
```

这个命令会执行：

- `wrangler d1 migrations apply DB --local`
- `wrangler d1 execute DB --local --file ./seed/d1-content.sql`
- 把 `public/uploads/` 里的文件同步到本地 R2

然后启动开发：

```bash
npm run dev
```

如需本地构建态验证：

```bash
npm run build
npm run preview
```

## 3. 本地账号覆盖

模板内置了仅供本地开发兜底的默认后台账号，不建议在真实项目中直接使用。

- 用户名：`template-admin`
- 密码：`change-me-immediately`

如需覆盖，复制 [.dev.vars.example](./.dev.vars.example) 为 `.dev.vars`：

```env
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=your-password
```

## 4. D1 schema 与 seed

表结构：

- [0001_schema.sql](./migrations/0001_schema.sql)

默认内容 seed：

- [d1-content.sql](./seed/d1-content.sql)

如果你更新了 `content/` 里的初始内容，希望重新生成 seed：

```bash
npm run cf:db:generate-seed
```

这会重新生成 [d1-content.sql](./seed/d1-content.sql)。

## 5. 远端初始化

先把 schema 和默认内容写入远端 D1：

```bash
npm run cf:db:setup:remote
```

如果需要把本地 `public/uploads/` 里的历史文件导入远端 R2：

```bash
npm run cf:r2:sync:remote
```

## 6. 部署

部署到 Cloudflare Workers：

```bash
npm run cf:deploy
```

## 7. 常用命令

```bash
npm run cf:db:migrate:local
npm run cf:db:seed:local
npm run cf:db:migrate:remote
npm run cf:db:seed:remote
npm run cf:r2:sync:local
npm run cf:r2:sync:remote
```

## 8. 注意事项

- [wrangler.jsonc](./wrangler.jsonc) 当前内置的 `database_id` 值为空，需要你自行填写
- [wrangler.jsonc](./wrangler.jsonc) 当前内置的 `Worker` / `D1` / `R2` 名称值为空，需要你自行填写
- 真正部署前必须填写你自己的 `D1 database_id`
- 真正部署前也必须替换成你自己的 `Worker` 名称、`D1 database_name` 和 `R2 bucket_name`
- 本地 `--local` 命令可以直接用占位 `database_id`
- 这个仓库仍然保留 `content/` 和 `public/uploads/`，但它们现在是“初始化来源”，不是运行时主存储

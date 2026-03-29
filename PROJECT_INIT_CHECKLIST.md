# 项目初始化清单

这个仓库当前是“可复用底座”状态，默认不会绑定任何具体 Cloudflare 资源。

## 1. 克隆后先做的事

- 修改 [package.json](./package.json) 中的项目名
- 修改 [README.md](./README.md) 中的项目标题和业务描述
- 根据新项目内容更新 `content/` 下的站点与页面初始数据
- 根据新项目媒体资源更新 `public/uploads/`

## 2. 初始化 Cloudflare 配置

- 打开 [wrangler.template.jsonc](./wrangler.template.jsonc)
- 将以下占位符替换为新项目实际值：
  - `<your-worker-name>`
  - `<your-d1-database-name>`
  - `<your-d1-database-id>`
  - `<your-r2-bucket-name>`
- 把替换后的内容写入 [wrangler.jsonc](./wrangler.jsonc)

## 3. 创建 Cloudflare 资源

先创建 D1：

```bash
wrangler d1 create <your-d1-database-name>
```

再创建 R2：

```bash
wrangler r2 bucket create <your-r2-bucket-name>
```

把 D1 返回的真实 `database_id` 填回 [wrangler.jsonc](./wrangler.jsonc)。

## 4. 初始化本地和远端数据

安装依赖：

```bash
npm install
```

如你修改了 `content/` 初始内容，先重新生成 seed：

```bash
npm run cf:db:generate-seed
```

初始化本地 D1/R2：

```bash
npm run cf:setup:local
```

初始化远端 D1：

```bash
npm run cf:db:setup:remote
```

如需把本地媒体导入远端 R2：

```bash
npm run cf:r2:sync:remote
```

## 5. 配置后台账号

复制 [.dev.vars.example](./.dev.vars.example) 为 `.dev.vars`，按项目需要设置：

```env
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password
```

不要依赖模板内置的默认凭据；它们只用于本地开发兜底，不应直接用于真实项目。

## 6. 本地验证

```bash
npm run check
npm test
npm run build
npm run preview
```

如需跑 e2e：

```bash
npm run test:e2e
```

## 7. 正式部署前复核

- [wrangler.jsonc](./wrangler.jsonc) 不应保留空字符串
- `Worker` / `D1` / `R2` 名称应全部替换为新项目值
- `database_id` 应为真实远端 D1 ID
- `.dev.vars` 与 `.env` 不应提交真实敏感值
- `content/`、`seed/`、`public/uploads/` 应与新项目一致

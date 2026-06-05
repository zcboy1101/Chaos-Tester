# Chaos-Tester 部署指南

## 推荐方案

当前 MVP 推荐部署到 Vercel：

- 项目是标准 Next.js App Router 应用。
- 首页和 API 路由都能由 Vercel 自动构建和托管。
- 环境变量可以直接在 Vercel 项目设置里维护。
- GitHub 仓库接入后，每次推送主分支都会自动部署。

## Vercel 部署步骤

1. 把项目推送到 GitHub。
2. 登录 Vercel，选择 `Add New Project`。
3. 导入 Chaos-Tester 仓库。
4. Framework Preset 选择 `Next.js`。
5. Build Command 使用默认值：

```bash
npm run build
```

6. Install Command 使用默认值：

```bash
npm install
```

7. 在 `Project Settings -> Environment Variables` 添加模型服务密钥。
8. 点击 Deploy。

## 必填环境变量

至少配置一组可用模型服务。例如只使用 OpenAI：

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
```

使用 MiMo：

```bash
MIMO_API_KEY=
MIMO_MODEL=mimo-v2.5-pro
MIMO_BASE_URL=https://your-provider.example.com/v1
```

使用自定义 OpenAI-compatible 接口：

```bash
CUSTOM_LLM_BASE_URL=
CUSTOM_LLM_API_KEY=
CUSTOM_LLM_MODEL=
```

## 部署前检查

本地先跑：

```bash
npm run lint
npm test
npm run build
```

三项都通过后再推送。

## 重要限制

Chaos-Tester 的 API 路由会做两件耗时操作：

1. 调用大模型生成测试用例。
2. 遍历测试用例请求目标 API。

当前代码已经设置了生成和执行阶段的超时，适合 MVP、演示、小批量测试。如果将来要跑大规模测试，建议升级为：

- 前端：Vercel
- API 网关：Next.js API Route
- 测试执行器：独立 Node.js Worker
- 队列：Redis / BullMQ / Cloud Task
- 报告存储：PostgreSQL / Supabase / SQLite + object storage

## 什么时候不用 Vercel

如果你需要以下能力，建议部署到 Render、Railway、Fly.io 或自有服务器：

- 单次测试超过平台函数超时时间
- 需要固定出口 IP
- 需要访问内网测试环境
- 需要常驻队列 Worker
- 需要长连接、批量扫描或定时任务

## 生产安全建议

- 不要把 API Key 放进前端变量，避免使用 `NEXT_PUBLIC_` 前缀保存密钥。
- 只对授权目标发起测试。
- 给目标 API 设置限流。
- 在执行器层增加域名白名单后再开放给团队使用。
- 保留测试审计日志，方便追踪误操作。

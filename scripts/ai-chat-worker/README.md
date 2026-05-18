# AI 聊天 Worker 部署指南

## 简介

这是一个 Cloudflare Worker，用作 AI 聊天的后端代理。它的作用是：
- 隐藏你的 OpenAI API Key（不暴露在前端代码中）
- 处理 CORS 跨域
- 对 API 调用做限制和保护

## 前提条件

1. 一个 [Cloudflare](https://dash.cloudflare.com/) 账号（免费即可）
2. 一个 [OpenAI](https://platform.openai.com/) API Key
3. 安装 Node.js

## 部署步骤

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 进入 Worker 目录

```bash
cd scripts/ai-chat-worker
```

### 4. 设置 API Key（安全存储）

```bash
wrangler secret put OPENAI_API_KEY
# 会提示你输入 Key，输入后回车
```

### 5. 部署

```bash
wrangler deploy
```

部署成功后会得到一个 URL，类似：
```
https://ai-chat-sanju.your-name.workers.dev
```

### 6. 配置前端

在 `static/js/ai-chat.js` 中找到 `CONFIG.workerUrl`，填入你的 Worker URL：

```javascript
var CONFIG = {
  workerUrl: 'https://ai-chat-sanju.your-name.workers.dev',
  // ...
};
```

## .env 文件（本地开发用）

在项目根目录创建 `.env` 文件：

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

**重要：** `.env` 已经被 `.gitignore` 排除，不会被提交到 GitHub！

## 免费额度

Cloudflare Workers 免费计划：
- 每天 100,000 次请求
- 每个请求 10ms CPU 时间
- 完全够个人博客使用

## 切换其他 AI 模型

如果你想用 Claude API 代替 OpenAI，修改 `worker.js` 中的 API 调用即可。

## 问题排查

1. **CORS 错误**：检查 `wrangler.toml` 中的 `ALLOWED_ORIGIN` 是否正确
2. **401 错误**：API Key 可能过期，重新设置：`wrangler secret put OPENAI_API_KEY`
3. **本地测试**：`wrangler dev` 可以在本地启动 Worker

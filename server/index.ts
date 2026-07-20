// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — 生产服务器
//
// 一个进程完成两件事：
//   1. 服务 dist/ 静态文件（React SPA）
//   2. 代理 /api/ai/chat/completions → 智谱 API（附加 API Key）
//
// 启动：npm start
// ═══════════════════════════════════════════════════════════════════════

import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ── 加载 .env ──

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnv(): Record<string, string> {
  const envPath = path.join(__dirname, '..', '.env')
  const vars: Record<string, string> = {}

  try {
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      vars[key] = value
    }
  } catch {
    console.warn('[echo-diary] 未找到 .env 文件，使用系统环境变量')
  }

  return {
    ZHIPU_API_KEY: process.env.ZHIPU_API_KEY || vars.ZHIPU_API_KEY || '',
    ZHIPU_MODEL: process.env.ZHIPU_MODEL || vars.ZHIPU_MODEL || 'glm-4.5-air',
    PORT: process.env.PORT || vars.PORT || '3000',
  }
}

const ENV = loadEnv()

if (!ENV.ZHIPU_API_KEY) {
  console.error('[echo-diary] ❌ 未设置 ZHIPU_API_KEY')
  console.error('[echo-diary]   请在 .env 文件中配置或设置环境变量')
  process.exit(1)
}

// ── Express 应用 ──

const app = express()
const PORT = parseInt(ENV.PORT, 10)
const DIST_DIR = path.join(__dirname, '..', 'dist')

// 1. API 代理 — 转发到智谱，附加 API Key，透传 SSE 流式响应
app.use(
  '/api/ai/chat/completions',
  createProxyMiddleware({
    target: 'https://open.bigmodel.cn',
    changeOrigin: true,
    pathRewrite: {
      '^/api/ai/chat/completions': '/api/paas/v4/chat/completions',
    },
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader('Authorization', `Bearer ${ENV.ZHIPU_API_KEY}`)
      },
      error: (_err, _req, res) => {
        // 代理出错时返回 502
        const srvRes = res as unknown as express.Response
        if (srvRes && typeof srvRes.status === 'function' && !srvRes.headersSent) {
          srvRes.status(502).json({
            error: { message: 'AI 服务暂不可用，请稍后重试' },
          })
        }
      },
    },
    // 超时设置：AI 流式响应可能较长
    proxyTimeout: 120_000,
    timeout: 120_000,
  }),
)

// 2. 静态文件服务
app.use(express.static(DIST_DIR, {
  maxAge: '1h', // 静态资源缓存 1 小时
  etag: true,
}))

// 3. SPA fallback — 所有非 API / 非静态文件路径返回 index.html
app.use((_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

// ── 启动 ──

app.listen(PORT, () => {
  console.log('[echo-diary] ✅ 服务器已启动')
  console.log(`[echo-diary]    地址: http://localhost:${PORT}`)
  console.log(`[echo-diary]    智谱模型: ${ENV.ZHIPU_MODEL}`)
  console.log(`[echo-diary]    API 代理: /api/ai/chat/completions → open.bigmodel.cn`)
})

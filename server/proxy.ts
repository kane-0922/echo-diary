// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — 后端代理服务器（生产模式）
//
// 用途：在浏览器和智谱 API 之间做一层代理，API Key 仅存于服务端。
//
// 启动：npx tsx server/proxy.ts
// 然后：npx vite preview（或 serve dist/）
// 前端调用 POST /api/ai/chat → 此代理附加 Authorization 头 → 智谱 API
//
// 零外部依赖 — 仅使用 Node.js 内置的 http / https / fs 模块。
// ═══════════════════════════════════════════════════════════════════════

import http from 'node:http'
import https from 'node:https'
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
      // 跳过空行和注释
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      vars[key] = value
    }
  } catch {
    console.warn('[proxy] 未找到 .env 文件，尝试使用系统环境变量')
  }

  // 系统环境变量优先级更高
  return {
    ZHIPU_API_KEY: process.env.ZHIPU_API_KEY || vars.ZHIPU_API_KEY || '',
    ZHIPU_MODEL: process.env.ZHIPU_MODEL || vars.ZHIPU_MODEL || 'glm-4.5-air',
    PORT: process.env.PORT || vars.PORT || '3001',
  }
}

const ENV = loadEnv()

if (!ENV.ZHIPU_API_KEY) {
  console.error('[proxy] ❌ 未设置 ZHIPU_API_KEY，请在 .env 文件中配置或设置环境变量')
  process.exit(1)
}

// ── 智谱 API 配置 ──

const ZHIPU_HOST = 'open.bigmodel.cn'
const ZHIPU_PATH = '/api/paas/v4/chat/completions'

// ── CORS 头 ──

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// ── 代理请求处理 ──

function proxyRequest(
  clientReq: http.IncomingMessage,
  clientRes: http.ServerResponse,
): void {
  // 只接受 POST /api/ai/chat/completions
  if (clientReq.method !== 'POST' || clientReq.url !== '/api/ai/chat/completions') {
    clientRes.writeHead(404, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
    clientRes.end(JSON.stringify({ error: { message: 'Not Found' } }))
    return
  }

  // 收集请求体
  const chunks: Buffer[] = []
  clientReq.on('data', (chunk: Buffer) => chunks.push(chunk))
  clientReq.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf-8')

    // 转发到智谱 API
    const options: https.RequestOptions = {
      hostname: ZHIPU_HOST,
      path: ZHIPU_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ENV.ZHIPU_API_KEY}`,
        'Content-Length': Buffer.byteLength(body).toString(),
      },
    }

    const proxyReq = https.request(options, (proxyRes) => {
      // 透传状态码和 SSE/JSON 相关头
      const headers: Record<string, string> = {
        ...CORS_HEADERS,
        'Content-Type': proxyRes.headers['content-type'] || 'application/json',
        'Cache-Control': 'no-cache',
      }
      clientRes.writeHead(proxyRes.statusCode || 200, headers)

      // 流式透传响应体
      proxyRes.pipe(clientRes)
    })

    proxyReq.on('error', (err) => {
      console.error('[proxy] 转发请求失败:', err.message)
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
        clientRes.end(JSON.stringify({ error: { message: `代理请求失败: ${err.message}` } }))
      }
    })

    // 设置请求超时
    proxyReq.setTimeout(120_000, () => {
      proxyReq.destroy()
      if (!clientRes.headersSent) {
        clientRes.writeHead(504, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
        clientRes.end(JSON.stringify({ error: { message: '请求超时' } }))
      }
    })

    proxyReq.write(body)
    proxyReq.end()
  })
}

// ── 启动服务器 ──

const PORT = parseInt(ENV.PORT, 10)

const server = http.createServer((req, res) => {
  // 处理 CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  proxyRequest(req, res)
})

server.listen(PORT, () => {
  console.log(`[proxy] ✅ EchoDiary 代理服务器已启动`)
  console.log(`[proxy]    地址: http://localhost:${PORT}`)
  console.log(`[proxy]    智谱模型: ${ENV.ZHIPU_MODEL}`)
  console.log(`[proxy]    转发目标: https://${ZHIPU_HOST}${ZHIPU_PATH}`)
  console.log(`[proxy]    前端请将 API 请求发往 http://localhost:${PORT}/api/ai/chat/completions`)
})

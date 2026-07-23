// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Vercel Edge Function
// 代理 POST /api/ai/chat/completions → 智谱 API
//
// Vercel 根据 api/ 目录自动路由：
//   api/ai/chat/completions.js → /api/ai/chat/completions
//
// 使用 Edge Runtime：支持 SSE 流式透传，适合 AI 聊天打字机效果
// ═══════════════════════════════════════════════════════════════════════

export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  // 只接受 POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: { message: 'Method Not Allowed' } }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  try {
    // 读取前端发来的请求体（完整透传给智谱 API）
    const body = await request.text()

    // 转发到智谱 API
    const response = await fetch(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ZHIPU_API_KEY}`,
        },
        body,
      },
    )

    // 透传响应（支持 SSE 流式 + 普通 JSON）
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('Content-Type') || 'application/json',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: { message: `AI 服务暂不可用：${err.message}` },
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

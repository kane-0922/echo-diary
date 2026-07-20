// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — EdgeOne Pages Edge Function
// 代理 /api/ai/chat/completions → 智谱 API
//
// EdgeOne Pages 根据文件路径自动路由：
//   edge-functions/api/ai/chat/completions.js → /api/ai/chat/completions
//
// ⚠️ EdgeOne 免费套餐函数执行超时约 30s，极长的 AI 回复可能被截断
// ═══════════════════════════════════════════════════════════════════════

export default async function onRequest(context) {
  const { request, env } = context

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
    // 读取前端发来的请求体
    const body = await request.text()

    // 转发到智谱 API
    const response = await fetch(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.ZHIPU_API_KEY}`,
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

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 只加载 ZHIPU_ 前缀的环境变量，避免泄露
  const env = loadEnv(mode, process.cwd(), 'ZHIPU_')

  return {
    plugins: [react(), cloudflare()],

    // 开发模式：代理 /api/ai/* → 智谱 API
    server: {
      proxy: {
        '/api/ai': {
          target: 'https://open.bigmodel.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ai/, '/api/paas/v4'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.ZHIPU_API_KEY) {
                proxyReq.setHeader('Authorization', `Bearer ${env.ZHIPU_API_KEY}`)
              }
            })
          },
        },
      },
    },
  };
})
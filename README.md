**在线地址**：https://echo-diary-iota.vercel.app （注：国内访问需要科学上网）

# EchoDiary — AI 聊天日记

与 AI 伙伴 Echo 聊天，对话自动生成温暖日记。把每天的碎碎念变成值得回味的文字。

## 功能

- **AI 对话** — 与 Echo 自由聊天，AI 流式逐字回复，打字机效果
- **一键生成日记** — 基于聊天内容，AI 自动生成结构化日记（标题、正文、洞察、心情）
- **日记管理** — 编辑、搜索、排序、导出 Markdown
- **心情标签** — 6 种心情（开心/平静/思考/兴奋/难过/生气），自动建议 + 手动选择
- **多会话** — 支持多个对话窗口，侧边栏切换
- **纯本地存储** — 数据存于浏览器 localStorage，不上传任何服务器

## 技术栈

| 层面     | 技术                                                       |
| -------- | ---------------------------------------------------------- |
| 前端框架 | React 19 + TypeScript                                      |
| 构建工具 | Vite                                                       |
| 路由     | React Router v7                                            |
| 样式     | CSS Modules + CSS 自定义属性                               |
| AI 服务  | 智谱 GLM-4.5-Air（兼容 OpenAI 格式）                       |
| 数据存储 | localStorage                                               |
| 部署     | 静态文件 + Edge Function（EdgeOne Pages） / Express 服务器 |

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量（复制 .env.example 为 .env，填入智谱 API Key）
cp .env.example .env

# 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:5173`，即可与 Echo 对话。

## 项目结构

```
echo-diary/
├── src/
│   ├── ai/             # AI 服务层（接口 + 智谱实现 + Mock + 提示词）
│   ├── components/     # UI 组件（chat/ diary/ shared/）
│   ├── contexts/       # React Context 状态管理
│   ├── hooks/          # 自定义 Hooks
│   ├── services/       # 存储服务（localStorage）
│   ├── styles/         # 全局样式 + 设计 Token
│   ├── types/          # TypeScript 类型定义
│   └── utils/          # 工具函数
├── server/             # 生产服务器（Express，VPS/Render 部署用）
├── edge-functions/     # EdgeOne Pages Edge Function（代理 AI 请求）
├── public/             # 静态资源
└── dist/               # 构建产物
```

## 部署

### EdgeOne Pages（推荐，免费，国内可正常访问）

1. 在 EdgeOne Pages 创建项目，连接 Git 仓库
2. 配置：
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **环境变量**: `ZHIPU_API_KEY` = 你的智谱 API Key
3. 部署

### 本地生产模式

```bash
npm run build   # TypeScript 类型检查 + Vite 构建
npm start       # 启动 Express 服务器（localhost:3000）
```

## 架构

```
浏览器 (React SPA)
    │
    ├── 静态资源 (HTML/CSS/JS) ← 从 CDN 或 Express 获取
    │
    └── POST /api/ai/chat/completions
         ↓
       代理层 (Edge Function / Express 代理 / Vite dev proxy)
         ↓  附加 Authorization: Bearer <API_KEY>
       智谱 API (GLM-4.5-Air, open.bigmodel.cn)
         ↓  SSE 流式响应 / JSON 响应
       前端 AsyncGenerator 逐字渲染
```

AI 服务层使用接口抽象，`src/ai/index.ts` 一行代码即可切换实现（智谱/Mock/OpenAI/Claude）。

## License

MIT

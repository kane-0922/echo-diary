# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目背景

- **开发者是中文母语者**，代码注释使用中文
- **目标用户为中文用户**，所有 UI 文案、提示词、文档均使用中文
- Echo 的人设、日记内容、心情标签等均为中文语境

## 常用命令

```bash
npm run dev       # 启动 Vite 开发服务器（HMR，localhost:5173）
npm run build     # TypeScript 类型检查 (tsc -b) + Vite 生产构建
npm run preview   # 本地预览生产构建
npm run lint      # Oxlint（React + TypeScript + OXC 插件）
```

`npx tsc --noEmit` 可单独运行类型检查，不触发构建。

## 项目架构

EchoDiary 是一个纯客户端 AI 日记伴侣应用——用户与 "Echo" 对话聊天，并可将对话生成日记。一切运行在浏览器中，无后端、无数据库。

### 路由表

| 路由 | 页面 | 用途 |
|---|---|---|
| `/chat` | `ChatPage` | 核心流式聊天界面 |
| `/diary/:id/edit` | `DiaryEditPage` | 编辑标题/正文/心情，保存/删除/导出 |
| `/diaries` | `DiaryListPage` | 搜索/排序日记卡片，含骨架屏/空状态 |
| `*` | → 重定向至 `/chat` | |

### AI 服务层（`src/ai/`）—— 最重要的架构决策

AI 层采用 **抽象接口 + AsyncGenerator 模式**，Mock 和真实 AI 实现共享完全相同的函数签名。UI 通过 `for await (const chunk of aiService.chatStream(messages))` 消费，无论背后是什么实现。

```
AiService 接口 (src/ai/types.ts)
  ├── chatStream()  → AsyncGenerator<ChatStreamChunk>  （流式，用于打字机效果）
  ├── generateDiary() → Promise<DiaryGeneration>        （非流式，一次性返回）
  └── generateInsight() → Promise<string>               （非流式）

createAiService() (src/ai/index.ts)
  └── 当前返回 mockAiService —— 一行代码即可切换为真实 AI

Mock 实现 (src/ai/mockAiService.ts)
  └── 12 套模板分类，关键词匹配，~30ms/字流式输出，带自然停顿
```

**切换到真实 AI 的方式：** 新建文件（如 `claudeService.ts`）实现 `AiService` 接口，修改 `createAiService()` 返回它。UI 代码无需任何修改。

`src/ai/prompts/` 存放 Echo 的人设系统提示词——当前供 Mock 参考，未来直接作为发给 LLM 的系统提示词。

### 状态管理（`src/contexts/AppContext.tsx`）

集中式状态使用 **Context + useReducer** + 持久化中间件：

```
AppState { chatSessions, activeChatId, diaryEntries, sidebarOpen, toasts }
    ↓
17 种 action 类型（CREATE_SESSION, SEND_MESSAGE, APPEND_TO_LAST_AI_MESSAGE, SAVE_DIARY 等）
    ↓
持久化中间件：useEffect 监听 state → 自动存入 localStorage
    ↓
启动水合：loadAll() → HYDRATE action（首次访问自动创建欢迎会话）
```

`toasts` 是临时的——不参与持久化，HYDRATE 时重置为 `[]`。

`actions` 上绑定 13 个 action creator（`AppActions` 接口）——组件调用 `actions.sendMessage(id, text)`，而非手动构建 action 对象。

### 存储服务（`src/services/storageService.ts`）

```
StorageService 接口（14 个异步方法）
    └── LocalStorageService（当前实现）
        ├── safeGet/safeSet/safeRemove 包装函数，含配额处理
        └── getStorageService() 单例 + setStorageService() 注入
```

所有方法均为异步——`saveAll()` 由 AppContext 持久化中间件自动调用；组件永远不直接接触存储层。

### 流式聊天流程

```
1. 用户输入消息 → handleSend(content)
2. Dispatch SEND_MESSAGE，携带用户消息
3. Dispatch SEND_MESSAGE，携带 AI 占位消息（content: ''）
4. for await (const chunk of aiService.chatStream(messages)) {
5.   dispatch APPEND_TO_LAST_AI_MESSAGE(sessionId, chunk.delta)
6. }
7. 出错时：设置错误状态 + 弹出 toast
```

`APPEND_TO_LAST_AI_MESSAGE` reducer 找到最后一条 AI 消息并追加 `delta`——每个字符触发一次状态更新和重渲染，产生打字机效果。

### CSS 架构

```
styles/variables.css  → 设计 Token（颜色、间距、阴影、圆角、断点、z-index 层级）
styles/global.css     → Reset、排版、滚动条、reduced-motion、页面 fadeIn 动画
styles/responsive.css → App shell 布局、断点行为（<1024px 侧边栏变抽屉）
```

三个断点：**640px / 768px / 1024px**。侧边栏在桌面端（≥1024px）为固定 320px，平板/手机端为滑出抽屉。

设计 Token：暖棕色日记主色（`#944a19`），靛蓝紫点缀色（`#6366F1`），Varela Round（标题）+ Nunito Sans（正文），Google Fonts 加载。

### 样式约定

组件使用 **CSS Modules** 和 **CSS 组合**（`composes: baseClass`）。不使用 CSS-in-JS。共享组件样式与 `.tsx` 文件同目录。所有设计值引用 CSS 自定义属性——禁止硬编码颜色或间距。

### 关键类型（`src/types/index.ts`）

- `Mood` — 6 值联合类型（"开心" | "平静" | "思考" | "兴奋" | "难过" | "生气"）
- `MOOD_EMOJI` / `MOOD_LABEL` — 查找映射表
- `Message` — `{ id, role: 'user'|'ai', content, timestamp }`
- `ChatSession` — `{ id, title, messages[], createdAt, updatedAt }`
- `DiaryEntry` — `{ id, chatSessionId, title, date, mood, content, aiInsight, createdAt, updatedAt }`
- `AppState` — `{ chatSessions[], activeChatId, diaryEntries[], sidebarOpen, toasts[] }`
- `AppAction` — 可辨识联合，17 种变体

### 共享组件

- `ConfirmDialog` — 类 portal 弹窗，Escape/点击遮罩关闭，danger 变体，自动聚焦确认按钮
- `Toast` / `ToastContainer` — 滑入式通知，4 种语义类型，自动消失（默认 3s）
- `Skeleton` — 闪烁占位符，4 种预设（text/card/circle/title）
- `EmptyState` — 居中图标+标题+描述+CTA，DiaryListPage 使用
- `DecorativeBlur` — 氛围背景圆形，`pointer-events: none`
- `SearchBar` — 防抖输入框，带图标和清除按钮（DiaryListPage 使用）

### Hooks

- `useDebounce<T>(value, delayMs=300)` — 泛型防抖，用于搜索
- `useAutoScroll()` — 返回 `{ containerRef, scrollToBottom }`，检测手动上滚暂停自动滚动
- `useApp()` — context 访问器，在 `<AppProvider>` 外使用抛出异常

### 工具函数

- `generateId(prefix?)` — 时间+随机数，URL 安全（约 12 字符）
- `nowISO()` / `todayDate()` — ISO 时间戳辅助函数
- `diaryToMarkdown()` + `downloadFile()` 位于 `exportService.ts`

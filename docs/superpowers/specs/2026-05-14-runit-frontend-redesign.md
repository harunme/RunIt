# RunIt 前端配置化改造设计

## 概述

将 RunIt 改造成完整的 Web 应用，支持：
- 用户注册登录
- 所有配置项前端化（数据源、Agent、LLM Provider、发布平台）
- 采集内容存入数据库并支持前端查看

## 技术栈

| 组件 | 技术选型 |
|------|----------|
| 后端 | FastAPI + SQLAlchemy (已有) |
| 前端 | Next.js (已有) |
| 认证 | JWT Token |
| 样式 | Tailwind CSS |

## 数据库变更

### 新增 Content 表

```sql
CREATE TABLE contents (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id),
    source_id TEXT REFERENCES data_sources(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,          -- 原始内容
    url TEXT,
    author TEXT,
    published_at TEXT,
    metadata TEXT,                  -- JSON
    created_at DATETIME DEFAULT NOW(),
    UNIQUE(source_id, url)
);
```

### 新增 User 表

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME
);
```

## API 设计

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/auth/me` | 当前用户 |

### 内容

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/content` | 内容列表 (分页) |
| GET | `/api/content/{id}` | 内容详情 |
| DELETE | `/api/content/{id}` | 删除内容 |

### 其他配置 (需登录)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/sources` | 数据源 CRUD |
| GET/POST | `/api/agents` | Agent CRUD |
| GET/POST | `/api/publishers` | 发布平台 CRUD |
| GET/POST | `/api/llm/providers` | LLM Provider CRUD |
| GET/PUT | `/api/settings` | 系统设置 (Obsidian 路径等) |

## 页面结构

### 未登录
- `/login` - 登录页
- `/register` - 注册页

### 已登录 (Dashboard 唯一入口)

```
Dashboard (/)
├── 统计概览 (4 个数字卡片)
├── 模块快捷入口 (5 个卡片)
│   ├── Content (内容管理)
│   ├── Sources (数据源)
│   ├── Agents (AI 策略)
│   ├── Publishers (发布平台)
│   └── Settings (系统设置)
└── 最近任务列表
```

### 子页面

| 页面 | 路径 |
|------|------|
| 内容列表 | `/content` |
| 数据源列表 | `/sources` |
| 新建数据源 | `/sources/new` |
| 编辑数据源 | `/sources/[id]/edit` |
| Agent 列表 | `/agents` |
| 新建 Agent | `/agents/new` |
| 编辑 Agent | `/agents/[id]/edit` |
| 发布平台 | `/publishers` |
| 系统设置 | `/settings` |

## 组件结构

### 共享组件
- `Layout` - 页面布局 (Logo、用户信息)
- `Sidebar` - 侧边导航 (卡片式入口)
- `StatCard` - 统计卡片
- `DataTable` - 数据表格 (列表页)
- `FormModal` - 表单弹窗

### 表单页面
每个配置模块 (Sources/Agents/Publishers) 需实现：
- 列表页 (表格 + 新建按钮)
- 新建页 (表单)
- 编辑页 (表单，预填充数据)

## 页面详细设计

### 1. Dashboard (`/`)

```tsx
// 布局
<div>
  <header>Logo + 用户信息</header>
  <main>
    <StatsRow />  // 4 个统计卡片
    <ModuleCards />  // 5 个模块卡片
    <RecentTasks />  // 最近任务表格
  </main>
</div>

// StatsRow
[ Sources: 3 ] [ Tasks: 42 ] [ Providers: 2 ] [ Publishers: 1 ]

// ModuleCards
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│  Content   │ │  Sources   │ │   Agents   │ │ Publishers │ │  Settings  │
│   内容     │ │   数据源    │ │  AI 策略   │ │   发布平台  │ │   设置     │
└────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘
```

### 2. 内容页 (`/content`)

```tsx
// 表格列
| 标题 | 来源 | 时间 | 操作 |

// 操作
- 查看详情 (Modal)
- 删除
```

### 3. 数据源页 (`/sources`)

```tsx
// 列表页
| 名称 | 类型 | 定时 | 状态 | 操作 |

// 操作
- 立即运行
- 编辑 (跳转 /sources/[id]/edit)
- 删除

// 新建/编辑表单字段
- 名称 (文本框)
- 类型 (下拉: rss/github/twitter)
- 配置 (JSON 编辑器或表单字段)
  - RSS: url, max_items
  - GitHub: username, token
  - Twitter: bearer_token, source
- 定时 (Cron 表达式)
- 关联 Agent (下拉选择)
- 启用 (开关)
```

### 4. Agent 页 (`/agents`)

```tsx
// 新建/编辑表单字段
- 名称
- 源类型 (下拉: rss/github/twitter)
- 关联 LLM Provider (下拉选择)
- Prompt 模板 (文本框)
- 输出格式 (markdown/html/image)
```

### 5. 设置页 (`/settings`)

```tsx
// LLM Provider 列表
| 名称 | Provider | 模型 | 默认 | 操作 |
+ 添加 Provider

// Provider 表单字段
- 名称
- Provider 类型 (openai/anthropic/ollama)
- API Key
- Base URL (可选)
- 模型名称
- 默认参数 (可选)

# 备份设置
- Obsidian 路径
```

## 认证流程

1. 用户注册 → 创建 User 记录
2. 用户登录 → 返回 JWT Token
3. 前端存储 Token (localStorage)
4. 后续请求携带 `Authorization: Bearer <token>`
5. 后端验证 Token 获取用户 ID

### JWT 配置
- 有效期: 7 天
- 加密: HS256
- Payload: `{ user_id, email, exp }`

## 部署更新

新增环境变量:
```
JWT_SECRET=<随机字符串>
```

## 实现优先级

1. **Phase 1: 认证** - 注册/登录 + JWT
2. **Phase 2: 数据库** - 新增 User/Content 表
3. **Phase 3: 内容页** - 内容列表/详情
4. **Phase 4: 配置页** - Sources/Agents/Publishers 表单
5. **Phase 5: 设置页** - LLM Provider + Obsidian 路径

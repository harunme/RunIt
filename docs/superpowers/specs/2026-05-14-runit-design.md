# RunIt - 内容聚合与社交媒体发布系统

## 概述

一个基于 AI 的内容聚合系统，从多个数据源（GitHub Stars、Twitter、RSS）采集内容，通过 LangGraph Agent 处理后发布到社交媒体平台（Twitter、小红书、微信），支持 24/7 服务器部署。

## 技术栈

| 组件 | 技术选型 | 说明 |
|------|----------|------|
| 后端 | FastAPI + SQLAlchemy | 异步 API + 数据库 ORM |
| 调度 | APScheduler | 内置定时任务 |
| AI | LangChain + LangGraph | Agent 编排，必选 Claude + OpenAI |
| 追踪 | Langfuse | LLM 调用追踪和指标 |
| 前端 | Next.js | Web 管理界面 |
| 存储 | SQLite + 本地文件 | 配置、任务、备份 |
| 部署 | Docker Compose | 服务器部署 |

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Web UI                          │
│              (配置管理、任务监控、内容预览)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP API
┌─────────────────────▼───────────────────────────────────────┐
│                     FastAPI Backend                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  API     │  │ Scheduler│  │  Worker  │  │  Agent   │   │
│  │  Routes  │──│  (AP)    │──│  (Async) │──│  (LG)    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       │                                        │           │
│       ▼                                        ▼           │
│  ┌──────────┐        ┌──────────┐      ┌──────────┐       │
│  │ SQLite   │        │ Langfuse │◄────│   LLM    │       │
│  └──────────┘        │  Client  │      └──────────┘       │
│                     └──────────┘                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Local Storage                              │
│   content/     ← AI处理后的内容（Obsidian格式）               │
│   images/     ← 生成/下载的图片                              │
│   backup/     ← 定期备份到指定目录                            │
└─────────────────────────────────────────────────────────────┘
```

## 数据模型

### LLMProvider

LLM 提供商配置，支持多 provider 切换。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | string | 显示名称 |
| provider | enum | openai / anthropic / ollama / siliconflow |
| api_key | string | 加密存储 |
| base_url | string | 代理地址或自托管地址 |
| model | string | 模型名称 |
| default_params | JSON | temperature, max_tokens 等 |
| enabled | boolean | 开关 |
| is_default | boolean | 是否默认 provider |

### Agent

AI 处理策略定义，关联具体数据源和 LLM。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | string | 显示名称 |
| source_type | enum | github / twitter / rss |
| llm_provider_id | UUID | 关联的 LLM Provider |
| prompt_template | text | 处理 prompt 模板 |
| output_format | enum | markdown / html / image_params |
| config | JSON | 自定义配置 |

### DataSource

数据源配置，关联 Agent。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | string | 显示名称 |
| type | enum | github / twitter / rss |
| config | JSON | API keys、认证信息、过滤条件 |
| agent_id | UUID | 关联的 Agent |
| schedule | string | Cron 表达式 |
| enabled | boolean | 开关 |
| last_run_at | datetime | 上次运行时间 |

### Task

任务执行记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| source_id | UUID | 数据源 ID |
| status | enum | pending / running / completed / failed |
| raw_content | text | 原始内容 |
| processed_content | text | AI 处理结果 |
| images | JSON | 生成/下载的图片列表 |
| error_message | text | 错误信息 |
| created_at | datetime | 创建时间 |
| started_at | datetime | 开始时间 |
| completed_at | datetime | 完成时间 |

### Publisher

发布平台配置。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | string | 显示名称 |
| type | enum | twitter / xiaohongshu / wechat |
| credentials | JSON | API keys、token 等 |
| enabled | boolean | 开关 |

### PublishedItem

已发布内容记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| task_id | UUID | 关联任务 |
| publisher_id | UUID | 发布平台 |
| external_id | string | 平台返回的 ID |
| external_url | string | 平台返回的链接 |
| published_at | datetime | 发布时间 |

## 目录结构

```
runit/
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.web
├── .env.example
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── config.py            # 配置加载
│   │   ├── database.py          # 数据库连接
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── api/
│   │   │   ├── sources.py       # 数据源 CRUD
│   │   │   ├── agents.py        # Agent CRUD
│   │   │   ├── tasks.py         # 任务管理
│   │   │   ├── publishers.py    # 发布平台
│   │   │   └── llm.py           # LLM 配置
│   │   ├── sources/             # 数据源接入
│   │   │   ├── base.py          # 抽象基类
│   │   │   ├── github/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── client.py
│   │   │   │   └── models.py
│   │   │   ├── twitter/
│   │   │   └── rss/
│   │   ├── agents/              # LangGraph agents
│   │   │   ├── github_star/
│   │   │   │   ├── graph.py
│   │   │   │   ├── prompts.py
│   │   │   │   └── nodes.py
│   │   │   ├── twitter/
│   │   │   └── rss/
│   │   ├── publishers/          # 发布平台适配器
│   │   │   ├── base.py
│   │   │   ├── twitter.py
│   │   │   ├── xiaohongshu.py
│   │   │   └── wechat.py
│   │   ├── storage/             # 本地存储
│   │   │   ├── content.py       # 内容存储
│   │   │   ├── images.py        # 图片管理
│   │   │   └── backup.py        # 备份到 Obsidian 目录
│   │   ├── worker/              # 后台任务
│   │   │   ├── scheduler.py     # APScheduler 调度
│   │   │   └── executor.py      # 任务执行器
│   │   └── llm/                 # LLM 封装
│   │       ├── providers.py
│   │       └── langfuse.py
│   └── requirements.txt
│
├── web/                          # Next.js 前端
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── sources/
│   │   │   ├── agents/
│   │   │   ├── tasks/
│   │   │   └── settings/
│   │   ├── components/
│   │   └── lib/
│   ├── package.json
│   └── ...
│
└── data/                          # Docker volume
    ├── runit.db
    ├── content/
    └── images/
```

## 核心流程

### 任务执行流程

```
定时触发
    │
    ▼
采集数据源 (sources/)
    │
    ▼
解析内容 → 路由到对应 Agent
    │
    ▼
LangGraph 执行 Agent (agents/)
    │
    ├── 获取原始内容
    ├── 调用 LLM (Claude/OpenAI)
    ├── 按 prompt 处理
    └── 输出格式化内容
    │
    ▼
保存到本地 (storage/)
    │
    ├── content/ - 原始和处理后的内容
    ├── images/  - 生成的图片
    └── backup/  - 备份到 Obsidian 目录
    │
    ▼
发布到平台 (publishers/)
    │
    ▼
记录结果 (PublishedItem)
```

### Agent Graph 结构 (LangGraph)

每个数据源的 Agent 是独立的 LangGraph：

```python
# agents/github_star/graph.py
def create_github_star_graph():
    return StateGraph(AgentState) \
        .add_node("fetch", fetch_starred_repos) \
        .add_node("analyze", analyze_repo) \
        .add_node("generate", generate_content) \
        .add_edge(START, "fetch") \
        .add_edge("fetch", "analyze") \
        .add_edge("analyze", "generate") \
        .add_edge("generate", END)
```

## API 设计

### 数据源

- `GET /api/sources` - 列表
- `POST /api/sources` - 创建
- `GET /api/sources/{id}` - 详情
- `PUT /api/sources/{id}` - 更新
- `DELETE /api/sources/{id}` - 删除
- `POST /api/sources/{id}/run` - 手动触发

### Agent

- `GET /api/agents` - 列表
- `POST /api/agents` - 创建
- `PUT /api/agents/{id}` - 更新
- `DELETE /api/agents/{id}` - 删除

### 任务

- `GET /api/tasks` - 列表（支持分页、状态过滤）
- `GET /api/tasks/{id}` - 详情
- `POST /api/tasks/{id}/retry` - 重试

### LLM 配置

- `GET /api/llm/providers` - 列表
- `POST /api/llm/providers` - 创建
- `PUT /api/llm/providers/{id}` - 更新
- `DELETE /api/llm/providers/{id}` - 删除
- `POST /api/llm/providers/test` - 测试连接

### 发布平台

- `GET /api/publishers` - 列表
- `POST /api/publishers` - 创建
- `PUT /api/publishers/{id}` - 更新
- `DELETE /api/publishers/{id}` - 删除

## 部署

### 环境变量

```env
# Database
DATABASE_URL=sqlite:///data/runit.db

# LLM Providers (必选)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Langfuse
LANGFUSE_HOST=https://cloud.langfuse.com
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=

# Backup
BACKUP_DIR=/app/backup
LOCAL_OBSIDIAN_PATH=/backup/obsidian

# Scheduler
SCHEDULER_ENABLED=true
```

### 启动命令

```bash
# 开发
docker-compose up -d

# 重新构建
docker-compose up -d --build

# 查看日志
docker-compose logs -f backend
```

## 依赖说明

- **Claude (必选)** - Anthropic API，Agent 的主要 LLM
- **OpenAI** - 备用 LLM，可选
- **Langfuse** - 追踪 LLM 调用，可自托管或用云服务

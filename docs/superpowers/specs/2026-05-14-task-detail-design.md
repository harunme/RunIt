# 任务详情页设计

## 概述

为 RunIt 应用添加独立的「任务列表页」，支持点击查看任务详情、日志和关联内容。

## 背景

当前系统缺乏任务管理的可视化界面，任务信息仅通过 DataSource 的 `last_run_at` 字段展示。用户无法查看任务的执行状态、日志和结果内容。新功能将提供完整的任务可观测性。

## 功能需求

### 页面结构
- `/tasks` - 独立的任务列表页
- 点击任务行 → 弹出 `TaskDetailModal` 模态框

### 任务列表
- 表格展示：来源 | 状态 | 创建时间 | 耗时 | 操作
- 支持状态筛选（pending/running/completed/failed）
- 分页展示

### 任务详情弹窗（3个 Tab）

| Tab | 内容 |
|-----|-----|
| 基本信息 | 状态、创建时间、开始时间、完成时间、耗时、错误信息 |
| 执行日志 | 分页展示任务执行日志，支持 ERROR 级别高亮 |
| 关联内容 | 该任务收集的内容条目列表 |

### 日志系统
- 新增 `task_logs` 表存储日志
- 执行器在关键步骤写入日志
- 支持按 level 筛选

## 数据模型

### 新增 TaskLog 表

| 字段 | 类型 | 说明 |
|-----|-----|-----|
| id | UUID | 主键 |
| task_id | String | 外键 -> tasks.id |
| level | String | INFO / WARNING / ERROR |
| message | String | 日志内容 |
| created_at | DateTime | 创建时间 |

### API 变更

| 方法 | 路径 | 说明 |
|-----|-----|-----|
| GET | /api/tasks | 获取任务列表（已有，验证字段完整） |
| GET | /api/tasks/{task_id} | 获取任务详情（已有） |
| GET | /api/tasks/{task_id}/logs | 获取任务日志（新增） |
| GET | /api/tasks/{task_id}/contents | 获取任务关联内容（新增） |

## 前端组件

| 组件 | 路径 | 职责 |
|-----|-----|-----|
| TasksPage | `web/src/app/tasks/page.tsx` | 任务列表页容器 |
| TaskTable | `web/src/components/tasks/TaskTable.tsx` | 任务表格组件 |
| TaskDetailModal | `web/src/components/tasks/TaskDetailModal.tsx` | 详情弹窗（3个Tab） |
| TaskLogViewer | `web/src/components/tasks/TaskLogViewer.tsx` | 日志查看器 |

## 执行器变更

在 `executor.py` 中，关键步骤写入日志：

```python
# 任务开始
await self.log_task_event(task_id, "INFO", f"开始执行数据源: {source.name}")

# 获取条目
await self.log_task_event(task_id, "INFO", f"获取到 {len(items)} 个条目")

# 内容保存
await self.log_task_event(task_id, "INFO", f"已保存内容: {item.title}")

# 错误处理
await self.log_task_event(task_id, "ERROR", f"处理失败: {str(e)}")
```

## 技术决策

- 日志表设计：轻量级，task_id + level + message，便于查询和过滤
- 详情弹窗：避免路由跳转，保持 SPA 体验流畅
- 日志分页：大任务可能产生大量日志，支持分页避免性能问题

## 实现顺序

1. 后端：TaskLog 模型和 API
2. 后端：修改 executor 写入日志
3. 前端：TasksPage + TaskTable
4. 前端：TaskDetailModal + 3个Tab

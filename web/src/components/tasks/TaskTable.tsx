"use client";

import { Task } from "@/lib/api";

interface TaskTableProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export function TaskTable({ tasks, onTaskClick }: TaskTableProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return "-";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              状态
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              创建时间
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              开始时间
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              耗时
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              错误信息
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status]}`}
                >
                  {task.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDate(task.created_at)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDate(task.started_at)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDuration(task.started_at, task.completed_at)}
              </td>
              <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate">
                {task.error_message || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

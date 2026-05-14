"use client";

import { useState, useEffect } from "react";
import { api, TaskLog } from "@/lib/api";

interface TaskLogViewerProps {
  taskId: string;
}

const levelColors = {
  INFO: "text-blue-600",
  WARNING: "text-yellow-600",
  ERROR: "text-red-600",
};

export function TaskLogViewer({ taskId }: TaskLogViewerProps) {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchLogs();
  }, [taskId, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.tasks.getLogs(taskId, { page, page_size: pageSize });
      setLogs(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto font-mono text-sm">
        {loading ? (
          <div className="p-4 text-gray-500">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="p-4 text-gray-500">暂无日志</div>
        ) : (
          <div className="p-2">
            {logs.map((log) => (
              <div key={log.id} className="py-1 flex gap-2">
                <span className="text-gray-400 shrink-0">
                  {formatTime(log.created_at)}
                </span>
                <span className={`shrink-0 font-medium ${levelColors[log.level]}`}>
                  [{log.level}]
                </span>
                <span className="text-gray-700 break-all">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50">
          <span className="text-sm text-gray-500">
            第 {page} 页，共 {totalPages} 页
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

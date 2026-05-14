"use client";

import { useState, useEffect } from "react";
import { api, TaskContent, Task } from "@/lib/api";
import { TaskLogViewer } from "./TaskLogViewer";

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

type TabType = "info" | "logs" | "contents";

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [contents, setContents] = useState<TaskContent[]>([]);
  const [contentsPage, setContentsPage] = useState(1);
  const [contentsTotal, setContentsTotal] = useState(0);
  const [loadingContents, setLoadingContents] = useState(false);

  useEffect(() => {
    if (activeTab === "contents") {
      fetchContents();
    }
  }, [activeTab, contentsPage]);

  const fetchContents = async () => {
    setLoadingContents(true);
    try {
      const data = await api.tasks.getContents(task.id, { page: contentsPage, page_size: 10 });
      setContents(data.items);
      setContentsTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch contents:", error);
    } finally {
      setLoadingContents(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return "-";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds} 秒`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} 分 ${seconds % 60} 秒`;
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "info", label: "基本信息" },
    { id: "logs", label: "执行日志" },
    { id: "contents", label: "关联内容" },
  ];

  const totalContentPages = Math.ceil(contentsTotal / 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">任务详情</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-b">
          <nav className="flex px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === "info" && (
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">状态</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 text-sm font-medium rounded-full ${
                      task.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : task.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : task.status === "running"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {task.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">耗时</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDuration(task.started_at, task.completed_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(task.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">开始时间</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(task.started_at)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">完成时间</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(task.completed_at)}</dd>
              </div>
              {task.error_message && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-red-500">错误信息</dt>
                  <dd className="mt-1 text-sm text-red-700 bg-red-50 p-3 rounded">
                    {task.error_message}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {activeTab === "logs" && <TaskLogViewer taskId={task.id} />}

          {activeTab === "contents" && (
            <div>
              {loadingContents ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : contents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无关联内容</div>
              ) : (
                <>
                  <div className="space-y-3">
                    {contents.map((content) => (
                      <div key={content.id} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{content.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {content.author && <span>作者: {content.author}</span>}
                          {content.published_at && (
                            <span className="ml-2">
                              发布于: {new Date(content.published_at).toLocaleDateString("zh-CN")}
                            </span>
                          )}
                        </p>
                        {content.url && (
                          <a
                            href={content.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                          >
                            查看原文
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  {totalContentPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        onClick={() => setContentsPage((p) => Math.max(1, p - 1))}
                        disabled={contentsPage === 1}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                      >
                        上一页
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-500">
                        第 {contentsPage} 页，共 {totalContentPages} 页
                      </span>
                      <button
                        onClick={() => setContentsPage((p) => Math.min(totalContentPages, p + 1))}
                        disabled={contentsPage === totalContentPages}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                      >
                        下一页
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

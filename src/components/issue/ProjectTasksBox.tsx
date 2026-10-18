import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProjectTasks,
  createProjectTask,
  updateIssue,
  deleteIssue,
} from "@/services/issue";
import type { Issue, IssueStatus } from "@/types";

export interface ProjectTasksBoxProps {
  projectId: string;
  createdBy: string;
}

const STATUS_CONFIG: Record<
  IssueStatus,
  { label: string; dotColor: string; borderColor: string }
> = {
  "not-started": {
    label: "Not Started",
    dotColor: "bg-gray-500",
    borderColor: "border-gray-700",
  },
  "in-progress": {
    label: "In Progress",
    dotColor: "bg-blue-500",
    borderColor: "border-blue-700",
  },
  done: {
    label: "Done",
    dotColor: "bg-teal-500",
    borderColor: "border-teal-700",
  },
};

const STATUS_ORDER: IssueStatus[] = ["not-started", "in-progress", "done"];

/**
 * Project-level tasks - issues created directly under a project (no view).
 * Opening a task navigates to the real Issue detail page, so tasks get the
 * same AI chat, documents, links, and notes as any other issue.
 */
export function ProjectTasksBox({ projectId, createdBy }: ProjectTasksBoxProps) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTaskId, setNewTaskId] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingTask, setEditingTask] = useState<Issue | null>(null);
  const [editName, setEditName] = useState("");
  const [editTaskId, setEditTaskId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getProjectTasks(projectId);
    if (result.success && result.data) {
      setTasks(result.data);
    } else {
      setError(result.message || "Failed to load tasks.");
    }

    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleOpenCreate = () => {
    setNewName("");
    setNewTaskId("");
    setNewDescription("");
    setShowCreateModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsCreating(true);
    setError(null);

    const result = await createProjectTask(
      projectId,
      newName.trim(),
      newDescription.trim() || null,
      createdBy,
      newTaskId.trim() || null
    );

    if (result.success && result.data) {
      setTasks((prev) => [...prev, result.data!]);
      setShowCreateModal(false);
    } else {
      setError(result.message || "Failed to create task.");
    }

    setIsCreating(false);
  };

  const handleOpenEdit = (task: Issue) => {
    setEditingTask(task);
    setEditName(task.name);
    setEditTaskId(task.issueId || "");
    setEditDescription(task.description || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editName.trim()) return;

    setIsUpdating(true);
    setError(null);

    const result = await updateIssue(editingTask.id, {
      name: editName.trim(),
      issueId: editTaskId.trim() || null,
      description: editDescription.trim() || null,
    });

    if (result.success && result.data) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? result.data! : t))
      );
      setEditingTask(null);
    } else {
      setError(result.message || "Failed to update task.");
    }

    setIsUpdating(false);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const result = await deleteIssue(taskId);
    if (result.success) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } else {
      setError(result.message || "Failed to delete task.");
    }
  };

  const handleUpdateStatus = async (taskId: string, status: IssueStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    const result = await updateIssue(taskId, { status });
    if (!result.success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
      setError(result.message || "Failed to update status.");
    }
  };

  const getTasksByStatus = (status: IssueStatus) =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="bg-surface border border-default rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-secondary uppercase tracking-wider flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Project Tasks
          {tasks.length > 0 && (
            <span className="text-xs text-muted">({tasks.length})</span>
          )}
        </h3>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-app hover:bg-surface-hover border border-default rounded-md text-xs text-secondary hover:text-primary transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Task
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-800 rounded-md">
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-400 hover:text-red-300 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted animate-pulse">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-sm text-muted text-center py-4">
          No tasks yet. Add your first task above.
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {STATUS_ORDER.map((status) => {
            const statusTasks = getTasksByStatus(status);
            if (statusTasks.length === 0) return null;
            const config = STATUS_CONFIG[status];

            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                  <span className="text-xs font-medium text-secondary uppercase tracking-wide">
                    {config.label}
                  </span>
                  <span className="text-xs text-muted">
                    {statusTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`bg-app border ${config.borderColor} rounded-md p-3 group`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => navigate(`/issue/${task.id}`)}
                          className="text-left text-sm font-medium text-primary hover:text-teal-400 transition-colors flex-1 min-w-0"
                        >
                          <span className="block truncate">{task.name}</span>
                          {task.issueId && (
                            <span className="text-xs font-mono text-muted block">
                              {task.issueId}
                            </span>
                          )}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => handleOpenEdit(task)}
                            className="p-1 hover:bg-surface-hover rounded transition-colors"
                            title="Edit task"
                          >
                            <svg
                              className="w-3.5 h-3.5 text-secondary hover:text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-1 hover:bg-red-900/30 rounded transition-colors"
                            title="Delete task"
                          >
                            <svg
                              className="w-3.5 h-3.5 text-secondary hover:text-red-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted line-clamp-2 mt-1">
                          {task.description}
                        </p>
                      )}

                      <div className="flex gap-1 pt-2 mt-2 border-t border-default">
                        {status !== "not-started" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                task.id,
                                status === "done" ? "in-progress" : "not-started"
                              )
                            }
                            className="flex-1 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-surface-hover rounded transition-colors"
                          >
                            ← {status === "done" ? "In Progress" : "Not Started"}
                          </button>
                        )}
                        {status !== "done" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                task.id,
                                status === "not-started" ? "in-progress" : "done"
                              )
                            }
                            className="flex-1 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-surface-hover rounded transition-colors"
                          >
                            {status === "not-started" ? "In Progress" : "Done"} →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Add Task
            </h3>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Task Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter task name"
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                  disabled={isCreating}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Task ID (Optional)
                </label>
                <input
                  type="text"
                  value={newTaskId}
                  onChange={(e) => setNewTaskId(e.target.value)}
                  placeholder="e.g., TASK-001"
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                  disabled={isCreating}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the task..."
                  rows={4}
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  disabled={isCreating}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim() || isCreating}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                >
                  {isCreating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Edit Task
            </h3>
            <form onSubmit={handleSaveEdit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Task Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                  disabled={isUpdating}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Task ID (Optional)
                </label>
                <input
                  type="text"
                  value={editTaskId}
                  onChange={(e) => setEditTaskId(e.target.value)}
                  placeholder="e.g., TASK-001"
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                  disabled={isUpdating}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  disabled={isUpdating}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  disabled={isUpdating}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim() || isUpdating}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

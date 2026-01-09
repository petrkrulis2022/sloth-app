import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { useToast } from "@/components/ui";
import {
  getIssue,
  getSubIssues,
  createSubIssue,
  updateIssue,
  getProjects,
  getCurrentSession,
} from "@/services";
import type { Project, Issue, IssueStatus } from "@/types";

export function DevelopmentPlan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [devTasks, setDevTasks] = useState<Issue[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [developmentNotes, setDevelopmentNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Fetch issue and development tasks
  const fetchData = useCallback(async () => {
    if (!id) return;

    const session = getCurrentSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setIsLoading(true);

    // Fetch issue details
    const issueResult = await getIssue(id);
    if (!issueResult.success || !issueResult.data) {
      addToast("error", issueResult.message || "Issue not found");
      setIsLoading(false);
      return;
    }
    setIssue(issueResult.data);
    setDevelopmentNotes(issueResult.data.developmentNotes || "");

    // Fetch development tasks (sub-issues)
    const subIssuesResult = await getSubIssues(id);
    if (subIssuesResult.success && subIssuesResult.data) {
      setDevTasks(subIssuesResult.data);
    }

    // Fetch all projects for sidebar
    const projectsResult = await getProjects(session.userId);
    if (projectsResult.success && projectsResult.data) {
      setAllProjects(projectsResult.data);
    }

    setIsLoading(false);
  }, [id, navigate, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveNotes = async () => {
    if (!id) return;

    setIsSavingNotes(true);

    console.log("Saving notes:", developmentNotes);
    const result = await updateIssue(id, {
      developmentNotes: developmentNotes.trim() || null,
    });

    console.log("Save result:", result);
    if (result.success && result.data) {
      setIssue(result.data);
      addToast("success", "Development notes saved");
    } else {
      addToast("error", result.message || "Failed to save notes");
    }

    setIsSavingNotes(false);
  };

  const handleBackToIssue = () => {
    navigate(`/issue/${id}`);
  };

  const handleAddTask = () => {
    setShowCreateTaskModal(true);
    setNewTaskName("");
    setNewTaskDescription("");
  };

  const handleSubmitCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !issue) return;

    const session = getCurrentSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setIsCreatingTask(true);

    const result = await createSubIssue(
      id,
      newTaskName,
      newTaskDescription || null,
      session.userId
    );

    if (result.success && result.data) {
      setDevTasks((prev) => [...prev, result.data!]);
      addToast("success", `Task "${result.data.name}" created`);
      setShowCreateTaskModal(false);
      setNewTaskName("");
      setNewTaskDescription("");
    } else {
      addToast("error", result.message || "Failed to create task");
    }

    setIsCreatingTask(false);
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleCreateProject = () => {
    navigate("/");
  };

  // Kanban columns
  const notStartedTasks = devTasks.filter((t) => t.status === "not-started");
  const inProgressTasks = devTasks.filter((t) => t.status === "in-progress");
  const doneTasks = devTasks.filter((t) => t.status === "done");

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: IssueStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const task = devTasks.find((t) => t.id === draggedTaskId);
    if (!task || task.status === newStatus) {
      setDraggedTaskId(null);
      return;
    }

    // Optimistic update
    setDevTasks((prev) =>
      prev.map((t) =>
        t.id === draggedTaskId ? { ...t, status: newStatus } : t
      )
    );
    setDraggedTaskId(null);

    // Update in database
    const { updateIssue } = await import("@/services");
    const result = await updateIssue(draggedTaskId, { status: newStatus });

    if (!result.success) {
      // Rollback on error
      setDevTasks((prev) =>
        prev.map((t) =>
          t.id === draggedTaskId ? { ...t, status: task.status } : t
        )
      );
      addToast("error", result.message || "Failed to update task status");
    } else {
      addToast("success", "Task status updated");
    }
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/issue/${taskId}`);
  };

  if (isLoading) {
    return (
      <AppLayout
        projects={allProjects}
        onCreateProject={handleCreateProject}
        onSelectProject={handleSelectProject}
      >
        <div className="bg-surface rounded-lg border border-default p-8 text-center">
          <div className="animate-pulse text-secondary">
            Loading development plan...
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!issue) {
    return (
      <AppLayout
        projects={allProjects}
        onCreateProject={handleCreateProject}
        onSelectProject={handleSelectProject}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-primary mb-2">
            Issue not found
          </h2>
          <p className="text-secondary">
            The issue doesn't exist or you don't have access.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      projects={allProjects}
      onCreateProject={handleCreateProject}
      onSelectProject={handleSelectProject}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={handleBackToIssue}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-hover border border-default hover:border-hover text-secondary hover:text-primary rounded-md text-sm transition-colors"
              >
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Issue
              </button>
            </div>
            <h1 className="text-2xl font-semibold text-primary">
              Development Plan
            </h1>
          </div>
          <button
            onClick={handleAddTask}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Development Task
          </button>
        </div>

        {/* Technical Notes Section */}
        <div className="bg-surface border border-default rounded-lg p-4">
          <h3 className="text-sm font-medium text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Technical Notes & Architecture
          </h3>
          <textarea
            value={developmentNotes}
            onChange={(e) => setDevelopmentNotes(e.target.value)}
            placeholder="Add technical notes, architecture decisions, API endpoints, data models, implementation steps..."
            className="w-full px-3 py-2 bg-background border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 min-h-[120px] resize-y mb-3"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 text-white rounded-md text-sm font-medium transition-colors"
            >
              {isSavingNotes ? "Saving..." : "Save Notes"}
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-primary">
              Development Tasks
            </h3>
            <div className="text-sm text-secondary">
              {doneTasks.length} / {devTasks.length} tasks completed
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Not Started Column */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "not-started")}
              className="bg-surface border border-default rounded-lg"
            >
              <div className="px-4 py-3 border-b border-default">
                <h4 className="text-sm font-medium text-secondary uppercase tracking-wider flex items-center justify-between">
                  <span>Not Started</span>
                  <span className="bg-gray-500/20 text-gray-400 text-xs px-2 py-0.5 rounded">
                    {notStartedTasks.length}
                  </span>
                </h4>
              </div>
              <div className="p-3 space-y-2 min-h-[400px]">
                {notStartedTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => handleTaskClick(task.id)}
                    className="bg-background border border-default rounded-lg p-3 cursor-move hover:border-hover transition-colors"
                  >
                    <h5 className="text-sm font-medium text-primary mb-1">
                      {task.name}
                    </h5>
                    {task.description && (
                      <p className="text-xs text-muted line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    {task.issueId && (
                      <div className="mt-2 text-xs text-secondary font-mono">
                        {task.issueId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "in-progress")}
              className="bg-surface border border-default rounded-lg"
            >
              <div className="px-4 py-3 border-b border-default">
                <h4 className="text-sm font-medium text-secondary uppercase tracking-wider flex items-center justify-between">
                  <span>In Progress</span>
                  <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded">
                    {inProgressTasks.length}
                  </span>
                </h4>
              </div>
              <div className="p-3 space-y-2 min-h-[400px]">
                {inProgressTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => handleTaskClick(task.id)}
                    className="bg-background border border-default rounded-lg p-3 cursor-move hover:border-hover transition-colors"
                  >
                    <h5 className="text-sm font-medium text-primary mb-1">
                      {task.name}
                    </h5>
                    {task.description && (
                      <p className="text-xs text-muted line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    {task.issueId && (
                      <div className="mt-2 text-xs text-secondary font-mono">
                        {task.issueId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Done Column */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "done")}
              className="bg-surface border border-default rounded-lg"
            >
              <div className="px-4 py-3 border-b border-default">
                <h4 className="text-sm font-medium text-secondary uppercase tracking-wider flex items-center justify-between">
                  <span>Done</span>
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded">
                    {doneTasks.length}
                  </span>
                </h4>
              </div>
              <div className="p-3 space-y-2 min-h-[400px]">
                {doneTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => handleTaskClick(task.id)}
                    className="bg-background border border-default rounded-lg p-3 cursor-move hover:border-hover transition-colors"
                  >
                    <h5 className="text-sm font-medium text-primary mb-1">
                      {task.name}
                    </h5>
                    {task.description && (
                      <p className="text-xs text-muted line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    {task.issueId && (
                      <div className="mt-2 text-xs text-secondary font-mono">
                        {task.issueId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-default rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-primary mb-4">
              Add Development Task
            </h3>
            <form onSubmit={handleSubmitCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Task Name *
                </label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="e.g., Implement API endpoint for user auth"
                  className="w-full px-3 py-2 bg-background border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Description
                </label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Add technical details, acceptance criteria..."
                  className="w-full px-3 py-2 bg-background border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 min-h-[100px] resize-y"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 bg-surface hover:bg-surface-hover border border-default hover:border-hover text-secondary hover:text-primary rounded-md text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTask}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 text-white rounded-md text-sm font-medium transition-colors"
                >
                  {isCreatingTask ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

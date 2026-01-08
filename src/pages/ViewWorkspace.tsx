import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { KanbanBoard } from "@/components/issue";
import { DocumentsBox } from "@/components/document";
import { LinksBox } from "@/components/link";
import { AIChatBox } from "@/components/ai";
import { IconPicker } from "@/components/view";
import { useCommand } from "@/contexts";
import { useToast } from "@/components/ui";
import {
  getView,
  getProjects,
  getCurrentSession,
  getIssues,
  createIssue,
  updateIssue,
  deleteIssue,
  updateView,
  deleteView,
} from "@/services";
import type { Project, View, Issue, IssueStatus } from "@/types";

export function ViewWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setAppContext, setCreateHandler } = useCommand();
  const { addToast } = useToast();

  const [view, setView] = useState<View | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
  const [newIssueName, setNewIssueName] = useState("");
  const [newIssueId, setNewIssueId] = useState("");
  const [newIssueDescription, setNewIssueDescription] = useState("");
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [editIssueName, setEditIssueName] = useState("");
  const [editIssueId, setEditIssueId] = useState("");
  const [editIssueDescription, setEditIssueDescription] = useState("");
  const [isUpdatingIssue, setIsUpdatingIssue] = useState(false);
  const [showEditViewModal, setShowEditViewModal] = useState(false);
  const [editViewName, setEditViewName] = useState("");
  const [editViewTag, setEditViewTag] = useState("");
  const [editViewIcon, setEditViewIcon] = useState<string | null>(null);
  const [isUpdatingView, setIsUpdatingView] = useState(false);
  const [showDeleteViewConfirm, setShowDeleteViewConfirm] = useState(false);
  const [isDeletingView, setIsDeletingView] = useState(false);
  const session = getCurrentSession();

  // Fetch view data
  const fetchViewData = useCallback(async () => {
    if (!id) return;

    const session = getCurrentSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setIsLoading(true);

    // Fetch view details
    const viewResult = await getView(id);
    if (!viewResult.success || !viewResult.data) {
      addToast("error", viewResult.message || "View not found");
      setIsLoading(false);
      return;
    }
    setView(viewResult.data);

    // Fetch issues for this view
    const issuesResult = await getIssues(id);
    if (issuesResult.success && issuesResult.data) {
      setIssues(issuesResult.data);
    }

    // Fetch all projects for sidebar
    const projectsResult = await getProjects(session.userId);
    if (projectsResult.success && projectsResult.data) {
      setAllProjects(projectsResult.data);
    }

    setIsLoading(false);
  }, [id, navigate, addToast]);

  useEffect(() => {
    fetchViewData();
  }, [fetchViewData]);

  const handleCreateIssue = useCallback(() => {
    setShowCreateIssueModal(true);
    setNewIssueName("");
    setNewIssueId("");
    setNewIssueDescription("");
  }, []);

  const handleSubmitCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const session = getCurrentSession();
    if (!session) {
      navigate("/login");
      return;
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticIssue: Issue = {
      id: tempId,
      viewId: id,
      parentId: null,
      name: newIssueName,
      issueId: newIssueId || null,
      description: newIssueDescription || null,
      status: "not-started",
      createdBy: session.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setIssues((prev) => [...prev, optimisticIssue]);
    setShowCreateIssueModal(false);
    setNewIssueName("");
    setNewIssueId("");
    setNewIssueDescription("");

    const result = await createIssue(
      id,
      newIssueName,
      newIssueDescription || null,
      session.userId,
      newIssueId || null
    );

    if (result.success && result.data) {
      // Replace optimistic issue with real one
      setIssues((prev) =>
        prev.map((i) => (i.id === tempId ? result.data! : i))
      );
      addToast("success", `Issue "${result.data.name}" created successfully`);
    } else {
      // Rollback optimistic update
      setIssues((prev) => prev.filter((i) => i.id !== tempId));
      addToast("error", result.message || "Failed to create issue");
    }
  };

  const handleSelectIssue = (issueId: string) => {
    navigate(`/issue/${issueId}`);
  };

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
    setEditIssueName(issue.name);
    setEditIssueId(issue.issueId || "");
    setEditIssueDescription(issue.description || "");
  };

  const handleSubmitEditIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIssue || !editIssueName.trim()) return;

    setIsUpdatingIssue(true);
    const result = await updateIssue(editingIssue.id, {
      name: editIssueName.trim(),
      issueId: editIssueId.trim() || null,
      description: editIssueDescription.trim() || null,
    });

    if (result.success && result.data) {
      setIssues((prev) =>
        prev.map((i) => (i.id === editingIssue.id ? result.data! : i))
      );
      addToast("success", "Issue updated successfully");
      setEditingIssue(null);
    } else {
      addToast("error", result.message || "Failed to update issue");
    }

    setIsUpdatingIssue(false);
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;

    const result = await deleteIssue(issueId);

    if (result.success) {
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
      addToast("success", "Issue deleted successfully");
    } else {
      addToast("error", result.message || "Failed to delete issue");
    }
  };

  const handleUpdateStatus = async (
    issueId: string,
    newStatus: IssueStatus
  ) => {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return;

    // Optimistic update
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i))
    );

    const result = await updateIssue(issueId, {
      name: issue.name,
      description: issue.description,
      status: newStatus,
    });

    if (result.success) {
      addToast("success", "Status updated");
    } else {
      // Revert on error
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: issue.status } : i))
      );
      addToast("error", result.message || "Failed to update status");
    }
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleCreateProject = () => {
    navigate("/");
  };

  const handleEditViewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!view || !id || !editViewName.trim() || !editViewTag.trim()) return;

    setIsUpdatingView(true);
    const result = await updateView(id, {
      name: editViewName.trim(),
      tag: editViewTag.trim(),
      icon: editViewIcon,
    });

    if (result.success && result.data) {
      setView(result.data);
      addToast("success", "View updated successfully");
      setShowEditViewModal(false);
    } else {
      addToast("error", result.message || "Failed to update view");
    }

    setIsUpdatingView(false);
  };

  const handleDeleteViewConfirm = async () => {
    if (!view || !id) return;

    setIsDeletingView(true);
    const result = await deleteView(id);

    if (result.success) {
      addToast("success", "View deleted successfully");
      navigate(`/project/${view.projectId}`);
    } else {
      addToast("error", result.message || "Failed to delete view");
    }

    setIsDeletingView(false);
    setShowDeleteViewConfirm(false);
  };

  // Set up context and keyboard shortcut handler
  useEffect(() => {
    setAppContext("view");
    setCreateHandler(handleCreateIssue);
    return () => setCreateHandler(undefined);
  }, [setAppContext, setCreateHandler, handleCreateIssue]);

  // Initialize edit view form when modal opens
  useEffect(() => {
    if (showEditViewModal && view) {
      setEditViewName(view.name);
      setEditViewTag(view.tag);
      setEditViewIcon(view.icon);
    }
  }, [showEditViewModal, view]);

  if (isLoading) {
    return (
      <AppLayout
        projects={allProjects}
        activeProjectId={view?.projectId}
        onCreateProject={handleCreateProject}
        onSelectProject={handleSelectProject}
      >
        <div className="bg-surface rounded-lg border border-default p-8 text-center">
          <div className="animate-pulse text-secondary">Loading view...</div>
        </div>
      </AppLayout>
    );
  }

  if (!view) {
    return (
      <AppLayout
        projects={allProjects}
        onCreateProject={handleCreateProject}
        onSelectProject={handleSelectProject}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-primary mb-2">
            View not found
          </h2>
          <p className="text-secondary">
            The view you're looking for doesn't exist or you don't have access.
          </p>
        </div>
      </AppLayout>
    );
  }

  // Filter to only show top-level issues (no parent)
  const topLevelIssues = issues.filter((issue) => !issue.parentId);

  return (
    <AppLayout
      projects={allProjects}
      activeProjectId={view.projectId}
      onCreateProject={handleCreateProject}
      onSelectProject={handleSelectProject}
    >
      <div className="flex gap-6 h-full">
        {/* Main content area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* View Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{view.icon || "📋"}</span>
                <h2 className="text-2xl font-semibold text-primary">
                  {view.name}
                </h2>
                <span className="text-xs px-2 py-1 bg-teal-500/20 text-teal-400 rounded font-mono">
                  {view.tag}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEditViewModal(true)}
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit View
                </button>
                <button
                  onClick={() => setShowDeleteViewConfirm(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-red-900/30 border border-default hover:border-red-500/50 text-secondary hover:text-red-400 rounded-md text-sm transition-colors"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete View
                </button>
              </div>
            </div>
          </div>

          {/* AI Discussion Box - Full Width */}
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
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              AI Strategic Assistant
            </h3>
            <AIChatBox
              contextType="view"
              contextId={view.id}
              userId={session?.userId || ""}
            />
          </div>

          {/* Issues section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-primary">Issues</h3>
              <button
                onClick={handleCreateIssue}
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create New Custom Issue
              </button>
            </div>

            {topLevelIssues.length === 0 ? (
              <div className="bg-surface rounded-lg border border-default p-8 text-center">
                <p className="text-sm text-muted mb-4">No issues yet</p>
                <button
                  onClick={handleCreateIssue}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Create Issue
                </button>
              </div>
            ) : (
              <KanbanBoard
                issues={topLevelIssues}
                onSelectIssue={handleSelectIssue}
                onEditIssue={handleEditIssue}
                onDeleteIssue={handleDeleteIssue}
                onUpdateStatus={handleUpdateStatus}
              />
            )}
          </div>
        </div>

        {/* Right-hand sidebar - Only Documents and Links */}
        <aside className="w-80 flex-shrink-0">
          <div className="bg-surface border border-default rounded-lg p-4 h-fit space-y-6">
            {/* Documents Box */}
            <DocumentsBox contextType="view" contextId={view.id} />

            {/* Links Box */}
            <LinksBox contextType="view" contextId={view.id} />
          </div>
        </aside>
      </div>

      {/* Create Issue Modal */}
      {showCreateIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Create New Issue
            </h3>
            <form onSubmit={handleSubmitCreateIssue}>
              <div className="mb-4">
                <label
                  htmlFor="issueName"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Issue Name
                </label>
                <input
                  id="issueName"
                  type="text"
                  value={newIssueName}
                  onChange={(e) => setNewIssueName(e.target.value)}
                  placeholder="Enter issue name"
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="issueId"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Issue ID (Optional)
                </label>
                <input
                  id="issueId"
                  type="text"
                  value={newIssueId}
                  onChange={(e) => setNewIssueId(e.target.value)}
                  placeholder="e.g., MVP-001, DEV-001"
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="issueDescription"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Description
                </label>
                <textarea
                  id="issueDescription"
                  value={newIssueDescription}
                  onChange={(e) => setNewIssueDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={4}
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateIssueModal(false)}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newIssueName.trim()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                >
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Issue Modal */}
      {editingIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Edit Issue
            </h3>
            <form onSubmit={handleSubmitEditIssue}>
              <div className="mb-4">
                <label
                  htmlFor="editIssueName"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Issue Name
                </label>
                <input
                  id="editIssueName"
                  type="text"
                  value={editIssueName}
                  onChange={(e) => setEditIssueName(e.target.value)}
                  placeholder="Enter issue name"
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                  disabled={isUpdatingIssue}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="editIssueId"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Issue ID (Optional)
                </label>
                <input
                  id="editIssueId"
                  type="text"
                  value={editIssueId}
                  onChange={(e) => setEditIssueId(e.target.value)}
                  placeholder="e.g., MVP-001, DEV-001"
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                  disabled={isUpdatingIssue}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="editIssueDescription"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Description
                </label>
                <textarea
                  id="editIssueDescription"
                  value={editIssueDescription}
                  onChange={(e) => setEditIssueDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={4}
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  disabled={isUpdatingIssue}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingIssue(null)}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                  disabled={isUpdatingIssue}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editIssueName.trim() || isUpdatingIssue}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                >
                  {isUpdatingIssue ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit View Modal */}
      {showEditViewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-primary mb-4">Edit View</h3>
            <form onSubmit={handleEditViewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  View Name
                </label>
                <input
                  type="text"
                  value={editViewName}
                  onChange={(e) => setEditViewName(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., MVP Features"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Tag
                </label>
                <input
                  type="text"
                  value={editViewTag}
                  onChange={(e) => setEditViewTag(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., mvp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Icon
                </label>
                <IconPicker value={editViewIcon} onChange={setEditViewIcon} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditViewModal(false)}
                  className="px-4 py-2 bg-surface hover:bg-surface-hover border border-default text-secondary hover:text-primary rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !editViewName.trim() ||
                    !editViewTag.trim() ||
                    isUpdatingView
                  }
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                >
                  {isUpdatingView ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete View Confirmation Modal */}
      {showDeleteViewConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-red-400 mb-4">
              Delete View
            </h3>
            <p className="text-secondary mb-6">
              Are you sure you want to delete this view? This will also delete
              all issues in this view. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteViewConfirm(false)}
                disabled={isDeletingView}
                className="px-4 py-2 bg-surface hover:bg-surface-hover border border-default text-secondary hover:text-primary rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteViewConfirm}
                disabled={isDeletingView}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
              >
                {isDeletingView ? "Deleting..." : "Delete View"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

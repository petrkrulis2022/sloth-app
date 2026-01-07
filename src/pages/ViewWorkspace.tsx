import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { IssueList } from "@/components/issue";
import { ViewContextSidebar } from "@/components/view";
import { useCommand } from "@/contexts";
import { useToast } from "@/components/ui";
import {
  getView,
  getProjects,
  getCurrentSession,
  getIssues,
  createIssue,
} from "@/services";
import type { Project, View, Issue } from "@/types";

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
  const [newIssueDescription, setNewIssueDescription] = useState("");
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
      description: newIssueDescription || null,
      createdBy: session.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setIssues((prev) => [...prev, optimisticIssue]);
    setShowCreateIssueModal(false);
    setNewIssueName("");
    setNewIssueDescription("");

    const result = await createIssue(
      id,
      newIssueName,
      newIssueDescription || null,
      session.userId
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

  const handleSelectProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleCreateProject = () => {
    navigate("/");
  };

  // Set up context and keyboard shortcut handler
  useEffect(() => {
    setAppContext("view");
    setCreateHandler(handleCreateIssue);
    return () => setCreateHandler(undefined);
  }, [setAppContext, setCreateHandler, handleCreateIssue]);

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
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-teal-900/30 text-teal-400 text-xs font-mono rounded">
                {view.tag}
              </span>
              <h2 className="text-2xl font-semibold text-primary">
                {view.name}
              </h2>
            </div>
            <button
              onClick={handleCreateIssue}
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
              Create New Custom Issue
            </button>
          </div>

          {topLevelIssues.length === 0 ? (
            <div className="bg-surface rounded-lg border border-default p-8 text-center">
              <h3 className="text-lg font-medium text-primary mb-2">
                No issues yet
              </h3>
              <p className="text-secondary mb-6">
                Create your first issue to start tracking work
              </p>
              <button
                onClick={handleCreateIssue}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Create Issue
              </button>
            </div>
          ) : (
            <div className="bg-surface rounded-lg border border-default p-6">
              <p className="text-secondary text-sm">
                Issues are now displayed in the top navigation bar. Click on any
                issue to view its details.
              </p>
            </div>
          )}
        </div>

        {/* Right-hand context sidebar */}
        {session && (
          <ViewContextSidebar viewId={view.id} userId={session.userId} />
        )}
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
    </AppLayout>
  );
}

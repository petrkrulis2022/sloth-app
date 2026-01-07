import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { InviteCollaboratorModal } from "@/components/invitation";
import { useCommand } from "@/contexts";
import { useToast } from "@/components/ui";
import {
  getProject,
  getProjects,
  getProjectViews,
  copyProject,
  getCurrentSession,
  createView,
} from "@/services";
import type { Project, View } from "@/types";

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setAppContext, setCreateHandler } = useCommand();
  const { addToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateViewModal, setShowCreateViewModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewTag, setNewViewTag] = useState("");
  const [isCreatingView, setIsCreatingView] = useState(false);

  // Fetch project data
  const fetchProjectData = useCallback(async () => {
    if (!id) return;

    const session = getCurrentSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setIsLoading(true);

    // Fetch project details
    const projectResult = await getProject(id);
    if (!projectResult.success || !projectResult.data) {
      addToast("error", projectResult.message || "Project not found");
      setIsLoading(false);
      return;
    }
    setProject(projectResult.data);

    // Fetch views for this project
    const viewsResult = await getProjectViews(id);
    if (viewsResult.success && viewsResult.data) {
      setViews(viewsResult.data);
    }

    // Fetch all projects for sidebar
    const projectsResult = await getProjects(session.userId);
    if (projectsResult.success && projectsResult.data) {
      setAllProjects(projectsResult.data);
    }

    setIsLoading(false);
  }, [id, navigate, addToast]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleCreateView = useCallback(() => {
    setShowCreateViewModal(true);
    setNewViewName("");
    setNewViewTag("");
  }, []);

  const handleSubmitCreateView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsCreatingView(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticView: View = {
      id: tempId,
      projectId: id,
      name: newViewName,
      tag: newViewTag,
      chatSessionId: null,
      chatSessionName: null,
      aiModel: "sonar-deep-research",
      systemPrompt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setViews((prev) => [...prev, optimisticView]);
    setShowCreateViewModal(false);
    setNewViewName("");
    setNewViewTag("");

    const result = await createView(id, newViewName, newViewTag);

    if (result.success && result.data) {
      // Replace optimistic view with real one
      setViews((prev) => prev.map((v) => (v.id === tempId ? result.data! : v)));
      addToast("success", `View "${result.data.name}" created successfully`);
    } else {
      // Rollback optimistic update
      setViews((prev) => prev.filter((v) => v.id !== tempId));
      addToast("error", result.message || "Failed to create view");
    }

    setIsCreatingView(false);
  };

  const handleSelectView = (viewId: string) => {
    navigate(`/view/${viewId}`);
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleCreateProject = () => {
    navigate("/");
  };

  const handleInviteCollaborator = () => {
    setShowInviteModal(true);
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
  };

  const handleCopyProject = async () => {
    if (!id || !project) return;

    const session = getCurrentSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setIsCopying(true);
    const result = await copyProject(id, session.userId);

    if (result.success && result.data) {
      addToast("success", `Project copied as "${result.data.name}"`);
      // Navigate to the new copied project
      navigate(`/project/${result.data.id}`);
    } else {
      addToast("error", result.message || "Failed to copy project");
    }

    setIsCopying(false);
  };

  // Set up context and keyboard shortcut handler
  useEffect(() => {
    setAppContext("project");
    setCreateHandler(handleCreateView);
    return () => setCreateHandler(undefined);
  }, [setAppContext, setCreateHandler, handleCreateView]);

  if (isLoading) {
    return (
      <AppLayout
        projects={allProjects}
        activeProjectId={id}
        onCreateProject={handleCreateProject}
        onSelectProject={handleSelectProject}
      >
        <div className="bg-surface rounded-lg border border-default p-8 text-center">
          <div className="animate-pulse text-secondary">Loading project...</div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout
        projects={allProjects}
        activeProjectId={id}
        onCreateProject={handleCreateProject}
        onSelectProject={handleSelectProject}
      >
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-primary mb-2">
            Project not found
          </h2>
          <p className="text-secondary">
            The project you're looking for doesn't exist or you don't have
            access.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      projects={allProjects}
      activeProjectId={id}
      onCreateProject={handleCreateProject}
      onSelectProject={handleSelectProject}
    >
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-primary">
            {project.name}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleInviteCollaborator}
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-default rounded-md text-sm font-medium text-secondary hover:text-primary transition-colors"
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Invite
            </button>
            <button
              onClick={handleCopyProject}
              disabled={isCopying}
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-default rounded-md text-sm font-medium text-secondary hover:text-primary transition-colors disabled:opacity-50"
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {isCopying ? "Copying..." : "Copy"}
            </button>
            <button
              onClick={handleCreateView}
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
              Create View
            </button>
          </div>
        </div>

        {views.length === 0 ? (
          <div className="bg-surface rounded-lg border border-default p-8 text-center">
            <h3 className="text-lg font-medium text-primary mb-2">
              No views yet
            </h3>
            <p className="text-secondary mb-6">
              Create your first view to organize your work
            </p>
            <button
              onClick={handleCreateView}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Create View
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => handleSelectView(view.id)}
                className="bg-surface hover:bg-surface-hover border border-default hover:border-hover rounded-lg p-4 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-teal-900/30 text-teal-400 text-xs font-mono rounded">
                    {view.tag}
                  </span>
                  <h3 className="text-lg font-medium text-primary">
                    {view.name}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create View Modal */}
      {showCreateViewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Create New View
            </h3>
            <form onSubmit={handleSubmitCreateView}>
              <div className="mb-4">
                <label
                  htmlFor="viewName"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  View Name
                </label>
                <input
                  id="viewName"
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="e.g., Roadmap"
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                  disabled={isCreatingView}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="viewTag"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Short Tag
                </label>
                <input
                  id="viewTag"
                  type="text"
                  value={newViewTag}
                  onChange={(e) =>
                    setNewViewTag(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="e.g., RDM"
                  maxLength={10}
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                  disabled={isCreatingView}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateViewModal(false)}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                  disabled={isCreatingView}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !newViewName.trim() || !newViewTag.trim() || isCreatingView
                  }
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                >
                  {isCreatingView ? "Creating..." : "Create View"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Collaborator Modal */}
      {id && (
        <InviteCollaboratorModal
          projectId={id}
          isOpen={showInviteModal}
          onClose={handleCloseInviteModal}
        />
      )}
    </AppLayout>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { InviteCollaboratorModal } from "@/components/invitation";
import { DocumentsBox } from "@/components/document";
import { LinksBox } from "@/components/link";
import { AIChatBox } from "@/components/ai";
import { IconPicker } from "@/components/view";
import { useCommand } from "@/contexts";
import { useToast } from "@/components/ui";
import {
  getProject,
  getProjects,
  getProjectViews,
  copyProject,
  getCurrentSession,
  createView,
  updateProject,
  deleteProject,
  updateView,
  deleteView,
  updateViewPositions,
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
  const [newViewIcon, setNewViewIcon] = useState<string | null>("📋");
  const [isCreatingView, setIsCreatingView] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editViewName, setEditViewName] = useState("");
  const [editViewTag, setEditViewTag] = useState("");
  const [editViewIcon, setEditViewIcon] = useState<string | null>(null);
  const [isUpdatingView, setIsUpdatingView] = useState(false);
  const [deletingViewId, setDeletingViewId] = useState<string | null>(null);
  const [projectNotes, setProjectNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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
    setProjectNotes(projectResult.data.notes || "");

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
    setNewViewIcon("📋");
  }, []);

  const handleSaveNotes = async () => {
    if (!project || !id) return;

    setIsSavingNotes(true);
    const result = await updateProject(id, { notes: projectNotes });

    if (result.success && result.data) {
      setProject(result.data);
      addToast("success", "Notes saved successfully");
    } else {
      addToast("error", result.message || "Failed to save notes");
    }
    setIsSavingNotes(false);
  };

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
      icon: newViewIcon,
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
    setNewViewIcon("📋");

    const result = await createView(id, newViewName, newViewTag, newViewIcon);

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

  const handleEditProject = () => {
    if (!project) return;
    setEditProjectName(project.name);
    setShowEditProjectModal(true);
  };

  const handleSubmitEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editProjectName.trim()) return;

    setIsUpdatingProject(true);
    const result = await updateProject(id, { name: editProjectName.trim() });

    if (result.success && result.data) {
      setProject(result.data);
      addToast("success", "Project updated successfully");
      setShowEditProjectModal(false);
    } else {
      addToast("error", result.message || "Failed to update project");
    }

    setIsUpdatingProject(false);
  };

  const handleDeleteProject = async () => {
    if (!id) return;

    setIsDeleting(true);
    const result = await deleteProject(id);

    if (result.success) {
      addToast("success", "Project deleted successfully");
      navigate("/dashboard");
    } else {
      addToast("error", result.message || "Failed to delete project");
    }

    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handleEditView = (view: View, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingViewId(view.id);
    setEditViewName(view.name);
    setEditViewTag(view.tag);
    setEditViewIcon(view.icon);
  };

  const handleSubmitEditView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingViewId || !editViewName.trim() || !editViewTag.trim()) return;

    setIsUpdatingView(true);
    const result = await updateView(editingViewId, {
      name: editViewName.trim(),
      tag: editViewTag.trim(),
      icon: editViewIcon,
    });

    if (result.success && result.data) {
      setViews((prev) =>
        prev.map((v) => (v.id === editingViewId ? result.data! : v))
      );
      addToast("success", "View updated successfully");
      setEditingViewId(null);
    } else {
      addToast("error", result.message || "Failed to update view");
    }

    setIsUpdatingView(false);
  };

  const handleDeleteView = async (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this view?")) return;

    setDeletingViewId(viewId);
    const result = await deleteView(viewId);

    if (result.success) {
      setViews((prev) => prev.filter((v) => v.id !== viewId));
      addToast("success", "View deleted successfully");
    } else {
      addToast("error", result.message || "Failed to delete view");
    }

    setDeletingViewId(null);
  };

  const handleReorderViews = async (reorderedViews: View[]) => {
    // Optimistically update UI
    setViews(reorderedViews);

    // Update positions in database
    const viewPositions = reorderedViews.map((view) => ({
      id: view.id,
      position: view.position,
    }));

    const result = await updateViewPositions(viewPositions);

    if (result.success) {
      addToast("success", "Views reordered");
    } else {
      // Revert on error
      fetchProjectData();
      addToast("error", result.message || "Failed to reorder views");
    }
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
      views={views}
      onSelectView={handleSelectView}
      onReorderViews={handleReorderViews}
    >
      <div className="flex gap-6 h-full">
        {/* Main content area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Project Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-semibold text-primary">
                {project.name}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateView}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-hover border border-default rounded-md text-sm font-medium text-secondary hover:text-primary transition-colors"
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
                <button
                  onClick={handleEditProject}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-hover border border-default rounded-md text-sm font-medium text-secondary hover:text-primary transition-colors"
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
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-red-900/30 border border-default hover:border-red-600 rounded-md text-sm font-medium text-secondary hover:text-red-400 transition-colors"
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
                  Delete
                </button>
                <button
                  onClick={handleInviteCollaborator}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-hover border border-default rounded-md text-sm font-medium text-secondary hover:text-primary transition-colors"
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
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-hover border border-default rounded-md text-sm font-medium text-secondary hover:text-primary transition-colors disabled:opacity-50"
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
              contextType="project"
              contextId={project.id}
              userId={getCurrentSession()?.userId || ""}
            />
          </div>

          {/* Project Notes/Comments Section */}
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
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              Project Notes
            </h3>
            <div className="space-y-3">
              <textarea
                value={projectNotes}
                onChange={(e) => setProjectNotes(e.target.value)}
                placeholder="Add notes about this project..."
                rows={4}
                className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingNotes ? "Saving..." : "Save Notes"}
                </button>
              </div>
              <div className="text-xs text-muted italic">
                Note: Full comments are available on individual issues
              </div>
            </div>
          </div>
        </div>

        {/* Right-hand sidebar - Only Documents and Links */}
        <aside className="w-80 flex-shrink-0">
          <div className="bg-surface border border-default rounded-lg p-4 h-fit space-y-6">
            {/* Documents Box */}
            <DocumentsBox contextType="project" contextId={project.id} />

            {/* Links Box */}
            <LinksBox contextType="project" contextId={project.id} />
          </div>
        </aside>
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
                  onChange={(e) => setNewViewTag(e.target.value.slice(0, 10))}
                  placeholder="e.g., RDM"
                  maxLength={10}
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                  disabled={isCreatingView}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Icon
                </label>
                <IconPicker
                  value={newViewIcon}
                  onChange={setNewViewIcon}
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

      {/* Edit Project Modal */}
      {showEditProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Edit Project
            </h3>
            <form onSubmit={handleSubmitEditProject}>
              <div className="mb-4">
                <label
                  htmlFor="projectName"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                  disabled={isUpdatingProject}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditProjectModal(false)}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                  disabled={isUpdatingProject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editProjectName.trim() || isUpdatingProject}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                >
                  {isUpdatingProject ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-400 mb-4">
              Delete Project
            </h3>
            <p className="text-secondary mb-6">
              Are you sure you want to delete "{project?.name}"? This action
              cannot be undone and will delete all views, issues, and associated
              data.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit View Modal */}
      {editingViewId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Edit View
            </h3>
            <form onSubmit={handleSubmitEditView}>
              <div className="mb-4">
                <label
                  htmlFor="editViewName"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  View Name
                </label>
                <input
                  id="editViewName"
                  type="text"
                  value={editViewName}
                  onChange={(e) => setEditViewName(e.target.value)}
                  placeholder="e.g., Roadmap"
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                  disabled={isUpdatingView}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="editViewTag"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Short Tag
                </label>
                <input
                  id="editViewTag"
                  type="text"
                  value={editViewTag}
                  onChange={(e) => setEditViewTag(e.target.value.slice(0, 10))}
                  placeholder="e.g., RDM"
                  maxLength={10}
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                  disabled={isUpdatingView}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Icon
                </label>
                <IconPicker
                  value={editViewIcon}
                  onChange={setEditViewIcon}
                  disabled={isUpdatingView}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingViewId(null)}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                  disabled={isUpdatingView}
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
    </AppLayout>
  );
}

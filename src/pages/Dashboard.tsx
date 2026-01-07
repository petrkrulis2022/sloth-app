import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { useCommand } from "@/contexts";
import { useToast } from "@/components/ui";
import { getProjects, createProject, getCurrentSession } from "@/services";
import type { Project } from "@/types";

export function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const { setAppContext, setCreateHandler } = useCommand();
  const { addToast } = useToast();

  // Fetch projects on mount
  const fetchProjects = useCallback(async () => {
    const session = getCurrentSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setIsLoading(true);

    const result = await getProjects(session.userId);
    if (result.success && result.data) {
      setProjects(result.data);
    } else {
      addToast("error", result.message || "Failed to load projects");
    }

    setIsLoading(false);
  }, [navigate, addToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = useCallback(() => {
    setShowCreateModal(true);
    setNewProjectName("");
  }, []);

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const session = getCurrentSession();
    if (!session) {
      navigate("/login");
      return;
    }

    if (!newProjectName.trim()) {
      return;
    }

    setIsCreating(true);

    // Optimistic update - add project immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticProject: Project = {
      id: tempId,
      name: newProjectName.trim(),
      ownerId: session.userId,
      perplexitySpaceId: null,
      perplexitySpaceName: null,
      perplexityApiKey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjects((prev) => [...prev, optimisticProject]);
    setShowCreateModal(false);
    setNewProjectName("");

    const result = await createProject(newProjectName.trim(), session.userId);

    if (result.success && result.data) {
      // Replace optimistic project with real one
      setProjects((prev) =>
        prev.map((p) => (p.id === tempId ? result.data! : p))
      );
      addToast("success", `Project "${result.data.name}" created successfully`);
    } else {
      // Rollback optimistic update
      setProjects((prev) => prev.filter((p) => p.id !== tempId));
      addToast("error", result.message || "Failed to create project");
    }

    setIsCreating(false);
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  // Set up context and keyboard shortcut handler
  useEffect(() => {
    setAppContext("dashboard");
    setCreateHandler(handleCreateProject);
    return () => setCreateHandler(undefined);
  }, [setAppContext, setCreateHandler, handleCreateProject]);

  return (
    <AppLayout
      projects={projects}
      onCreateProject={handleCreateProject}
      onSelectProject={handleSelectProject}
    >
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold text-primary mb-6">Dashboard</h2>

        {isLoading ? (
          <div className="bg-surface rounded-lg border border-default p-8 text-center">
            <div className="animate-pulse text-secondary">
              Loading projects...
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-surface rounded-lg border border-default p-8 text-center">
            <div className="text-4xl mb-4">🦥</div>
            <h3 className="text-lg font-medium text-primary mb-2">
              No projects yet
            </h3>
            <p className="text-secondary mb-6">
              Create your first project to get started with Sloth.app
            </p>
            <button
              onClick={handleCreateProject}
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
              Create New Project
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className="bg-surface hover:bg-surface-hover border border-default hover:border-hover rounded-lg p-4 text-left transition-colors"
              >
                <h3 className="text-lg font-medium text-primary">
                  {project.name}
                </h3>
                <p className="text-sm text-muted mt-1">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Create New Project
            </h3>
            <form onSubmit={handleSubmitCreate}>
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
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                  disabled={isCreating}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim() || isCreating}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                >
                  {isCreating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

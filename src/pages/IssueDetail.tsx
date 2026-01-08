import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { IssueList } from "@/components/issue";
import { CommentBox } from "@/components/comment";
import { DocumentsBox } from "@/components/document";
import { LinksBox } from "@/components/link";
import { AIChatBox } from "@/components/ai";
import { useCommand } from "@/contexts";
import { useToast } from "@/components/ui";
import {
  getIssue,
  getSubIssues,
  createSubIssue,
  updateIssue,
  getProjects,
  getCurrentSession,
} from "@/services";
import type { Project, Issue } from "@/types";

export function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setAppContext, setCreateHandler } = useCommand();
  const { addToast } = useToast();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [subIssues, setSubIssues] = useState<Issue[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateSubIssueModal, setShowCreateSubIssueModal] = useState(false);
  const [newSubIssueName, setNewSubIssueName] = useState("");
  const [newSubIssueDescription, setNewSubIssueDescription] = useState("");
  const [isCreatingSubIssue, setIsCreatingSubIssue] = useState(false);
  const [showDevelopmentSection, setShowDevelopmentSection] = useState(false);
  const [developmentNotes, setDevelopmentNotes] = useState("");
  const [isSavingDevelopmentNotes, setIsSavingDevelopmentNotes] =
    useState(false);
  const session = getCurrentSession();

  // Fetch issue data
  const fetchIssueData = useCallback(async () => {
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

    // Initialize development notes
    setDevelopmentNotes(issueResult.data.developmentNotes || "");

    // Fetch sub-issues
    const subIssuesResult = await getSubIssues(id);
    if (subIssuesResult.success && subIssuesResult.data) {
      setSubIssues(subIssuesResult.data);
    }

    // Fetch all projects for sidebar
    const projectsResult = await getProjects(session.userId);
    if (projectsResult.success && projectsResult.data) {
      setAllProjects(projectsResult.data);
    }

    setIsLoading(false);
  }, [id, navigate, addToast]);

  useEffect(() => {
    fetchIssueData();
  }, [fetchIssueData]);

  const handleAddSubIssue = useCallback(() => {
    setShowCreateSubIssueModal(true);
    setNewSubIssueName("");
    setNewSubIssueDescription("");
  }, []);

  const handleSubmitCreateSubIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !issue) return;

    const session = getCurrentSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setIsCreatingSubIssue(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticSubIssue: Issue = {
      id: tempId,
      viewId: issue.viewId,
      parentId: id,
      name: newSubIssueName,
      description: newSubIssueDescription || null,
      createdBy: session.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSubIssues((prev) => [...prev, optimisticSubIssue]);
    setShowCreateSubIssueModal(false);
    setNewSubIssueName("");
    setNewSubIssueDescription("");

    const result = await createSubIssue(
      id,
      newSubIssueName,
      newSubIssueDescription || null,
      session.userId
    );

    if (result.success && result.data) {
      // Replace optimistic sub-issue with real one
      setSubIssues((prev) =>
        prev.map((i) => (i.id === tempId ? result.data! : i))
      );
      addToast(
        "success",
        `Sub-issue "${result.data.name}" created successfully`
      );
    } else {
      // Rollback optimistic update
      setSubIssues((prev) => prev.filter((i) => i.id !== tempId));
      addToast("error", result.message || "Failed to create sub-issue");
    }

    setIsCreatingSubIssue(false);
  };

  const handleSaveDevelopmentNotes = async () => {
    if (!id) return;

    setIsSavingDevelopmentNotes(true);

    const result = await updateIssue(id, {
      developmentNotes: developmentNotes.trim() || null,
    });

    if (result.success && result.data) {
      setIssue(result.data);
      addToast("success", "Development notes saved");
    } else {
      addToast("error", result.message || "Failed to save development notes");
    }

    setIsSavingDevelopmentNotes(false);
  };

  const handleToggleDevelopmentSection = () => {
    setShowDevelopmentSection(!showDevelopmentSection);
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
    setAppContext("issue");
    setCreateHandler(handleAddSubIssue);
    return () => setCreateHandler(undefined);
  }, [setAppContext, setCreateHandler, handleAddSubIssue]);

  if (isLoading) {
    return (
      <AppLayout
        projects={allProjects}
        onCreateProject={handleCreateProject}
        onSelectProject={handleSelectProject}
      >
        <div className="bg-surface rounded-lg border border-default p-8 text-center">
          <div className="animate-pulse text-secondary">Loading issue...</div>
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
            The issue you're looking for doesn't exist or you don't have access.
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
      <div className="flex gap-6 h-full">
        {/* Main content area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Issue Title */}
          <div>
            <h2 className="text-2xl font-semibold text-primary mb-2">
              {issue.name}
            </h2>
            {issue.description && (
              <p className="text-secondary">{issue.description}</p>
            )}
          </div>

          {/* Development Section */}
          <div className="bg-surface border border-default rounded-lg">
            <button
              onClick={handleToggleDevelopmentSection}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition-colors"
            >
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
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                Development Plan
              </h3>
              <svg
                className={`w-5 h-5 text-secondary transition-transform ${
                  showDevelopmentSection ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showDevelopmentSection && (
              <div className="px-4 pb-4 space-y-4 border-t border-default pt-4">
                {/* Development Notes */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Technical Notes & Implementation Details
                  </label>
                  <textarea
                    value={developmentNotes}
                    onChange={(e) => setDevelopmentNotes(e.target.value)}
                    placeholder="Add technical notes, architecture decisions, implementation steps..."
                    className="w-full px-3 py-2 bg-background border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 min-h-[120px] resize-y"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleSaveDevelopmentNotes}
                      disabled={isSavingDevelopmentNotes}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      {isSavingDevelopmentNotes ? "Saving..." : "Save Notes"}
                    </button>
                  </div>
                </div>

                {/* Development Tasks (Sub-Issues with parent_id) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-primary">
                      Development Tasks
                    </h4>
                    <button
                      onClick={handleAddSubIssue}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface hover:bg-surface-hover border border-default hover:border-hover text-secondary hover:text-primary rounded text-xs transition-colors"
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

                  {subIssues.length === 0 ? (
                    <div className="bg-background rounded border border-default p-3 text-center">
                      <p className="text-xs text-muted">
                        No development tasks yet. Add tasks to track
                        implementation progress.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {subIssues.map((subIssue) => (
                        <div
                          key={subIssue.id}
                          onClick={() => handleSelectIssue(subIssue.id)}
                          className="bg-background border border-default rounded p-3 hover:border-hover cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-primary font-medium">
                              {subIssue.name}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                subIssue.status === "done"
                                  ? "bg-green-500/20 text-green-400"
                                  : subIssue.status === "in-progress"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {subIssue.status === "not-started"
                                ? "Not Started"
                                : subIssue.status === "in-progress"
                                ? "In Progress"
                                : "Done"}
                            </span>
                          </div>
                          {subIssue.description && (
                            <p className="text-xs text-muted mt-1">
                              {subIssue.description}
                            </p>
                          )}
                        </div>
                      ))}
                      <div className="mt-3 pt-3 border-t border-default">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted">Progress</span>
                          <span className="text-primary font-medium">
                            {
                              subIssues.filter((i) => i.status === "done")
                                .length
                            }{" "}
                            / {subIssues.length} complete
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
              contextType="issue"
              contextId={issue.id}
              userId={session?.userId || ""}
            />
          </div>

          {/* Sub-issues section - now just shows linked issues */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-primary">
                Related Issues
              </h3>
              <button
                onClick={handleAddSubIssue}
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
                Add Related Issue
              </button>
            </div>

            {subIssues.length === 0 ? (
              <div className="bg-surface rounded-lg border border-default p-4 text-center">
                <p className="text-sm text-muted">No related issues yet</p>
              </div>
            ) : (
              <IssueList issues={subIssues} onSelect={handleSelectIssue} />
            )}
          </div>

          {/* Comments section */}
          <div className="bg-surface border border-default rounded-lg p-4">
            <CommentBox issueId={issue.id} />
          </div>
        </div>

        {/* Right-hand context sidebar - Only Documents and Links */}
        <aside className="w-80 flex-shrink-0">
          <div className="bg-surface border border-default rounded-lg p-4 h-fit space-y-6">
            {/* Documents Box */}
            <DocumentsBox contextType="issue" contextId={issue.id} />

            {/* Links Box */}
            <LinksBox contextType="issue" contextId={issue.id} />
          </div>
        </aside>
      </div>

      {/* Create Sub-Issue Modal */}
      {showCreateSubIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-primary mb-4">
              Add Sub-Issue
            </h3>
            <form onSubmit={handleSubmitCreateSubIssue}>
              <div className="mb-4">
                <label
                  htmlFor="subIssueName"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Sub-Issue Name
                </label>
                <input
                  id="subIssueName"
                  type="text"
                  value={newSubIssueName}
                  onChange={(e) => setNewSubIssueName(e.target.value)}
                  placeholder="Enter sub-issue name"
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                  disabled={isCreatingSubIssue}
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="subIssueDescription"
                  className="block text-sm font-medium text-secondary mb-2"
                >
                  Description
                </label>
                <textarea
                  id="subIssueDescription"
                  value={newSubIssueDescription}
                  onChange={(e) => setNewSubIssueDescription(e.target.value)}
                  placeholder="Describe the sub-issue..."
                  rows={4}
                  className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  disabled={isCreatingSubIssue}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateSubIssueModal(false)}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                  disabled={isCreatingSubIssue}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSubIssueName.trim() || isCreatingSubIssue}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
                >
                  {isCreatingSubIssue ? "Creating..." : "Add Sub-Issue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

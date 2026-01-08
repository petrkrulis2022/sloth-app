import { Issue, IssueStatus } from "@/types";

interface KanbanBoardProps {
  issues: Issue[];
  onSelectIssue: (id: string) => void;
  onEditIssue: (issue: Issue) => void;
  onDeleteIssue: (id: string) => void;
  onUpdateStatus: (id: string, status: IssueStatus) => void;
}

const STATUS_CONFIG = {
  "not-started": {
    label: "Not Started",
    color: "bg-gray-900/30 border-gray-700",
    dotColor: "bg-gray-500",
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-blue-900/30 border-blue-700",
    dotColor: "bg-blue-500",
  },
  done: {
    label: "Done",
    color: "bg-teal-900/30 border-teal-700",
    dotColor: "bg-teal-500",
  },
};

export function KanbanBoard({
  issues,
  onSelectIssue,
  onEditIssue,
  onDeleteIssue,
  onUpdateStatus,
}: KanbanBoardProps) {
  const statuses: IssueStatus[] = ["not-started", "in-progress", "done"];

  const getIssuesByStatus = (status: IssueStatus) => {
    return issues.filter((issue) => issue.status === status);
  };

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {statuses.map((status) => {
        const statusIssues = getIssuesByStatus(status);
        const config = STATUS_CONFIG[status];

        return (
          <div key={status} className="flex flex-col min-h-0">
            {/* Column Header */}
            <div className={`${config.color} border rounded-lg p-3 mb-3`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                <h3 className="text-sm font-medium text-primary">
                  {config.label}
                </h3>
                <span className="ml-auto text-xs text-muted">
                  {statusIssues.length}
                </span>
              </div>
            </div>

            {/* Issues Column */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {statusIssues.length === 0 ? (
                <div className="bg-surface/50 border border-default rounded-lg p-4 text-center">
                  <p className="text-xs text-muted">No issues</p>
                </div>
              ) : (
                statusIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-surface border border-default hover:border-hover rounded-lg p-3 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <button
                          onClick={() => onSelectIssue(issue.id)}
                          className="text-left text-sm font-medium text-primary hover:text-teal-400 transition-colors block"
                        >
                          {issue.name}
                        </button>
                        {issue.issueId && (
                          <span className="text-xs font-mono text-muted mt-1 block">
                            {issue.issueId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditIssue(issue);
                          }}
                          className="p-1 hover:bg-surface-hover rounded transition-colors"
                          title="Edit"
                        >
                          <svg
                            className="w-3 h-3 text-secondary hover:text-primary"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteIssue(issue.id);
                          }}
                          className="p-1 hover:bg-red-900/30 rounded transition-colors"
                          title="Delete"
                        >
                          <svg
                            className="w-3 h-3 text-secondary hover:text-red-400"
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

                    {issue.description && (
                      <p className="text-xs text-muted line-clamp-2 mb-2">
                        {issue.description}
                      </p>
                    )}

                    {/* Status Change Buttons */}
                    <div className="flex gap-1 pt-2 border-t border-default">
                      {status !== "not-started" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const prevStatus =
                              status === "done" ? "in-progress" : "not-started";
                            onUpdateStatus(issue.id, prevStatus);
                          }}
                          className="flex-1 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-surface-hover rounded transition-colors"
                        >
                          ←
                        </button>
                      )}
                      {status !== "done" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextStatus =
                              status === "not-started" ? "in-progress" : "done";
                            onUpdateStatus(issue.id, nextStatus);
                          }}
                          className="flex-1 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-surface-hover rounded transition-colors"
                        >
                          →
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import type { Issue } from "@/types";

export interface IssueListProps {
  issues: Issue[];
  onSelect: (issueId: string) => void;
  onEdit?: (issue: Issue) => void;
  onDelete?: (issueId: string) => void;
}

/**
 * Displays a list of issues with name preview
 * Requirements: 7.1
 */
export function IssueList({
  issues,
  onSelect,
  onEdit,
  onDelete,
}: IssueListProps) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="bg-surface border border-default hover:border-hover rounded-lg p-4 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <button
              onClick={() => onSelect(issue.id)}
              className="flex-1 text-left hover:opacity-80 transition-opacity"
            >
              <h3 className="text-base font-medium text-primary">
                {issue.name}
              </h3>
              {issue.description && (
                <p className="text-sm text-secondary mt-1 line-clamp-2">
                  {issue.description}
                </p>
              )}
            </button>
            {(onEdit || onDelete) && (
              <div className="flex gap-2 flex-shrink-0">
                {onEdit && (
                  <button
                    onClick={() => onEdit(issue)}
                    className="p-2 hover:bg-surface-hover rounded transition-colors"
                    title="Edit issue"
                  >
                    <svg
                      className="w-4 h-4 text-secondary hover:text-primary"
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
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(issue.id)}
                    className="p-2 hover:bg-red-900/30 rounded transition-colors"
                    title="Delete issue"
                  >
                    <svg
                      className="w-4 h-4 text-secondary hover:text-red-400"
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
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

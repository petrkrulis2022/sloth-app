import type { Issue } from "@/types";

export interface IssueListProps {
  issues: Issue[];
  onSelect: (issueId: string) => void;
}

/**
 * Displays a list of issues with name preview
 * Requirements: 7.1
 */
export function IssueList({ issues, onSelect }: IssueListProps) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <button
          key={issue.id}
          onClick={() => onSelect(issue.id)}
          className="w-full bg-surface hover:bg-surface-hover border border-default hover:border-hover rounded-lg p-4 text-left transition-colors"
        >
          <h3 className="text-base font-medium text-primary">{issue.name}</h3>
          {issue.description && (
            <p className="text-sm text-secondary mt-1 line-clamp-2">
              {issue.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

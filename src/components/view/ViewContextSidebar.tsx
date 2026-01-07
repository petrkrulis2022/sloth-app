import { DocumentsBox } from "@/components/document";
import { LinksBox } from "@/components/link";
import { AIChatBox } from "@/components/ai";

export interface ViewContextSidebarProps {
  viewId: string;
  userId: string;
}

/**
 * Right-hand context sidebar for View workspace
 * Integrates DocumentsBox, LinksBox, and AIChatBox with strategic configuration
 * Requirements: 8.1, 8.2, 8.4, 8.5
 */
export function ViewContextSidebar({
  viewId,
  userId,
}: ViewContextSidebarProps) {
  return (
    <aside className="w-80 flex-shrink-0">
      <div className="bg-surface border border-default rounded-lg p-4 h-fit space-y-6">
        {/* Documents Box - View-level documents */}
        <DocumentsBox contextType="view" contextId={viewId} />

        {/* Links Box - View-level links */}
        <LinksBox contextType="view" contextId={viewId} />

        {/* AI Discussion Box - Strategic assistant */}
        <div>
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
            AI Discussion
          </h3>
          <AIChatBox contextType="view" contextId={viewId} userId={userId} />
        </div>
      </div>
    </aside>
  );
}

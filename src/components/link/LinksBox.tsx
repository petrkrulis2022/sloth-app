import { useState, useEffect, useCallback } from "react";
import { getLinks, addLink, deleteLink } from "@/services/link";
import { getCurrentSession } from "@/services/auth";
import type { LinkWithCreator, LinkContextType } from "@/types";

export interface LinksBoxProps {
  contextType: LinkContextType;
  contextId: string;
}

/**
 * Displays links with descriptions
 * Supports adding new links with URL and description fields
 * Requirements: 8.4, 13.3
 */
export function LinksBox({ contextType, contextId }: LinksBoxProps) {
  const [links, setLinks] = useState<LinkWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Fetch links
  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getLinks(contextType, contextId);
    if (result.success && result.data) {
      setLinks(result.data);
    } else {
      setError(result.message || "Failed to load links.");
    }

    setIsLoading(false);
  }, [contextType, contextId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Handle adding a new link
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();

    const session = getCurrentSession();
    if (!session) {
      setError("You must be logged in to add links.");
      return;
    }

    if (!newUrl.trim()) {
      setError("URL is required.");
      return;
    }

    setIsAdding(true);
    setError(null);

    const result = await addLink(
      newUrl,
      newDescription || undefined,
      contextType,
      contextId,
      session.userId
    );

    if (result.success) {
      await fetchLinks();
      setNewUrl("");
      setNewDescription("");
      setShowAddForm(false);
    } else {
      setError(result.message || "Failed to add link.");
    }

    setIsAdding(false);
  };

  // Handle link deletion
  const handleDelete = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this link?")) {
      return;
    }

    const result = await deleteLink(linkId);
    if (result.success) {
      await fetchLinks();
    } else {
      setError(result.message || "Failed to delete link.");
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  // Get favicon URL for a domain
  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // Could add a toast notification here if desired
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  if (isLoading) {
    return (
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
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Links
        </h3>
        <div className="text-sm text-muted animate-pulse">Loading links...</div>
      </div>
    );
  }

  return (
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
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        Links
        {links.length > 0 && (
          <span className="text-xs text-muted">({links.length})</span>
        )}
      </h3>

      {/* Error message */}
      {error && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-800 rounded-md">
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-400 hover:text-red-300 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Links list */}
      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
        {links.length === 0 ? (
          <div className="text-sm text-muted">No links added.</div>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="bg-app rounded-md p-3 flex items-start gap-3 group"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getFaviconUrl(link.url) ? (
                  <img
                    src={getFaviconUrl(link.url)!}
                    alt=""
                    className="w-4 h-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <svg
                    className="w-4 h-4 text-teal-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:text-teal-400 transition-colors block truncate"
                  title={link.url}
                >
                  {link.description || getDomain(link.url)}
                </a>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="truncate">{getDomain(link.url)}</span>
                  <span>•</span>
                  <span>{formatDate(link.createdAt)}</span>
                </div>
              </div>
              <button
                onClick={() => handleCopyUrl(link.url)}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-teal-400 transition-all p-1 flex-shrink-0"
                title="Copy URL"
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
              </button>
              <button
                onClick={() => handleDelete(link.id)}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all p-1 flex-shrink-0"
                title="Delete link"
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
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add link form */}
      {showAddForm ? (
        <form onSubmit={handleAddLink} className="space-y-3">
          <div>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-app border border-default rounded-md px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-teal-500 transition-colors"
              disabled={isAdding}
              autoFocus
            />
          </div>
          <div>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-app border border-default rounded-md px-3 py-2 text-sm text-primary placeholder-muted focus:outline-none focus:border-teal-500 transition-colors"
              disabled={isAdding}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isAdding || !newUrl.trim()}
              className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:cursor-not-allowed text-white text-sm py-2 px-3 rounded-md transition-colors"
            >
              {isAdding ? "Adding..." : "Add Link"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewUrl("");
                setNewDescription("");
                setError(null);
              }}
              disabled={isAdding}
              className="px-3 py-2 text-sm text-muted hover:text-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full border-2 border-dashed border-default hover:border-teal-600 rounded-md p-3 text-center transition-colors"
        >
          <span className="text-sm text-muted hover:text-primary transition-colors">
            <span className="text-teal-400">+ Add link</span>
          </span>
        </button>
      )}
    </div>
  );
}

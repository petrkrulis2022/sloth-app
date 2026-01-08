import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useCommand } from "@/contexts";
import type { Project, View } from "@/types";

interface AppLayoutProps {
  children: ReactNode;
  projects?: Project[];
  activeProjectId?: string;
  onCreateProject?: () => void;
  onSelectProject?: (projectId: string) => void;
  views?: View[];
  activeViewId?: string;
  onSelectView?: (viewId: string) => void;
  onCreateView?: () => void;
}

export function AppLayout({
  children,
  projects = [],
  activeProjectId,
  onCreateProject,
  onSelectProject,
  views = [],
  activeViewId,
  onSelectView,
  onCreateView,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const { openCommandPalette, appContext } = useCommand();

  // Get context-specific shortcut hint
  const getCreateShortcutHint = () => {
    switch (appContext) {
      case "dashboard":
        return "Create Project";
      case "project":
        return "Create View";
      case "view":
        return "Create Issue";
      case "issue":
        return "Add Sub-Issue";
      default:
        return "Create";
    }
  };

  return (
    <div className="min-h-screen bg-app text-primary flex">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onCreateProject={onCreateProject}
        onSelectProject={onSelectProject}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with logo */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-default bg-surface">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src="/sloth.svg"
              alt="Sloth.app"
              className="w-8 h-8 flex-shrink-0"
            />
            <h1 className="text-xl font-semibold text-primary flex-shrink-0">
              Sloth.app
            </h1>

            {/* Horizontal Views List */}
            {(views.length > 0 || onCreateView) && (
              <div className="flex-1 min-w-0 ml-6">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-charcoal-700 scrollbar-track-transparent pb-1">
                  {views.map((view) => (
                    <button
                      key={view.id}
                      onClick={() => onSelectView?.(view.id)}
                      className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        activeViewId === view.id
                          ? "bg-teal-600 text-white"
                          : "bg-app hover:bg-surface-hover text-secondary hover:text-primary border border-default"
                      }`}
                    >
                      <span className="text-lg">{view.icon || "📋"}</span>
                      <div className="flex flex-col items-start">
                        <span>{view.name}</span>
                        <span className="text-xs font-mono opacity-75">
                          {view.tag}
                        </span>
                      </div>
                    </button>
                  ))}
                  {onCreateView && (
                    <button
                      onClick={onCreateView}
                      className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-app hover:bg-surface-hover text-secondary hover:text-primary border border-default border-dashed transition-colors whitespace-nowrap"
                      title="Create New View"
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
                      <span>Create View</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Keyboard shortcuts indicator */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              onClick={() => navigate("/settings")}
              className="flex items-center gap-2 px-3 py-1.5 bg-app hover:bg-surface-hover border border-default rounded-md text-sm text-secondary hover:text-primary transition-colors"
              title="Settings"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Settings</span>
            </button>

            <button
              onClick={openCommandPalette}
              className="flex items-center gap-2 px-3 py-1.5 bg-app hover:bg-surface-hover border border-default rounded-md text-sm text-secondary hover:text-primary transition-colors"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Search</span>
              <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-charcoal-800 rounded">
                ⌘K
              </kbd>
            </button>

            <div className="hidden md:flex items-center gap-2 text-xs text-muted">
              <kbd className="px-1.5 py-0.5 bg-charcoal-800 rounded">C</kbd>
              <span>{getCreateShortcutHint()}</span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

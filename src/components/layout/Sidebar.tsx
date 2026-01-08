import type { Project } from "@/types";

interface SidebarProps {
  projects: Project[];
  activeProjectId?: string;
  onCreateProject?: () => void;
  onSelectProject?: (projectId: string) => void;
}

export function Sidebar({
  projects,
  activeProjectId,
  onCreateProject,
  onSelectProject,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-surface border-r border-default flex flex-col h-screen">
      {/* Logo header */}
      <div className="p-4 border-b border-default flex items-center gap-3">
        <img
          src="/sloth.svg"
          alt="Sloth.app"
          className="w-8 h-8 flex-shrink-0"
        />
        <h1 className="text-xl font-semibold text-primary">
          Sloth.app
        </h1>
      </div>

      {/* Projects header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-sm font-medium text-secondary uppercase tracking-wider">
          Projects
        </h2>
      </div>

      {/* Project list */}
      <nav className="flex-1 overflow-y-auto p-2">
        {projects.length === 0 ? (
          <p className="text-sm text-muted px-3 py-2">No projects yet</p>
        ) : (
          <ul className="space-y-1">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  onClick={() => onSelectProject?.(project.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeProjectId === project.id
                      ? "bg-teal-900/30 text-teal-400 border border-teal-800"
                      : "text-secondary hover:bg-surface-hover hover:text-primary"
                  }`}
                >
                  <span className="truncate block">{project.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Create project button */}
      <div className="p-4 border-t border-default">
        <button
          onClick={onCreateProject}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
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
    </aside>
  );
}

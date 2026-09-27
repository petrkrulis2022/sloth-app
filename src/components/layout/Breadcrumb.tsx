export interface BreadcrumbItem {
  label: string;
  icon?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Shows the Project > View > Issue trail for the current page so it's
 * always clear how deep in the hierarchy the user is.
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 px-6 pt-3 text-sm text-secondary overflow-x-auto scrollbar-thin scrollbar-thumb-charcoal-700 scrollbar-track-transparent"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5 whitespace-nowrap">
            {index > 0 && (
              <svg
                className="w-3.5 h-3.5 text-muted flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {item.icon && <span>{item.icon}</span>}
            {item.onClick && !isLast ? (
              <button
                onClick={item.onClick}
                className="hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className={isLast ? "text-primary font-medium" : ""}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

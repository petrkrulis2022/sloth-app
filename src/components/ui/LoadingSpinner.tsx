interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Loading spinner component for async operations
 */
export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }[size];

  return (
    <svg
      className={`animate-spin ${sizeClasses} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

interface LoadingOverlayProps {
  message?: string;
}

/**
 * Full-page loading overlay
 */
export function LoadingOverlay({
  message = "Loading...",
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-app/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-surface border border-default rounded-lg p-6 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" className="text-teal-500" />
        <p className="text-secondary text-sm">{message}</p>
      </div>
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

/**
 * Inline loading state for content areas
 */
export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="bg-surface rounded-lg border border-default p-8 text-center">
      <LoadingSpinner size="lg" className="text-teal-500 mx-auto mb-4" />
      <p className="text-secondary animate-pulse">{message}</p>
    </div>
  );
}

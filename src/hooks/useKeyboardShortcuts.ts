import { useEffect, useCallback } from "react";

export type AppContext =
  | "global"
  | "dashboard"
  | "project"
  | "view"
  | "issue"
  | "settings";

interface KeyboardShortcutHandlers {
  onCommandPalette?: () => void;
  onCreate?: () => void;
}

interface UseKeyboardShortcutsOptions {
  context: AppContext;
  handlers: KeyboardShortcutHandlers;
  enabled?: boolean;
}

/**
 * Hook for managing global keyboard shortcuts.
 *
 * Shortcuts:
 * - Cmd/Ctrl + K: Open command palette (global)
 * - C: Create action (context-aware)
 */
export function useKeyboardShortcuts({
  context,
  handlers,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Cmd/Ctrl + K: Open command palette (works even in input fields)
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        handlers.onCommandPalette?.();
        return;
      }

      // Don't process other shortcuts if in input field
      if (isInputField) return;

      // C: Create action (context-aware)
      if (
        event.key === "c" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        handlers.onCreate?.();
        return;
      }
    },
    [handlers]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);

  return { context };
}

/**
 * Get the appropriate create action label based on context
 */
export function getCreateActionLabel(context: AppContext): string {
  switch (context) {
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
}

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CommandPalette } from "@/components/layout";
import { useKeyboardShortcuts, type AppContext } from "@/hooks";
import type { Command } from "@/types";

interface CommandContextValue {
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setAppContext: (context: AppContext) => void;
  setCreateHandler: (handler: (() => void) | undefined) => void;
  appContext: AppContext;
  showShortcutHint: (hint: string) => void;
}

const CommandContext = createContext<CommandContextValue | null>(null);

interface CommandProviderProps {
  children: ReactNode;
}

export function CommandProvider({ children }: CommandProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [appContext, setAppContext] = useState<AppContext>("global");
  const [createHandler, setCreateHandler] = useState<
    (() => void) | undefined
  >();
  const [shortcutHint, setShortcutHint] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const openCommandPalette = useCallback(() => setIsOpen(true), []);
  const closeCommandPalette = useCallback(() => setIsOpen(false), []);

  // Show a brief hint when a shortcut is triggered
  const showShortcutHint = useCallback((hint: string) => {
    setShortcutHint(hint);
    setTimeout(() => setShortcutHint(null), 1500);
  }, []);

  // Build commands based on current context
  const commands = useMemo<Command[]>(() => {
    const baseCommands: Command[] = [
      {
        id: "go-dashboard",
        label: "Go to Dashboard",
        shortcut: "G D",
        action: () => {
          navigate("/");
          showShortcutHint("Dashboard");
        },
        context: "global",
      },
      {
        id: "open-command-palette",
        label: "Open Command Palette",
        shortcut: "⌘K",
        action: () => openCommandPalette(),
        context: "global",
      },
    ];

    // Dashboard context commands
    if (appContext === "dashboard") {
      baseCommands.push({
        id: "create-project",
        label: "Create New Project",
        shortcut: "C",
        action: () => {
          createHandler?.();
          showShortcutHint("Create Project");
        },
        context: "dashboard",
      });
    }

    // Project context commands
    if (appContext === "project") {
      baseCommands.push({
        id: "create-view",
        label: "Create New View",
        shortcut: "C",
        action: () => {
          createHandler?.();
          showShortcutHint("Create View");
        },
        context: "project",
      });

      // Add back navigation
      const projectMatch = location.pathname.match(/\/project\/([^/]+)/);
      if (projectMatch) {
        baseCommands.push({
          id: "go-back-dashboard",
          label: "Back to Dashboard",
          shortcut: "⌫",
          action: () => navigate("/"),
          context: "project",
        });
      }
    }

    // View context commands
    if (appContext === "view") {
      baseCommands.push({
        id: "create-issue",
        label: "Create New Issue",
        shortcut: "C",
        action: () => {
          createHandler?.();
          showShortcutHint("Create Issue");
        },
        context: "view",
      });

      // Add back navigation to project
      baseCommands.push({
        id: "go-back-project",
        label: "Back to Project",
        shortcut: "⌫",
        action: () => window.history.back(),
        context: "view",
      });
    }

    // Issue context commands
    if (appContext === "issue") {
      baseCommands.push({
        id: "add-sub-issue",
        label: "Add Sub-Issue",
        shortcut: "C",
        action: () => {
          createHandler?.();
          showShortcutHint("Add Sub-Issue");
        },
        context: "issue",
      });

      // Add back navigation to view
      baseCommands.push({
        id: "go-back-view",
        label: "Back to View",
        shortcut: "⌫",
        action: () => window.history.back(),
        context: "issue",
      });
    }

    return baseCommands;
  }, [
    appContext,
    navigate,
    createHandler,
    showShortcutHint,
    openCommandPalette,
    location.pathname,
  ]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    context: appContext,
    handlers: {
      onCommandPalette: openCommandPalette,
      onCreate: createHandler,
    },
  });

  const value = useMemo<CommandContextValue>(
    () => ({
      isCommandPaletteOpen: isOpen,
      openCommandPalette,
      closeCommandPalette,
      setAppContext,
      setCreateHandler: (handler) => setCreateHandler(() => handler),
      appContext,
      showShortcutHint,
    }),
    [
      isOpen,
      openCommandPalette,
      closeCommandPalette,
      appContext,
      showShortcutHint,
    ]
  );

  return (
    <CommandContext.Provider value={value}>
      {children}
      <CommandPalette
        isOpen={isOpen}
        onClose={closeCommandPalette}
        commands={commands}
      />
      {/* Shortcut hint overlay */}
      {shortcutHint && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-surface border border-default rounded-lg px-4 py-2 shadow-lg">
            <span className="text-sm text-secondary">{shortcutHint}</span>
          </div>
        </div>
      )}
    </CommandContext.Provider>
  );
}

export function useCommand() {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error("useCommand must be used within a CommandProvider");
  }
  return context;
}

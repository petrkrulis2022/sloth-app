import { useState } from "react";

const VIEW_ICONS = [
  "📋",
  "📝",
  "📊",
  "📈",
  "📉",
  "🎯",
  "🎨",
  "🎬",
  "🎮",
  "🎵",
  "💡",
  "💼",
  "💻",
  "🔧",
  "🔨",
  "🔍",
  "🔬",
  "🔭",
  "🚀",
  "🛠️",
  "⚙️",
  "⚡",
  "🌟",
  "✨",
  "🔥",
  "💎",
  "🎪",
  "🎭",
  "🎤",
  "📱",
  "💾",
  "🖥️",
  "⌨️",
  "🖱️",
  "🎧",
  "📷",
  "📹",
  "🎥",
  "📡",
  "🔌",
];

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string) => void;
  disabled?: boolean;
}

export function IconPicker({ value, onChange, disabled }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getRandomIcon = () => {
    return VIEW_ICONS[Math.floor(Math.random() * VIEW_ICONS.length)];
  };

  const handleSelect = (icon: string) => {
    onChange(icon);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-12 h-12 flex items-center justify-center text-2xl bg-surface border border-default rounded-md hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Choose icon"
        >
          {value || "📋"}
        </button>
        <button
          type="button"
          onClick={() => onChange(getRandomIcon())}
          disabled={disabled}
          className="px-3 py-2 text-sm text-muted hover:text-primary border border-default rounded-md hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Random icon"
        >
          🎲 Random
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-80 bg-surface border border-default rounded-lg shadow-xl z-50 p-3">
            <div className="text-xs font-medium text-secondary mb-2 uppercase tracking-wider">
              Choose an icon
            </div>
            <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
              {VIEW_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleSelect(icon)}
                  className={`w-8 h-8 flex items-center justify-center text-xl rounded hover:bg-surface-hover transition-colors ${
                    value === icon ? "bg-teal-500/20 ring-2 ring-teal-500" : ""
                  }`}
                  title={icon}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

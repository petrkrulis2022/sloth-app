import { useState, useEffect } from "react";
import {
  saveUserApiKey,
  getUserApiKeyStatus,
  removeUserApiKey,
} from "@/services/perplexity";
import { useToast } from "@/components/ui/Toast";

interface PerplexitySettingsProps {
  userId: string;
}

export function PerplexitySettings({ userId }: PerplexitySettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { addToast } = useToast();

  // Load API key status on mount
  useEffect(() => {
    loadApiKeyStatus();
  }, [userId]);

  const loadApiKeyStatus = async () => {
    setIsLoading(true);
    try {
      const response = await getUserApiKeyStatus(userId);
      if (response.success && response.data) {
        setHasApiKey(response.data.hasApiKey);
      } else {
        addToast("error", response.message || "Failed to load API key status");
      }
    } catch (error) {
      addToast("error", "Failed to load API key status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      addToast("error", "Please enter an API key");
      return;
    }

    setIsSaving(true);
    try {
      const response = await saveUserApiKey(userId, apiKey);
      if (response.success) {
        addToast("success", "API key saved successfully");
        setApiKey("");
        setHasApiKey(true);
      } else {
        addToast("error", response.message || "Failed to save API key");
      }
    } catch (error) {
      addToast("error", "Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove your Perplexity API key?")) {
      return;
    }

    setIsRemoving(true);
    try {
      const response = await removeUserApiKey(userId);
      if (response.success) {
        addToast("success", "API key removed successfully");
        setHasApiKey(false);
      } else {
        addToast("error", response.message || "Failed to remove API key");
      }
    } catch (error) {
      addToast("error", "Failed to remove API key");
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl p-6 bg-surface rounded-xl">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Perplexity Integration
        </h3>
        <p className="text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl p-6 bg-surface rounded-xl">
      <h3 className="text-lg font-semibold text-primary mb-4">
        Perplexity Integration
      </h3>

      <div className="space-y-4">
        {/* API Key Status */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            API Key Status
          </label>
          <div className="flex items-center gap-2 px-3 py-2 bg-charcoal-900 border border-default rounded-lg">
            <span
              className={`w-2 h-2 rounded-full ${
                hasApiKey ? "bg-teal-500" : "bg-gray-500"
              }`}
            ></span>
            <span className="text-primary">
              {hasApiKey ? "Configured" : "Not configured"}
            </span>
          </div>
        </div>

        {/* API Key Input */}
        <div>
          <label
            htmlFor="perplexity-api-key"
            className="block text-sm font-medium text-secondary mb-1"
          >
            {hasApiKey ? "Update API Key" : "Enter API Key"}
          </label>
          <input
            id="perplexity-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="pplx-..."
            className="w-full px-3 py-2 bg-charcoal-800 border border-default rounded-lg text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-secondary">
            Get your API key from{" "}
            <a
              href="https://www.perplexity.ai/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 underline"
            >
              Perplexity Settings
            </a>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !apiKey.trim()}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : hasApiKey ? "Update Key" : "Save Key"}
          </button>

          {hasApiKey && (
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRemoving ? "Removing..." : "Remove Key"}
            </button>
          )}
        </div>

        {/* Info Message */}
        <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
          <p className="text-sm text-blue-400">
            Your API key is encrypted and stored securely. It will be used for
            AI chat in your projects and issues.
          </p>
        </div>
      </div>
    </div>
  );
}

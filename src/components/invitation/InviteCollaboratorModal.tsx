import { useState } from "react";
import { inviteCollaborator } from "@/services/invitation";
import { getCurrentSession } from "@/services/auth";

interface InviteCollaboratorModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteCollaboratorModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
}: InviteCollaboratorModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError("Please enter an email address.");
      return;
    }

    const session = getCurrentSession();
    if (!session) {
      setError("You must be logged in to invite collaborators.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await inviteCollaborator(
        projectId,
        email.trim(),
        session.userId
      );

      if (result.success) {
        setSuccessMessage(result.message || "Invitation sent successfully!");
        setEmail("");
        onSuccess?.();
        // Close modal after a short delay to show success message
        setTimeout(() => {
          onClose();
          setSuccessMessage(null);
        }, 1500);
      } else {
        setError(result.message || "Failed to send invitation.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface border border-default rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Invite Collaborator
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="inviteEmail"
              className="block text-sm font-medium text-secondary mb-2"
            >
              Email Address
            </label>
            <input
              id="inviteEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collaborator@example.com"
              className="w-full px-3 py-2 bg-app border border-default rounded-md text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              autoFocus
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-muted">
              The collaborator will receive an invitation to join this project.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-teal-900/20 border border-teal-800 rounded-lg">
              <p className="text-sm text-teal-400">{successMessage}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-secondary hover:text-primary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
            >
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

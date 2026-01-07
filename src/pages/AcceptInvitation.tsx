import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getInvitationWithProject,
  acceptInvitation,
} from "@/services/invitation";
import { getCurrentSession, getCurrentUser } from "@/services/auth";
import type { Invitation } from "@/types/invitation";
import type { User } from "@/types/auth";

export function AcceptInvitation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [inviterEmail, setInviterEmail] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchInvitationData = useCallback(async () => {
    if (!id) {
      setError("Invalid invitation link.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Fetch invitation details
    const result = await getInvitationWithProject(id);

    if (!result.success || !result.data) {
      setError(result.message || "Invitation not found.");
      setIsLoading(false);
      return;
    }

    setInvitation(result.data.invitation);
    setProjectName(result.data.projectName);
    setInviterEmail(result.data.inviterEmail);

    // Check if user is logged in
    const session = getCurrentSession();
    if (session) {
      const user = await getCurrentUser();
      setCurrentUser(user);
    }

    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchInvitationData();
  }, [fetchInvitationData]);

  const handleAccept = async () => {
    if (!id || !currentUser) return;

    setIsAccepting(true);
    setError(null);

    const result = await acceptInvitation(id, currentUser.id);

    if (result.success) {
      setSuccess(true);
      // Redirect to project after a short delay
      setTimeout(() => {
        navigate(`/project/${invitation?.projectId}`);
      }, 2000);
    } else {
      setError(result.message || "Failed to accept invitation.");
    }

    setIsAccepting(false);
  };

  const handleLoginRedirect = () => {
    // Store invitation ID to redirect back after login
    sessionStorage.setItem("pendingInvitation", id || "");
    navigate("/login");
  };

  const handleSignupRedirect = () => {
    // Store invitation ID to redirect back after signup
    sessionStorage.setItem("pendingInvitation", id || "");
    navigate("/signup");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="bg-surface border border-default rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-pulse text-secondary">
            Loading invitation...
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="bg-surface border border-default rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-primary mb-2">
            Invalid Invitation
          </h2>
          <p className="text-secondary mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="bg-surface border border-default rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-teal-900/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-teal-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-primary mb-2">
            Invitation Accepted!
          </h2>
          <p className="text-secondary">
            You now have access to{" "}
            <span className="text-primary font-medium">{projectName}</span>.
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  const isExpired = invitation?.status === "expired";
  const isAlreadyAccepted = invitation?.status === "accepted";
  const emailMismatch =
    currentUser &&
    invitation &&
    currentUser.email.toLowerCase() !== invitation.email.toLowerCase();

  return (
    <div className="min-h-screen bg-app flex items-center justify-center">
      <div className="bg-surface border border-default rounded-lg p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-teal-900/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-teal-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-primary mb-2">
            Project Invitation
          </h2>
          <p className="text-secondary">
            You've been invited to collaborate on a project
          </p>
        </div>

        {/* Invitation Details */}
        <div className="bg-app rounded-lg p-4 mb-6">
          <div className="mb-3">
            <span className="text-xs text-muted uppercase tracking-wide">
              Project
            </span>
            <p className="text-primary font-medium">{projectName}</p>
          </div>
          <div className="mb-3">
            <span className="text-xs text-muted uppercase tracking-wide">
              Invited by
            </span>
            <p className="text-secondary">{inviterEmail}</p>
          </div>
          <div>
            <span className="text-xs text-muted uppercase tracking-wide">
              Invited email
            </span>
            <p className="text-secondary">{invitation?.email}</p>
          </div>
        </div>

        {/* Status Messages */}
        {isExpired && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">
              This invitation has expired. Please request a new invitation from
              the project owner.
            </p>
          </div>
        )}

        {isAlreadyAccepted && (
          <div className="mb-6 p-3 bg-teal-900/20 border border-teal-800 rounded-lg">
            <p className="text-sm text-teal-400">
              This invitation has already been accepted.
            </p>
          </div>
        )}

        {emailMismatch && (
          <div className="mb-6 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-400">
              This invitation was sent to{" "}
              <span className="font-medium">{invitation?.email}</span>, but
              you're logged in as{" "}
              <span className="font-medium">{currentUser?.email}</span>. Please
              log in with the correct account.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        {!currentUser ? (
          <div className="space-y-3">
            <p className="text-sm text-secondary text-center mb-4">
              Please log in or sign up to accept this invitation.
            </p>
            <button
              onClick={handleLoginRedirect}
              className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Log In
            </button>
            <button
              onClick={handleSignupRedirect}
              className="w-full px-4 py-2 bg-surface hover:bg-surface-hover border border-default text-secondary hover:text-primary rounded-md text-sm font-medium transition-colors"
            >
              Sign Up
            </button>
          </div>
        ) : isExpired || isAlreadyAccepted ? (
          <Link
            to="/"
            className="block w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors text-center"
          >
            Go to Dashboard
          </Link>
        ) : emailMismatch ? (
          <button
            onClick={handleLoginRedirect}
            className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Log In with Different Account
          </button>
        ) : (
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
          >
            {isAccepting ? "Accepting..." : "Accept Invitation"}
          </button>
        )}
      </div>
    </div>
  );
}

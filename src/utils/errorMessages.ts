/**
 * Error message mappings based on the design document's Error Handling section
 * Requirements: All error handling
 */

// Authentication Errors
export const AUTH_ERRORS = {
  METAMASK_NOT_INSTALLED:
    "MetaMask is not installed. Please install MetaMask to continue.",
  WALLET_CONNECTION_REJECTED:
    "Wallet connection was cancelled. Please try again.",
  SIGNATURE_REJECTED: "Message signing was cancelled. Please try again.",
  DUPLICATE_WALLET: "This wallet is already linked to another account.",
  UNREGISTERED_WALLET: "No account found. Please sign up first.",
  INVALID_SIGNATURE: "Signature verification failed. Please try again.",
  SESSION_EXPIRED: "Session expired. Please log in again.",
} as const;

// Data Operation Errors
export const DATA_ERRORS = {
  PROJECT_NOT_FOUND: "Project not found or you don't have access.",
  VIEW_NOT_FOUND: "View not found.",
  ISSUE_NOT_FOUND: "Issue not found.",
  UNAUTHORIZED: "You don't have permission to access this resource.",
  INVALID_PROJECT_NAME: "Project name is required.",
  INVALID_VIEW: "View name and tag are required.",
  INVALID_ISSUE: "Issue name is required.",
  DUPLICATE_VIEW_TAG: "A view with this tag already exists in the project.",
} as const;

// File Upload Errors
export const FILE_ERRORS = {
  FILE_TOO_LARGE: "File exceeds maximum size of 50MB.",
  INVALID_FILE_TYPE:
    "File type not supported. Allowed: PDF, Office docs, Images.",
  UPLOAD_FAILED: "Upload failed. Please try again.",
  STORAGE_QUOTA_EXCEEDED: "Storage quota exceeded. Please delete some files.",
} as const;

// AI Integration Errors
export const AI_ERRORS = {
  SERVICE_UNAVAILABLE: "AI assistant is temporarily unavailable.",
  RATE_LIMIT_EXCEEDED: "Please wait a moment before sending another message.",
  INVALID_API_KEY: "AI service configuration error. Please contact support.",
  RESPONSE_TIMEOUT: "Response is taking longer than expected. Retrying...",
} as const;

// Invitation Errors
export const INVITATION_ERRORS = {
  INVALID_EMAIL: "Please enter a valid email address.",
  SELF_INVITATION: "You cannot invite yourself to a project.",
  ALREADY_COLLABORATOR: "This user is already a collaborator on this project.",
  INVITATION_EXPIRED: "This invitation has expired. Please request a new one.",
} as const;

/**
 * Get a user-friendly error message from an error code or message
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    // Check for known error patterns
    const message = error.message.toLowerCase();

    // Auth errors
    if (message.includes("metamask") && message.includes("not installed")) {
      return AUTH_ERRORS.METAMASK_NOT_INSTALLED;
    }
    if (message.includes("rejected") || message.includes("cancelled")) {
      return AUTH_ERRORS.WALLET_CONNECTION_REJECTED;
    }
    if (message.includes("signature")) {
      return AUTH_ERRORS.INVALID_SIGNATURE;
    }
    if (message.includes("session") && message.includes("expired")) {
      return AUTH_ERRORS.SESSION_EXPIRED;
    }

    // Data errors
    if (message.includes("not found")) {
      if (message.includes("project")) return DATA_ERRORS.PROJECT_NOT_FOUND;
      if (message.includes("view")) return DATA_ERRORS.VIEW_NOT_FOUND;
      if (message.includes("issue")) return DATA_ERRORS.ISSUE_NOT_FOUND;
    }
    if (message.includes("unauthorized") || message.includes("permission")) {
      return DATA_ERRORS.UNAUTHORIZED;
    }

    // File errors
    if (message.includes("file") && message.includes("large")) {
      return FILE_ERRORS.FILE_TOO_LARGE;
    }
    if (message.includes("file type") || message.includes("not supported")) {
      return FILE_ERRORS.INVALID_FILE_TYPE;
    }

    // AI errors
    if (message.includes("rate limit")) {
      return AI_ERRORS.RATE_LIMIT_EXCEEDED;
    }
    if (message.includes("timeout")) {
      return AI_ERRORS.RESPONSE_TIMEOUT;
    }

    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection") ||
      message.includes("offline")
    );
  }
  return false;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      isNetworkError(error) ||
      message.includes("timeout") ||
      message.includes("rate limit") ||
      message.includes("temporarily unavailable")
    );
  }
  return false;
}

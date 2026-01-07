export type InvitationStatus = "pending" | "accepted" | "expired";

export interface Invitation {
  id: string;
  projectId: string;
  email: string;
  invitedBy: string;
  status: InvitationStatus;
  createdAt: Date;
  expiresAt: Date;
}

export type InvitationError =
  | "INVITATION_NOT_FOUND"
  | "INVITATION_EXPIRED"
  | "INVALID_EMAIL"
  | "SELF_INVITATION"
  | "ALREADY_COLLABORATOR"
  | "PROJECT_NOT_FOUND"
  | "UNAUTHORIZED"
  | "UNKNOWN_ERROR";

export interface InvitationResponse<T> {
  success: boolean;
  data?: T;
  error?: InvitationError;
  message?: string;
}

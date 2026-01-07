import { db } from "@/db";
import type {
  Invitation,
  InvitationResponse,
  InvitationStatus,
} from "@/types/invitation";

const INVITATION_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function toInvitation(dbInvitation: {
  id: string;
  project_id: string;
  email: string;
  invited_by: string;
  status: string;
  created_at: string;
  expires_at: string;
}): Invitation {
  return {
    id: dbInvitation.id,
    projectId: dbInvitation.project_id,
    email: dbInvitation.email,
    invitedBy: dbInvitation.invited_by,
    status: dbInvitation.status as InvitationStatus,
    createdAt: new Date(dbInvitation.created_at),
    expiresAt: new Date(dbInvitation.expires_at),
  };
}

function isExpired(invitation: Invitation): boolean {
  return new Date() > invitation.expiresAt;
}

export async function inviteCollaborator(
  projectId: string,
  email: string,
  inviterId: string
): Promise<InvitationResponse<Invitation>> {
  if (!isValidEmail(email)) {
    return {
      success: false,
      error: "INVALID_EMAIL",
      message: "Please enter a valid email address.",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { data: project } = await db
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return {
        success: false,
        error: "PROJECT_NOT_FOUND",
        message: "Project not found.",
      };
    }

    const isOwner = project.owner_id === inviterId;
    const { data: isCollaborator } = await db
      .from("project_collaborators")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", inviterId)
      .single();

    if (!isOwner && !isCollaborator) {
      return {
        success: false,
        error: "UNAUTHORIZED",
        message: "You don't have permission to invite collaborators.",
      };
    }

    const { data: inviter } = await db
      .from("users")
      .select("email")
      .eq("id", inviterId)
      .single();

    if (inviter && inviter.email.toLowerCase() === normalizedEmail) {
      return {
        success: false,
        error: "SELF_INVITATION",
        message: "You cannot invite yourself to a project.",
      };
    }

    const { data: existingUser } = await db
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser) {
      if (project.owner_id === existingUser.id) {
        return {
          success: false,
          error: "ALREADY_COLLABORATOR",
          message: "This user is already the owner of this project.",
        };
      }

      const { data: existingCollab } = await db
        .from("project_collaborators")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", existingUser.id)
        .single();

      if (existingCollab) {
        return {
          success: false,
          error: "ALREADY_COLLABORATOR",
          message: "This user is already a collaborator on this project.",
        };
      }
    }

    const { data: existingInvitation } = await db
      .from("invitations")
      .select("*")
      .eq("project_id", projectId)
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .single();

    if (existingInvitation) {
      const invitation = toInvitation(existingInvitation);
      if (!isExpired(invitation)) {
        return {
          success: true,
          data: invitation,
          message: "An invitation has already been sent to this email.",
        };
      }
      await db
        .from("invitations")
        .update({ status: "expired" })
        .eq("id", existingInvitation.id);
    }

    const expiresAt = new Date(Date.now() + INVITATION_EXPIRATION_MS);
    const { data, error } = await db
      .from("invitations")
      .insert({
        project_id: projectId,
        email: normalizedEmail,
        invited_by: inviterId,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to create invitation.",
      };
    }

    return { success: true, data: toInvitation(data) };
  } catch (error) {
    console.error("Invite collaborator error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to send invitation.",
    };
  }
}

export async function acceptInvitation(
  invitationId: string,
  userId: string
): Promise<InvitationResponse<Invitation>> {
  try {
    const { data: invitation } = await db
      .from("invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (!invitation) {
      return {
        success: false,
        error: "INVITATION_NOT_FOUND",
        message: "Invitation not found.",
      };
    }

    const invitationData = toInvitation(invitation);

    if (isExpired(invitationData)) {
      await db
        .from("invitations")
        .update({ status: "expired" })
        .eq("id", invitationId);

      return {
        success: false,
        error: "INVITATION_EXPIRED",
        message: "This invitation has expired. Please request a new one.",
      };
    }

    if (invitationData.status === "accepted") {
      return {
        success: false,
        error: "INVITATION_NOT_FOUND",
        message: "This invitation has already been accepted.",
      };
    }

    const { data: user } = await db
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (!user) {
      return {
        success: false,
        error: "UNAUTHORIZED",
        message: "User not found.",
      };
    }

    if (user.email.toLowerCase() !== invitationData.email.toLowerCase()) {
      return {
        success: false,
        error: "UNAUTHORIZED",
        message: "This invitation was sent to a different email address.",
      };
    }

    const { data: existingCollab } = await db
      .from("project_collaborators")
      .select("id")
      .eq("project_id", invitationData.projectId)
      .eq("user_id", userId)
      .single();

    if (existingCollab) {
      await db
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invitationId);

      return {
        success: true,
        data: { ...invitationData, status: "accepted" as InvitationStatus },
        message: "You are already a collaborator on this project.",
      };
    }

    await db.from("project_collaborators").insert({
      project_id: invitationData.projectId,
      user_id: userId,
      role: "collaborator",
      accepted_at: new Date().toISOString(),
    });

    await db
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);

    return {
      success: true,
      data: { ...invitationData, status: "accepted" as InvitationStatus },
    };
  } catch (error) {
    console.error("Accept invitation error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to accept invitation.",
    };
  }
}

export async function getInvitation(
  invitationId: string
): Promise<InvitationResponse<Invitation>> {
  try {
    const { data: invitation } = await db
      .from("invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (!invitation) {
      return {
        success: false,
        error: "INVITATION_NOT_FOUND",
        message: "Invitation not found.",
      };
    }

    const invitationData = toInvitation(invitation);

    if (invitationData.status === "pending" && isExpired(invitationData)) {
      await db
        .from("invitations")
        .update({ status: "expired" })
        .eq("id", invitationId);

      return {
        success: true,
        data: { ...invitationData, status: "expired" as InvitationStatus },
      };
    }

    return { success: true, data: invitationData };
  } catch (error) {
    console.error("Get invitation error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch invitation.",
    };
  }
}

export async function getInvitationWithProject(invitationId: string): Promise<
  InvitationResponse<{
    invitation: Invitation;
    projectName: string;
    inviterEmail: string;
  }>
> {
  try {
    const { data: invitation } = await db
      .from("invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (!invitation) {
      return {
        success: false,
        error: "INVITATION_NOT_FOUND",
        message: "Invitation not found.",
      };
    }

    const { data: project } = await db
      .from("projects")
      .select("name")
      .eq("id", invitation.project_id)
      .single();

    const { data: inviter } = await db
      .from("users")
      .select("email")
      .eq("id", invitation.invited_by)
      .single();

    const invitationData = toInvitation(invitation);

    if (invitationData.status === "pending" && isExpired(invitationData)) {
      await db
        .from("invitations")
        .update({ status: "expired" })
        .eq("id", invitationId);
      invitationData.status = "expired";
    }

    return {
      success: true,
      data: {
        invitation: invitationData,
        projectName: project?.name || "Unknown Project",
        inviterEmail: inviter?.email || "Unknown",
      },
    };
  } catch (error) {
    console.error("Get invitation with project error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch invitation details.",
    };
  }
}

export async function getPendingInvitationsForEmail(
  email: string
): Promise<InvitationResponse<Invitation[]>> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const { data: pendingInvitations, error } = await db
      .from("invitations")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("status", "pending");

    if (error) throw error;

    const validInvitations: Invitation[] = [];
    for (const inv of pendingInvitations || []) {
      const invitationData = toInvitation(inv);
      if (isExpired(invitationData)) {
        await db
          .from("invitations")
          .update({ status: "expired" })
          .eq("id", inv.id);
      } else {
        validInvitations.push(invitationData);
      }
    }

    return { success: true, data: validInvitations };
  } catch (error) {
    console.error("Get pending invitations error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch invitations.",
    };
  }
}

export async function getProjectInvitations(
  projectId: string
): Promise<InvitationResponse<Invitation[]>> {
  try {
    const { data: projectInvitations, error } = await db
      .from("invitations")
      .select("*")
      .eq("project_id", projectId);

    if (error) throw error;

    return {
      success: true,
      data: (projectInvitations || []).map(toInvitation),
    };
  } catch (error) {
    console.error("Get project invitations error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch project invitations.",
    };
  }
}

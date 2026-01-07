import { db } from "@/db";
import {
  supabase,
  DOCUMENTS_BUCKET,
  isAllowedFileType,
  isAllowedFileSize,
  MAX_FILE_SIZE,
} from "@/config/supabase";
import type {
  Document,
  DocumentWithUploader,
  DocumentContextType,
} from "@/types";

export type DocumentError =
  | "DOCUMENT_NOT_FOUND"
  | "CONTEXT_NOT_FOUND"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "UPLOAD_FAILED"
  | "DELETE_FAILED"
  | "UNKNOWN_ERROR";

export interface DocumentResponse<T> {
  success: boolean;
  data?: T;
  error?: DocumentError;
  message?: string;
}

function toDocument(dbDocument: {
  id: string;
  context_type: string;
  context_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}): Document {
  return {
    id: dbDocument.id,
    contextType: dbDocument.context_type as DocumentContextType,
    contextId: dbDocument.context_id,
    fileName: dbDocument.file_name,
    fileType: dbDocument.file_type,
    fileSize: dbDocument.file_size,
    storagePath: dbDocument.storage_path,
    uploadedBy: dbDocument.uploaded_by,
    createdAt: new Date(dbDocument.created_at),
  };
}

function generateStoragePath(
  contextType: DocumentContextType,
  contextId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${contextType}/${contextId}/${timestamp}_${sanitizedFileName}`;
}

async function validateContext(
  contextType: DocumentContextType,
  contextId: string
): Promise<boolean> {
  let table: string;
  if (contextType === "project") {
    table = "projects";
  } else if (contextType === "view") {
    table = "views";
  } else {
    table = "issues";
  }
  
  const { data } = await db
    .from(table)
    .select("id")
    .eq("id", contextId)
    .single();
  return !!data;
}

export async function uploadDocument(
  file: File,
  contextType: DocumentContextType,
  contextId: string,
  uploadedBy: string
): Promise<DocumentResponse<Document>> {
  if (!isAllowedFileType(file.type)) {
    return {
      success: false,
      error: "INVALID_FILE_TYPE",
      message: "File type not supported. Allowed: PDF, Office docs, Images.",
    };
  }

  if (!isAllowedFileSize(file.size)) {
    return {
      success: false,
      error: "FILE_TOO_LARGE",
      message: `File exceeds maximum size of ${
        MAX_FILE_SIZE / (1024 * 1024)
      }MB.`,
    };
  }

  try {
    const contextExists = await validateContext(contextType, contextId);
    if (!contextExists) {
      const contextName = contextType === "project" ? "Project" : contextType === "view" ? "View" : "Issue";
      return {
        success: false,
        error: "CONTEXT_NOT_FOUND",
        message: `${contextName} not found.`,
      };
    }

    const storagePath = generateStoragePath(contextType, contextId, file.name);

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return {
        success: false,
        error: "UPLOAD_FAILED",
        message: "Upload failed. Please try again.",
      };
    }

    const { data, error } = await db
      .from("documents")
      .insert({
        context_type: contextType,
        context_id: contextId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (error || !data) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to create document record.",
      };
    }

    return { success: true, data: toDocument(data) };
  } catch (error) {
    console.error("Upload document error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to upload document.",
    };
  }
}

export async function getDocuments(
  contextType: DocumentContextType,
  contextId: string
): Promise<DocumentResponse<DocumentWithUploader[]>> {
  try {
    const contextExists = await validateContext(contextType, contextId);
    if (!contextExists) {
      const contextName = contextType === "project" ? "Project" : contextType === "view" ? "View" : "Issue";
      return {
        success: false,
        error: "CONTEXT_NOT_FOUND",
        message: `${contextName} not found.`,
      };
    }

    const { data, error } = await db
      .from("documents")
      .select("*")
      .eq("context_type", contextType)
      .eq("context_id", contextId);

    if (error) throw error;

    const uploaderIds = [
      ...new Set((data || []).map((d) => d.uploaded_by)),
    ];
    let uploaders: Record<
      string,
      { id: string; email: string; wallet_address: string }
    > = {};

    if (uploaderIds.length > 0) {
      const { data: users } = await db
        .from("users")
        .select("id, email, wallet_address")
        .in("id", uploaderIds);

      uploaders = (users || []).reduce((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {} as typeof uploaders);
    }

    const documentsWithUploader: DocumentWithUploader[] = (data || []).map(
      (d) => ({
        ...toDocument(d),
        uploader: uploaders[d.uploaded_by]
          ? {
              id: uploaders[d.uploaded_by].id,
              email: uploaders[d.uploaded_by].email,
              walletAddress: uploaders[d.uploaded_by].wallet_address,
            }
          : undefined,
      })
    );

    return { success: true, data: documentsWithUploader };
  } catch (error) {
    console.error("Get documents error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch documents.",
    };
  }
}

export async function deleteDocument(
  documentId: string
): Promise<DocumentResponse<void>> {
  try {
    const { data: existingDocument } = await db
      .from("documents")
      .select("storage_path")
      .eq("id", documentId)
      .single();

    if (!existingDocument) {
      return {
        success: false,
        error: "DOCUMENT_NOT_FOUND",
        message: "Document not found.",
      };
    }

    const { error: deleteError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([existingDocument.storage_path]);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return {
        success: false,
        error: "DELETE_FAILED",
        message: "Failed to delete file from storage.",
      };
    }

    await db.from("documents").delete().eq("id", documentId);

    return { success: true };
  } catch (error) {
    console.error("Delete document error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to delete document.",
    };
  }
}

export async function getDownloadUrl(
  documentId: string
): Promise<DocumentResponse<string>> {
  try {
    const { data: existingDocument } = await db
      .from("documents")
      .select("storage_path")
      .eq("id", documentId)
      .single();

    if (!existingDocument) {
      return {
        success: false,
        error: "DOCUMENT_NOT_FOUND",
        message: "Document not found.",
      };
    }

    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(existingDocument.storage_path, 3600);

    if (error || !data?.signedUrl) {
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to generate download URL.",
      };
    }

    return { success: true, data: data.signedUrl };
  } catch (error) {
    console.error("Get download URL error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to generate download URL.",
    };
  }
}

export async function getDocument(
  documentId: string
): Promise<DocumentResponse<Document>> {
  try {
    const { data, error } = await db
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "DOCUMENT_NOT_FOUND",
        message: "Document not found.",
      };
    }

    return { success: true, data: toDocument(data) };
  } catch (error) {
    console.error("Get document error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "Failed to fetch document.",
    };
  }
}

/**
 * Document type definitions for Sloth.app
 * Requirements: 8.2, 8.3, 13.1, 13.2
 */

/**
 * Context type for documents - can be attached to projects, views or issues
 */
export type DocumentContextType = "project" | "view" | "issue";

/**
 * Document entity representing an uploaded file
 */
export interface Document {
  id: string;
  contextType: DocumentContextType;
  contextId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  uploadedBy: string;
  createdAt: Date;
}

/**
 * Document with uploader information
 */
export interface DocumentWithUploader extends Document {
  uploader?: {
    id: string;
    email: string;
    walletAddress: string;
  };
}

/**
 * Input for uploading a new document
 */
export interface UploadDocumentInput {
  file: File;
  contextType: DocumentContextType;
  contextId: string;
  uploadedBy: string;
}

/**
 * Document upload result with download URL
 */
export interface DocumentWithUrl extends Document {
  downloadUrl: string;
}

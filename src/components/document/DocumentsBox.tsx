import { useState, useEffect, useCallback, useRef } from "react";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  getDownloadUrl,
} from "@/services/document";
import { getCurrentSession } from "@/services/auth";
import {
  formatFileSize,
  getFileTypeLabel,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
} from "@/config/supabase";
import type { DocumentWithUploader, DocumentContextType } from "@/types";

export interface DocumentsBoxProps {
  contextType: DocumentContextType;
  contextId: string;
}

/**
 * Displays uploaded documents with file info
 * Supports file upload interface for PDF, Office, and image files
 * Requirements: 8.2, 13.1
 */
export function DocumentsBox({ contextType, contextId }: DocumentsBoxProps) {
  const [documents, setDocuments] = useState<DocumentWithUploader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getDocuments(contextType, contextId);
    if (result.success && result.data) {
      setDocuments(result.data);
    } else {
      setError(result.message || "Failed to load documents.");
    }

    setIsLoading(false);
  }, [contextType, contextId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle file upload
  const handleUpload = async (file: File) => {
    const session = getCurrentSession();
    if (!session) {
      setError("You must be logged in to upload documents.");
      return;
    }

    // Validate file type
    if (
      !ALLOWED_FILE_TYPES.includes(
        file.type as (typeof ALLOWED_FILE_TYPES)[number]
      )
    ) {
      setError("File type not supported. Allowed: PDF, Office docs, Images.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);
    setError(null);

    const result = await uploadDocument(
      file,
      contextType,
      contextId,
      session.userId
    );

    if (result.success) {
      await fetchDocuments();
      setUploadProgress(null);
    } else {
      setError(result.message || "Failed to upload document.");
    }

    setIsUploading(false);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  // Handle document download
  const handleDownload = async (documentId: string, fileName: string) => {
    const result = await getDownloadUrl(documentId);
    if (result.success && result.data) {
      // Open in new tab or trigger download
      const link = document.createElement("a");
      link.href = result.data;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      setError(result.message || "Failed to get download URL.");
    }
  };

  // Handle document deletion
  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    const result = await deleteDocument(documentId);
    if (result.success) {
      await fetchDocuments();
    } else {
      setError(result.message || "Failed to delete document.");
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    }
    if (fileType === "application/pdf") {
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div>
        <h3 className="text-sm font-medium text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Documents
        </h3>
        <div className="text-sm text-muted animate-pulse">
          Loading documents...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Documents
        {documents.length > 0 && (
          <span className="text-xs text-muted">({documents.length})</span>
        )}
      </h3>

      {/* Error message */}
      {error && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-800 rounded-md">
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-400 hover:text-red-300 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress && (
        <div className="mb-3 p-2 bg-teal-900/20 border border-teal-800 rounded-md">
          <p className="text-xs text-teal-400">{uploadProgress}</p>
        </div>
      )}

      {/* Documents list */}
      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="text-sm text-muted">No documents uploaded.</div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-app rounded-md p-3 flex items-center gap-3 group"
            >
              <div className="text-teal-400">{getFileIcon(doc.fileType)}</div>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => handleDownload(doc.id, doc.fileName)}
                  className="text-sm text-primary hover:text-teal-400 transition-colors truncate block w-full text-left"
                  title={doc.fileName}
                >
                  {doc.fileName}
                </button>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>{getFileTypeLabel(doc.fileType)}</span>
                  <span>•</span>
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDate(doc.createdAt)}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all p-1"
                title="Delete document"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Upload area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
          isDragging
            ? "border-teal-500 bg-teal-900/20"
            : "border-default hover:border-teal-600"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept={ALLOWED_FILE_TYPES.join(",")}
          className="hidden"
          disabled={isUploading}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-sm text-muted hover:text-primary transition-colors disabled:cursor-not-allowed"
        >
          {isUploading ? (
            "Uploading..."
          ) : (
            <>
              <span className="text-teal-400">Click to upload</span> or drag and
              drop
            </>
          )}
        </button>
        <p className="text-xs text-muted mt-1">
          PDF, Office docs, Images (max {MAX_FILE_SIZE / (1024 * 1024)}MB)
        </p>
      </div>
    </div>
  );
}

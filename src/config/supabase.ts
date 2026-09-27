import { createClient } from "@supabase/supabase-js";
import { config } from "./index";

/**
 * Supabase client instance for file storage operations
 * Requirements: 8.3, 13.2
 */
export const supabase = createClient(
  config.supabase.url || "",
  config.supabase.anonKey || ""
);

/**
 * Storage bucket name for documents
 */
export const DOCUMENTS_BUCKET = "documents";

/**
 * Maximum file size in bytes (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Allowed file types for document uploads
 * Supports PDF, Office documents, and images
 * Requirements: 8.2, 13.1
 */
export const ALLOWED_FILE_TYPES = [
  // PDF
  "application/pdf",
  // Microsoft Office
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Markdown
  "text/markdown",
  "text/x-markdown",
] as const;

/**
 * File extensions accepted in addition to ALLOWED_FILE_TYPES.
 * Browsers/OSes report inconsistent (or empty) MIME types for some
 * extensions, so uploads are also allowed through by filename extension.
 */
export const ALLOWED_FILE_EXTENSIONS = [".md", ".markdown"] as const;

/**
 * Checks whether a file name ends in one of ALLOWED_FILE_EXTENSIONS
 */
export function hasAllowedFileExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * File type extensions mapping for display
 */
export const FILE_TYPE_EXTENSIONS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PPTX",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/webp": "WEBP",
  "image/svg+xml": "SVG",
  "text/markdown": "MD",
  "text/x-markdown": "MD",
};

/**
 * Validates if a file type is allowed for upload.
 * Falls back to checking the filename extension since browsers/OSes
 * report inconsistent (or empty) MIME types for some extensions (e.g. .md).
 */
export function isAllowedFileType(mimeType: string, fileName?: string): boolean {
  if (
    ALLOWED_FILE_TYPES.includes(mimeType as (typeof ALLOWED_FILE_TYPES)[number])
  ) {
    return true;
  }
  return !!fileName && hasAllowedFileExtension(fileName);
}

/**
 * Validates if a file size is within the allowed limit
 */
export function isAllowedFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Gets a human-readable file type label
 */
export function getFileTypeLabel(mimeType: string): string {
  return FILE_TYPE_EXTENSIONS[mimeType] || "FILE";
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

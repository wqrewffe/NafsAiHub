// A map of common file extensions to their IANA MIME types.
// This is not exhaustive but covers a wide range of common types.
export const MIME_TYPES: Record<string, string> = {
  // Application
  "pdf": "application/pdf",
  "json": "application/json",
  "zip": "application/zip",
  "xml": "application/xml",
  "js": "application/javascript",
  "doc": "application/msword",
  "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "xls": "application/vnd.ms-excel",
  "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "ppt": "application/vnd.ms-powerpoint",
  "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "exe": "application/octet-stream",
  "bin": "application/octet-stream",
  "sh": "application/x-sh",
  "tar": "application/x-tar",
  "rar": "application/vnd.rar",
  "7z": "application/x-7z-compressed",

  // Text
  "txt": "text/plain",
  "html": "text/html",
  "htm": "text/html",
  "css": "text/css",
  "csv": "text/csv",
  "md": "text/markdown",
  "rtf": "text/rtf",

  // Image
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "png": "image/png",
  "gif": "image/gif",
  "bmp": "image/bmp",
  "svg": "image/svg+xml",
  "webp": "image/webp",
  "ico": "image/vnd.microsoft.icon",
  "tiff": "image/tiff",
  "tif": "image/tiff",
  "avif": "image/avif",
  
  // Audio
  "mp3": "audio/mpeg",
  "wav": "audio/wav",
  "ogg": "audio/ogg",
  "m4a": "audio/mp4",
  "aac": "audio/aac",
  "flac": "audio/flac",

  // Video
  "mp4": "video/mp4",
  "webm": "video/webm",
  "avi": "video/x-msvideo",
  "mov": "video/quicktime",
  "mkv": "video/x-matroska",
  "mpeg": "video/mpeg",

  // Font
  "ttf": "font/ttf",
  "otf": "font/otf",
  "woff": "font/woff",
  "woff2": "font/woff2",
};

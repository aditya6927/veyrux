export type DocumentType = "text" | "pdf" | "image" | "docx";

export interface Chunk {
  content: string;
  embedding: number[];
  source: string;
  page_number: number;
  chunk_index?: number;
}

export interface AnalysisResult {
  result: string;
}

// Named ParsedFile to avoid colliding with the browser's window.document
export interface ParsedFile {
  id?: string;
  filename: string;
  mimeType?: string;
  documentType?: DocumentType | string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  chunks: Chunk[];
}

// Type alias for convenience
export type Document = ParsedFile;

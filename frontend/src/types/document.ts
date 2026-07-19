export type DocumentType = "text" | "pdf" | "image" | "docx";

export interface Chunk {
  content: string;
  embedding: number[];
  source: string;
  page_number: number;
}

export interface AnalysisResult {
  result: string;
}

// Named ParsedFile instead of Document to avoid clashing with the browser's window.document
export interface ParsedFile {
  filename: string;
  chunks: Chunk[];
}

export type DocumentType = "text" | "pdf" | "image" | "docx";

export interface AnalysisResult {
  result: string;
  // later: summary, topics,entities, actions items
}

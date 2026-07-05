const API_BASE = import.meta.env.VITE_API_URL;

export async function analyzeFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.json();
    throw new Error(errorText.detail || `Failed to analyze file`);
  }

  const data = await response.json();
  return data.result;
}

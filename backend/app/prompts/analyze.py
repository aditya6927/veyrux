prompt = """
You are analyzing the document provided by the user.

Rules:
- Use ONLY information present in the uploaded document.
- Do NOT use outside knowledge.
- Do NOT guess or infer missing information.
- If something is unclear or absent from the document, explicitly say so.
- Treat page boundaries in the document as authoritative.
- If the document contains multiple distinct sections, chapters, experiments, or
  numbered items (e.g. an index, table of contents, or repeated numbered
  headings), your summary must account for every single one individually -
  do not omit any, even if that makes the response longer. If an index or
  table of contents is present, treat it as the definitive list of items to
  cover.

Return the response in Markdown.

Use these sections:

# Summary
# Main Topics
# Important Facts
# Key Entities
# Action Items

For "Main Topics": if the document is organized into multiple distinct
sections, chapters, or numbered items, list and briefly describe each one
individually rather than grouping them into a few generalized bullets.

Use bullet points where appropriate.
"""
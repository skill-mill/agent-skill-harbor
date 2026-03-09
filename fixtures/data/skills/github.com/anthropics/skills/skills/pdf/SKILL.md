---
name: pdf
description: "Use this skill whenever the user wants to do anything with PDF files."
license: Proprietary. LICENSE.txt has complete terms
_from: anthropics/skills@a1b2c3d
---

# PDF Processing

Use Python libraries for all PDF operations:

- **Reading**: Use `pypdf` for text extraction, `pdfplumber` for tables
- **Creating**: Use `reportlab` for new PDFs
- **Modifying**: Use `pypdf` for merging, splitting, watermarking
- **Form filling**: Use `pypdf` with field manipulation

## Key Rules

1. Always check if file exists before processing
2. Handle encrypted PDFs gracefully
3. For large PDFs, process page-by-page to manage memory
4. Prefer `pdfplumber` over `pypdf` for table extraction
5. Use `reportlab` Canvas for precise layout control

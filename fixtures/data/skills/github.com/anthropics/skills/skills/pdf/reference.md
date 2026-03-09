# PDF Reference

## Library Comparison

| Task | Library | Notes |
|------|---------|-------|
| Text extraction | pypdf | Fast, basic extraction |
| Table extraction | pdfplumber | Best for structured tables |
| Create new PDF | reportlab | Full layout control |
| Merge/split | pypdf | Simple API |
| Fill forms | pypdf | Field-based filling |
| Image extraction | pypdf | Page-by-page |

## Common Patterns

### Reading with fallback

```python
import pypdf
import pdfplumber

def extract_text(path):
    """Extract text, falling back to pdfplumber for complex layouts."""
    reader = pypdf.PdfReader(path)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    if not text.strip():
        with pdfplumber.open(path) as pdf:
            text = "\n".join(p.extract_text() or "" for p in pdf.pages)
    return text
```

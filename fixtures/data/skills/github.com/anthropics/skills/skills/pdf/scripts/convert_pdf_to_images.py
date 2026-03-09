#!/usr/bin/env python3
"""Convert PDF pages to PNG images for visual inspection."""

import subprocess
import sys
from pathlib import Path


def convert_pdf_to_images(pdf_path: str, output_dir: str = ".", dpi: int = 150) -> list[str]:
    """Convert each page of a PDF to a PNG image.

    Requires: pdftoppm (from poppler-utils)
    """
    pdf = Path(pdf_path)
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    prefix = out / pdf.stem
    subprocess.run(
        ["pdftoppm", "-png", "-r", str(dpi), str(pdf), str(prefix)],
        check=True,
    )

    images = sorted(out.glob(f"{pdf.stem}-*.png"))
    return [str(img) for img in images]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: convert_pdf_to_images.py <pdf_path> [output_dir]")
        sys.exit(1)
    result = convert_pdf_to_images(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ".")
    for img in result:
        print(img)

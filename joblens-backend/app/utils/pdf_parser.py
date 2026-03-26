"""
app/utils/pdf_parser.py
Extracts plain text from an uploaded PDF using PyMuPDF (fitz).
"""
from __future__ import annotations
import io
import re
import fitz  # PyMuPDF


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract and clean text from PDF bytes.
    Returns a single string with page breaks replaced by newlines.
    """
    doc  = fitz.open(stream=io.BytesIO(file_bytes), filetype="pdf")
    pages = []

    for page in doc:
        text = page.get_text("text")  # plain text mode
        pages.append(text)

    doc.close()
    raw = "\n".join(pages)
    return _clean_pdf_text(raw)


def _clean_pdf_text(text: str) -> str:
    """
    Light cleanup of raw PDF text:
    - Collapse 3+ consecutive newlines → 2
    - Remove non-printable characters
    - Strip leading/trailing whitespace per line
    """
    # Remove non-printable except newline and tab
    text = re.sub(r"[^\x09\x0A\x0D\x20-\x7E]", " ", text)
    # Normalise whitespace within lines
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    # Collapse blank lines
    cleaned_lines, prev_blank = [], False
    for line in lines:
        is_blank = line == ""
        if is_blank and prev_blank:
            continue
        cleaned_lines.append(line)
        prev_blank = is_blank

    return "\n".join(cleaned_lines).strip()

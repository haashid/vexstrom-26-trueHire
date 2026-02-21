import io
from PyPDF2 import PdfReader
from app.core.logging import get_logger

logger = get_logger(__name__)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from a raw PDF byte stream using PyPDF2.
    """
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        
        if not text.strip():
            logger.warning("PDF extraction resulted in empty text.")
        return text.strip()
    except Exception as e:
        logger.error(f"Failed to extract text from PDF: {str(e)}")
        raise ValueError("Could not parse PDF document.")

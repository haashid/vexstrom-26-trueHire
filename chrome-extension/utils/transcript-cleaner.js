/**
 * Utility for cleaning and normalizing transcript text from Google Meet DOM.
 */
export const TranscriptCleaner = {
  /**
   * Normalizes whitespace and removes unwanted characters.
   */
  clean(text) {
    if (!text) return "";
    return text
      .replace(/\s+/g, " ")
      .trim();
  },

  /**
   * Simple deduplication check for streaming captions.
   * Google Meet often updates the same node multiple times.
   */
  isDuplicate(lastText, currentText) {
    if (!lastText || !currentText) return false;
    
    // Exact match
    if (lastText.trim() === currentText.trim()) return true;
    
    // If current text IS the same as last text but just with more words appended, 
    // we consider it a continuation/update, NOT a duplicate line to be ignored.
    // However, we only want to stream significant updates.
    if (currentText.startsWith(lastText) && currentText.length > lastText.length) {
       return false; 
    }

    return false;
  },

  /**
   * Validates if the transcript object is meaningful.
   */
  isValid(transcript) {
    const valid = (
      transcript &&
      typeof transcript.text === "string" &&
      transcript.text.trim().length > 0 && // Capture even short "Yes/No"
      typeof transcript.speaker === "string"
    );
    return valid;
  }
};

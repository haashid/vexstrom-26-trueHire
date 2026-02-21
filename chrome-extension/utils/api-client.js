/**
 * Robust API Client for streaming transcript data to the backend.
 */
export class ApiClient {
  constructor(config = {}) {
    this.endpoint = config.endpoint || "http://localhost:8000/api/v1/transcript";
    this.retryCount = config.retryCount || 3;
    this.baseDelay = config.baseDelay || 1000;
  }

  async sendTranscript(transcript) {
    let lastError;
    
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(transcript)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("[Bridge API] Successfully sent transcript packet");
        return await response.json();
      } catch (error) {
        lastError = error;
        console.warn(`[Bridge API] Attempt ${attempt + 1} failed: ${error.message}`);
        
        if (attempt < this.retryCount - 1) {
          const delay = this.baseDelay * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    console.error("[Bridge API] All retry attempts failed", lastError);
    throw lastError;
  }

  setEndpoint(url) {
    if (url) this.endpoint = url;
  }
}

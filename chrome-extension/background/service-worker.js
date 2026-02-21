import { ApiClient } from "../utils/api-client.js";
import { TranscriptCleaner } from "../utils/transcript-cleaner.js";

const api = new ApiClient();
let lastTextMap = new Map(); // Speaker -> Last Text

console.log("[AI Bridge Service Worker] Starting...");

chrome.runtime.onInstalled.addListener(() => {
  console.log("[AI Bridge Service Worker] Installed");
  chrome.storage.local.set({ captureEnabled: false, status: "IDLE" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TRANSCRIPT_CAPTURED") {
    handleTranscript(message.data);
  } else if (message.type === "STATUS_UPDATE") {
    chrome.storage.local.set({ status: message.status });
  }
});

async function handleTranscript(data) {
  const { speaker, text } = data;
  const cleanedText = TranscriptCleaner.clean(text);
  
  if (!TranscriptCleaner.isValid({ speaker, text: cleanedText })) {
    return;
  }

  const lastText = lastTextMap.get(speaker);
  if (TranscriptCleaner.isDuplicate(lastText, cleanedText)) {
    return;
  }

  // Update last text for this speaker
  lastTextMap.set(speaker, cleanedText);

  try {
    const config = await chrome.storage.local.get(['apiUrl']);
    if (config.apiUrl) api.setEndpoint(config.apiUrl);

    await api.sendTranscript({
      speaker,
      text: cleanedText,
      timestamp: data.timestamp,
      sessionId: "meet_session_" + Date.now() // Optional: track sessions
    });

    // Notify popup about activity
    chrome.storage.local.set({ 
      lastTranscript: cleanedText,
      status: "LISTENING" // Clear error on success
    });
    
  } catch (error) {
    console.error("[Bridge SW] Failed to stream transcript:", error);
    chrome.storage.local.set({ 
      status: "ERROR",
      errorMessage: error.message || "Failed to connect to backend"
    });
  }
}

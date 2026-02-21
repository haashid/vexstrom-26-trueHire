/**
 * Entry point for the content script. Orchestrates capture logic.
 */

let bridgeObserver = null;
let isCaptureActive = false;
let retryCount = 0;
const MAX_RETRIES = 50; // Long retry period for Meet loading

function initCapture() {
  console.log("[AI Bridge] Meet Capture Script Loaded");

  // Check storage to see if we should auto-start
  chrome.storage.local.get(['captureEnabled'], (result) => {
    if (result.captureEnabled) {
      console.log("[AI Bridge] Auto-starting capture based on saved preference");
      startBridge();
    }
  });
}

function startBridge() {
  if (isCaptureActive) return;

  console.log("[AI Bridge] Attempting to start observer...");

  // DomObserver is defined in dom-observer.js (loaded before this script)
  try {
    // @ts-ignore
    bridgeObserver = new DomObserver((transcript) => {
      chrome.runtime.sendMessage({
        type: "TRANSCRIPT_CAPTURED",
        data: transcript
      });
    });

    const success = bridgeObserver.start();
    if (success) {
      isCaptureActive = true;
      retryCount = 0;
      updateStatus("LISTENING");
      chrome.storage.local.set({ captionStatus: 'Detected' });
      console.log("[AI Bridge] Observer started successfully. Watching for captions...");
    } else {
      retryCount++;
      chrome.storage.local.set({ captionStatus: 'Not Detected' });
      if (retryCount < MAX_RETRIES) {
        console.warn(`[AI Bridge] Container NOT found. Ensure captions (CC) are ON. Retrying in 3s (Attempt ${retryCount}/${MAX_RETRIES})`);
        setTimeout(startBridge, 3000);
      } else {
        console.error("[AI Bridge] STOPPING: Failed to find caption container after max retries.");
        updateStatus("ERROR");
      }
    }
  } catch (err) {
    console.error("[AI Bridge] Error starting observer:", err);
    updateStatus("ERROR");
  }
}

function stopBridge() {
  if (bridgeObserver) {
    bridgeObserver.stop();
    bridgeObserver = null;
  }
  isCaptureActive = false;
  retryCount = 0;
  updateStatus("IDLE");
  chrome.storage.local.set({ captionStatus: 'Not Detected' });
  console.log("[AI Bridge] Capture disabled by user");
}

function updateStatus(status) {
  chrome.runtime.sendMessage({
    type: "STATUS_UPDATE",
    status: status
  });
}

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_CAPTURE") {
    console.log("[AI Bridge] Toggle message received:", message.enabled);
    if (message.enabled) {
      startBridge();
    } else {
      stopBridge();
    }
  }
});

// Detect tab load
initCapture();

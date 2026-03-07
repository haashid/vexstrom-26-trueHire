document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('capture-toggle');
  const statusBadge = document.getElementById('status-badge');
  const meetStatus = document.getElementById('meet-status');
  const lastLine = document.getElementById('last-line');
  const apiUrlInput = document.getElementById('api-url');
  const saveBtn = document.getElementById('save-settings');

  const DEFAULT_API_URL = 'http://localhost:8000/api/v1/transcript';

  // Load current state
  chrome.storage.local.get(['captureEnabled', 'status', 'lastTranscript', 'apiUrl', 'errorMessage'], (result) => {
    toggle.checked = result.captureEnabled || false;
    updateStatusUI(result.status || 'IDLE', result.errorMessage);
    if (result.lastTranscript) lastLine.innerText = result.lastTranscript;
    if (result.apiUrl) apiUrlInput.value = result.apiUrl;
    checkBackend(result.apiUrl || DEFAULT_API_URL);
  });

  // Listen for storage changes to update UI in real-time
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.status || changes.errorMessage) {
        const status = changes.status ? changes.status.newValue : null;
        const error = changes.errorMessage ? changes.errorMessage.newValue : null;
        // Need to get current values for things that didn't change
        chrome.storage.local.get(['status', 'errorMessage'], (res) => {
            updateStatusUI(status || res.status, error || res.errorMessage);
        });
    }
    if (changes.lastTranscript) lastLine.innerText = changes.lastTranscript.newValue;
    if (changes.apiUrl) checkBackend(changes.apiUrl.newValue);

    if (changes.captionStatus) {
        updateCaptionUI(changes.captionStatus.newValue);
    }
  });

  // Initial load for caption status
  chrome.storage.local.get(['captionStatus'], (res) => {
    updateCaptionUI(res.captionStatus || 'Not Detected');
  });

  // Check if we are on a Meet page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.url.includes('meet.google.com')) {
      meetStatus.innerText = 'Detected';
      meetStatus.className = 'value detect-yes';
    } else {
      meetStatus.innerText = 'Not Detected';
      meetStatus.className = 'value detect-no';
    }
  });

  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.local.set({ captureEnabled: enabled });
    
    // Broadcast to current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "TOGGLE_CAPTURE",
        enabled: enabled
      });
    });
  });

  const testBtn = document.getElementById('test-bridge');

  saveBtn.addEventListener('click', () => {
    const url = apiUrlInput.value.trim();
    chrome.storage.local.set({ apiUrl: url }, () => {
      saveBtn.innerText = 'Saved!';
      setTimeout(() => saveBtn.innerText = 'Save', 2000);
    });
  });

  testBtn.addEventListener('click', () => {
    testBtn.innerText = 'Sending...';
    // Send a mock transcript to the background for testing the API logic
    chrome.runtime.sendMessage({
        type: "TRANSCRIPT_CAPTURED",
        data: {
            speaker: "System Test",
            text: "This is a test message from the AI Bridge extension.",
            timestamp: Date.now()
        }
    });

    setTimeout(() => {
        testBtn.innerText = 'Sent!';
        setTimeout(() => testBtn.innerText = 'Test Bridge', 2000);
    }, 1000);
  });

  function updateStatusUI(status, errorMsg) {
    statusBadge.innerText = status;
    statusBadge.className = `badge ${status.toLowerCase()}`;
    
    if (status === 'ERROR') {
      lastLine.innerText = `Error: ${errorMsg || 'Connection failed'}`;
      lastLine.style.color = '#ef4444';
    } else {
      lastLine.style.color = '';
    }
  }

  async function checkBackend(url) {
    const backendStatus = document.getElementById('backend-status');
    if (!url) {
        backendStatus.innerText = 'Not Configured';
        backendStatus.className = 'value detect-no';
        return;
    }

    try {
        // Simple ping to base URL to check if service is up
        const baseUrl = new URL(url).origin;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        await fetch(baseUrl, { mode: 'no-cors', signal: controller.signal });
        backendStatus.innerText = 'Connected';
        backendStatus.className = 'value detect-yes';
        clearTimeout(timeoutId);
    } catch (err) {
        backendStatus.innerText = 'Offline';
        backendStatus.className = 'value detect-no';
    }
  }

  function updateCaptionUI(status) {
    const captionStatus = document.getElementById('caption-status');
    captionStatus.innerText = status;
    if (status === 'Detected') {
        captionStatus.className = 'value detect-yes';
    } else {
        captionStatus.className = 'value detect-no';
    }
  }
});

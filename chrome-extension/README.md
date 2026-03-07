# AI Interview Caption Bridge

A professional Chrome Extension designed to bridge live Google Meet captions to an AI interview evaluation system.

## 🚀 Overview

This extension monitors the Google Meet DOM for real-time captions, extracts speaker information and transcript text, cleanses the data, and streams it to a configured backend API.

## 🏗️ Architecture

- **Content Script (`meet-capture.js`)**: Orchestrates the initialization and bridges DOM events to the background.
- **DOM Observer (`dom-observer.js`)**: Uses `MutationObserver` to watch for caption changes in the Meet interface.
- **Service Worker (`service-worker.js`)**: Handles background processing, API communication, and state persistence.
- **Utilities**:
  - `transcript-cleaner.js`: Normalizes text and handles deduplication.
  - `api-client.js`: Manages robust POST requests with exponential backoff.

## 📥 Installation

1. Clone or download this project.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked**.
5. Select the `chrome-extension/` directory.

## ⚙️ Configuration

1. Click the extension icon in your toolbar to open the popup.
2. Enter your backend API endpoint (e.g., `http://localhost:8000/api/transcript`).
3. Toggle "Enable Caption Capture" to start listening when in a Google Meet call.

## 🔍 How Caption Capture Works

Google Meet captions are rendered in a dynamic DOM container. This extension identifies the container and attaches a `MutationObserver`. It selectively extracts data from specific `jsname` and `jscontroller` attributes that represent speaker names and text spans. 

The approach is designed to be platform-agnostic by focusing on structural patterns rather than fragile CSS classes wherever possible.

## 🛡️ Robustness Features

- **Duplicate Filtering**: Handles Meet's rapid DOM updates by discarding partial or repeated text packets.
- **Network Resilience**: API client includes retries and backoff logic for unreliable connections.
- **Lifecycle Management**: Automatically initializes/de-initializes based on tab status and user preference.

---
*Developed for AI-powered technical interviews.*

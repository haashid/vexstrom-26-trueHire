/**
 * Encapsulates the logic for observing Google Meet caption DOM mutations.
 * Loaded as a standard script in content_scripts.
 */
class DomObserver {
  constructor(onNewCaption) {
    this.onNewCaption = onNewCaption;
    this.observer = null;
    this.lastProcessedText = "";
    this.lastSpeaker = "";
    
    // Aggressive list of selectors for Google Meet (2025/2026)
    this.SELECTORS = {
      // Containers: visible caption areas
      CONTAINERS: [
        ".aH9Z2c", // Primary visible caption container
        "div[jsname='v979S']", 
        "div[jsname='Vj2X1f']",
        "div[aria-live='polite'][aria-atomic='true']"
      ],
      // Individual blocks of captions from a speaker
      CAPTION_ITEM: [
        ".iS70S",
        "div[jscontroller='D1977e']",
        "div[jsname='PTY69c']",
        "div[data-participant-id]"
      ],
      // ... same speaker and text selectors ...
      SPEAKER_NAME: [
        "div[class*='zs6s8c']",
        "div[jsname='r4nke']",
        ".Kc97pf",
        "div[data-sender-name]"
      ],
      CAPTION_TEXT: [
        "span[class*='bhS8Wb']",
        "span[jsname='PTY69c']",
        ".V0uREc",
        ".jS751"
      ]
    };
  }

  // Helper to find first matching VISIBLE element from a list
  findFirst(selectors, parent = document) {
    for (const sel of selectors) {
      const elements = parent.querySelectorAll(sel);
      for (const el of elements) {
        // Skip hidden announcers or elements positioned far off-screen
        const style = window.getComputedStyle(el);
        const isHidden = style.display === 'none' || 
                         style.visibility === 'hidden' || 
                         el.getAttribute('data-mdc-dom-announce') === 'true' ||
                         el.offsetHeight === 0;
        
        if (!isHidden) return el;
      }
    }
    return null;
  }

  start() {
    console.log("[AI Bridge Observer] Initiating deep container search...");
    
    // 1. Primary search: look for containers
    let container = this.findFirst(this.SELECTORS.CONTAINERS);
    
    // 2. Secondary search: if no container, look for items and find their parent
    if (!container) {
      const item = this.findFirst(this.SELECTORS.CAPTION_ITEM);
      if (item && item.parentElement) {
        console.log("[AI Bridge Observer] Found caption item, using parent as container");
        container = item.parentElement;
      }
    }

    if (!container) {
      console.warn("[AI Bridge Observer] All detection paths failed. Captions might be OFF.");
      return false;
    }

    // Store container for scoped searches
    this.container = container;

    // Disconnect if already exists
    if (this.observer) this.observer.disconnect();

    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(this.container, {
      childList: true,
      subtree: true,
      characterData: true
    });

    console.log("[AI Bridge Observer] MutationObserver attached to:", this.container);
    return true;
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.container = null;
      console.log("[AI Bridge Observer] Stopped");
    }
  }

  handleMutations(mutations) {
    if (!this.container) return;

    // Verbose logging for diagnostics
    console.debug(`[AI Bridge Diagnostic] Mutation detected. mutations: ${mutations.length}, container childCount: ${this.container.childElementCount}`);

    // Collect all unique caption nodes within the container
    let captionBlocks = [];
    for (const sel of this.SELECTORS.CAPTION_ITEM) {
      const found = this.container.querySelectorAll(sel);
      if (found.length > 0) {
        captionBlocks = Array.from(found);
        console.debug(`[AI Bridge Diagnostic] Found ${captionBlocks.length} blocks using selector: ${sel}`);
        break;
      }
    }
    
    // Final fallback: any div with known caption-like attributes within container
    if (captionBlocks.length === 0) {
        captionBlocks = Array.from(this.container.querySelectorAll('div'))
          .filter(el => el.getAttribute('jscontroller') === 'D1977e' || 
                        el.getAttribute('jsname') === 'PTY69c' ||
                        el.classList.contains('iS70S') ||
                        el.classList.contains('V0uREc'));
        
        if (captionBlocks.length > 0) {
            console.debug(`[AI Bridge Diagnostic] Found ${captionBlocks.length} blocks using attribute filter fallback`);
        }
    }

    // ULTRA FALLBACK: If still nothing, just pull the entire container text for debugging
    if (captionBlocks.length === 0) {
        const rawText = (this.container.innerText || "").trim();
        if (rawText && rawText !== this.lastProcessedText) {
            console.debug(`[AI Bridge Diagnostic] No blocks found. Raw Container Text: "${rawText.substring(0, 50)}..."`);
            this.onNewCaption({
                speaker: "System (Raw Fallback)",
                text: rawText,
                timestamp: Date.now()
            });
            this.lastProcessedText = rawText;
        }
        return;
    }

    this.processBlocks(captionBlocks);
  }

  processBlocks(blocks) {
    blocks.forEach(block => {
      // Try all speaker selectors
      const speakerEl = this.findFirst(this.SELECTORS.SPEAKER_NAME, block);
      
      // Try all text selectors
      let textElements = [];
      for (const sel of this.SELECTORS.CAPTION_TEXT) {
        const found = block.querySelectorAll(sel);
        if (found.length > 0) {
          textElements = Array.from(found);
          break;
        }
      }
      
      // Combine all text spans into one string
      let fullText = textElements
        .map(el => el.innerText)
        .join(" ")
        .trim();

      // RECURSIVE FALLBACK: If standard selectors found no text, pull EVERYTHING from the block
      if (!fullText) {
          let rawText = block.innerText || "";
          if (speakerEl && speakerEl.innerText) {
              rawText = rawText.replace(speakerEl.innerText, "").trim();
          }
          fullText = rawText.replace(/\n/g, " ").trim();
      }

      if (fullText) {
        const speaker = speakerEl ? speakerEl.innerText.trim() : this.lastSpeaker || "Interviewer";
        
        if (fullText !== this.lastProcessedText || speaker !== this.lastSpeaker) {
          console.debug(`[AI Bridge Capture] ${speaker}: ${fullText}`);
          this.lastProcessedText = fullText;
          this.lastSpeaker = speaker;

          this.onNewCaption({
            speaker,
            text: fullText,
            timestamp: Date.now()
          });
        }
      }
    });
  }
}

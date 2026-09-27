## 2024-05-24 - DOM XSS in global error handlers
**Vulnerability:** window.onerror and unhandledrejection handlers used innerHTML with unescaped error messages.
**Learning:** Even benign-looking debugging screens can be vectors for DOM XSS if they reflect user input directly into innerHTML.
**Prevention:** Always use document.createElement and textContent when building UI elements from dynamic or potentially untrusted strings.

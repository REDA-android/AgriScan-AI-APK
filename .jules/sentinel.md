## 2024-05-24 - DOM-based XSS in Global Error Handlers
**Vulnerability:** Unsanitized error messages and stack traces were being directly injected into the DOM using `innerHTML` within `window.onerror` and `window.addEventListener('unhandledrejection')`.
**Learning:** Even internal error reporting mechanisms can introduce XSS if an attacker can manipulate error messages or stack traces (e.g., through malicious input that causes a predictable exception). `innerHTML` should never be used with data that originates from exceptions unless strictly sanitized.
**Prevention:** Always use safe DOM APIs like `document.createElement()`, `innerText`, and `appendChild()` when rendering dynamic error information to the screen.

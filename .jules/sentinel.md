## 2024-05-20 - [Fix XSS Vulnerability in Global Error Handlers]
**Vulnerability:** Global error handlers (`window.onerror`, `window.unhandledrejection`) in `src/main.tsx` and `index.html` were using `innerHTML` to display the error `message`, `source`, and `reason` directly to the DOM.
**Learning:** This exposes the application to DOM-based Cross-Site Scripting (XSS) if an attacker can trigger an error with a maliciously crafted payload containing HTML tags.
**Prevention:** Use safer DOM manipulations like `document.createElement` and `textContent` to ensure that error objects, stacks, or messages are properly escaped and not parsed as HTML.

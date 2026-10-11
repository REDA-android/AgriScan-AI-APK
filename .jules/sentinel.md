## 2024-05-18 - [Fix DOM-based XSS in error handlers]
**Vulnerability:** Found DOM-based XSS vulnerability in global window error handlers (`window.onerror` and `unhandledrejection`) in `src/main.tsx` where un-sanitized error messages and stack traces were rendered using `innerHTML`.
**Learning:** Developers sometimes use `innerHTML` as a quick way to render debug UI elements without considering that error messages (e.g. from failed network requests with user-controlled URLs) might contain XSS payloads.
**Prevention:** Always use safe DOM APIs like `document.createElement`, `innerText` or `textContent`, and `appendChild` when rendering dynamic content, even in error handlers or debug overlays.

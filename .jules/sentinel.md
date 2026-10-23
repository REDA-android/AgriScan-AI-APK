## 2024-05-18 - DOM-based XSS in Global Error Handlers
**Vulnerability:** Found DOM-based Cross-Site Scripting (XSS) vulnerability in global error handlers (`window.onerror` and `window.addEventListener('unhandledrejection')`) in `src/main.tsx` due to the use of `innerHTML` with unsanitized error messages and stack traces.
**Learning:** Even diagnostic or debugging code (like global error overlays) can be an attack vector if it injects unsanitized input into the DOM. Error messages or stack traces might contain user-controlled data that can trigger XSS if rendered via `innerHTML`.
**Prevention:** Always use safe DOM APIs like `document.createElement`, `innerText`, and `appendChild` instead of `innerHTML` when displaying potentially untrusted data, even in error handling logic.

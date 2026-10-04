## 2024-10-04 - DOM-based XSS in Global Error Handlers
**Vulnerability:** Global error handlers (`window.onerror`, `unhandledrejection`) in `src/main.tsx` used `innerHTML` to display error messages and stack traces. This is a vector for DOM-based XSS if the error message contains unsanitized user input or attacker-controlled strings (e.g. error strings originating from malicious inputs).
**Learning:** Even seemingly benign code meant for debugging or crash reporting can introduce XSS if it directly embeds dynamic data into HTML.
**Prevention:** Always use safe DOM manipulation APIs like `document.createElement` and `innerText` (or `textContent`) instead of `innerHTML` when displaying untrusted data, including dynamically generated error messages.

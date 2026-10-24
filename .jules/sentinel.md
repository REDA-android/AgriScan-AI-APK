## 2024-05-31 - [High] DOM-based XSS in Error Handlers
**Vulnerability:** Global error handlers (`window.onerror` and `unhandledrejection`) in `src/main.tsx` used `innerHTML` to display error messages. An attacker could potentially inject malicious scripts if they can control the content of an error message (e.g., through user input that triggers an error).
**Learning:** Using `innerHTML` with unsanitized data, even in error handlers, creates a DOM-based XSS vulnerability. Error messages often contain parts of user input or context that shouldn't be trusted as HTML.
**Prevention:** Always use safe DOM APIs like `document.createElement`, `textContent`, and `appendChild` instead of `innerHTML` when displaying dynamically generated content, including error messages.

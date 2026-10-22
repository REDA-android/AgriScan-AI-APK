## 2024-10-22 - DOM-based XSS in Error Handlers
**Vulnerability:** Found `innerHTML` being used with unsanitized data (error messages, stack traces) in global error handlers (`window.onerror`, `window.addEventListener('unhandledrejection')`) in `src/main.tsx`.
**Learning:** Even diagnostic or debug code meant to help developers can introduce critical vulnerabilities if it uses unsanitized input to render UI components. This specific instance poses a DOM-based XSS risk if an attacker can manipulate error outputs.
**Prevention:** Always use safe DOM APIs like `document.createElement`, `innerText`, and `appendChild` when rendering potentially unsanitized data, even in global error handlers.

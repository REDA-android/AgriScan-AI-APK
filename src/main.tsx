import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any old service workers running in Capacitor/WebView causing sw.js 404s
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  }).catch(function(err) {
    console.log('Service Worker unregistration failed: ', err);
  });
}

// Show errors on the screen for debugging (ignoring benign Vite/WebSocket errors)
window.onerror = function(message, source, lineno, colno, error) {
  const msg = String(message);
  if (msg.includes('WebSocket') || msg.includes('vite') || msg.includes('HMR')) return;

  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100vw';
  errorDiv.style.height = '100vh';
  errorDiv.style.backgroundColor = 'white';
  errorDiv.style.color = 'red';
  errorDiv.style.zIndex = '999999';
  errorDiv.style.padding = '20px';
  errorDiv.style.overflow = 'auto';
  const h3 = document.createElement('h3');
  h3.textContent = 'App Crash';
  const p1 = document.createElement('p');
  p1.textContent = 'Message: ' + message;
  const p2 = document.createElement('p');
  p2.textContent = 'Source: ' + source + ':' + lineno + ':' + colno;
  const pre = document.createElement('pre');
  pre.textContent = (error && error.stack ? error.stack : '');
  errorDiv.appendChild(h3);
  errorDiv.appendChild(p1);
  errorDiv.appendChild(p2);
  errorDiv.appendChild(pre);
  document.body.appendChild(errorDiv);
};

// Also catch unhandled promise rejections (ignoring benign Vite/WebSocket errors)
window.addEventListener('unhandledrejection', function(event) {
  const reason = event.reason;
  const reasonStr = String(reason);
  const reasonStack = (reason && reason.stack) ? String(reason.stack) : '';
  
  if (
    reasonStr.includes('WebSocket') || 
    reasonStr.includes('vite') || 
    reasonStr.includes('HMR') ||
    reasonStack.includes('WebSocket') ||
    reasonStack.includes('vite')
  ) {
    return;
  }

  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '50px';
  errorDiv.style.left = '0';
  errorDiv.style.width = '100vw';
  errorDiv.style.backgroundColor = 'white';
  errorDiv.style.color = 'red';
  errorDiv.style.zIndex = '999999';
  errorDiv.style.padding = '20px';
  errorDiv.style.border = '2px solid red';
  const h3 = document.createElement('h3');
  h3.textContent = 'Unhandled Promise Rejection';
  const p1 = document.createElement('p');
  p1.textContent = 'Reason: ' + event.reason;
  const pre = document.createElement('pre');
  pre.textContent = (event.reason && event.reason.stack ? event.reason.stack : '');
  errorDiv.appendChild(h3);
  errorDiv.appendChild(p1);
  errorDiv.appendChild(pre);
  document.body.appendChild(errorDiv);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

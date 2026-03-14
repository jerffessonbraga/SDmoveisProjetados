import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("[SD-DEBUG] main.tsx executing, mounting App...");

try {
  const root = document.getElementById("root");
  console.log("[SD-DEBUG] root element found:", !!root);
  createRoot(root!).render(<App />);
  console.log("[SD-DEBUG] App mounted successfully");
} catch (err) {
  console.error("[SD-DEBUG] Failed to mount App:", err);
}

// Register/Unregister Service Worker
if ('serviceWorker' in navigator) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister();
            }
        });
    } else {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.log('SW registration failed: ', err);
            });
        });
    }
}

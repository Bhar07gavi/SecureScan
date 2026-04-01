import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./index.css";
import App from "./App";

// ✅ Fallback if env not loaded
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ✅ Debug: Check if env is loaded
console.log('🔧 Environment Check:');
console.log('  API URL:', import.meta.env.VITE_API_URL || 'NOT SET (using default)');
console.log('  Google Client ID:', GOOGLE_CLIENT_ID ? 'SET ✅' : 'NOT SET ❌');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Import
import App from "./App";
import "./index.css";
import { NotificationProvider } from "./context/NotificationProvider";
import { BrandingProvider } from "./context/BrandingProvider";

// Test mock API
import { isMockMode } from "./utils/mockApi";
console.log("🔧 Mock API Status Check:", isMockMode() ? "ENABLED" : "DISABLED");
console.log(
  "🔧 Environment VITE_USE_MOCK_API:",
  import.meta.env.VITE_USE_MOCK_API
);
console.log("🔧 All environment variables:", import.meta.env);

// Load console reset commands (for development)
import "./utils/consoleReset.js";

// Create a client
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {" "}
      {/* Wrap App */}
      <BrowserRouter>
        <NotificationProvider>
          <BrandingProvider>
            <App />
          </BrandingProvider>
        </NotificationProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

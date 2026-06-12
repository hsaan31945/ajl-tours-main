import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import AppContextProvider from "./context/AppContext.jsx";
import { AdminProvider } from "./context/AdminContext";
import { BookingProvider } from "./context/BookingContext";
import { I18nProvider } from "./i18n";
import { SpeedInsights } from "@vercel/speed-insights/react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        <AdminProvider>
          <BookingProvider>
            <I18nProvider>
              <App />
              <SpeedInsights />
            </I18nProvider>
          </BookingProvider>
        </AdminProvider>
      </AppContextProvider>
    </BrowserRouter>
  </StrictMode>
);

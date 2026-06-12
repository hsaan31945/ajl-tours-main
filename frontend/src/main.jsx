import { StrictMode, Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import AppContextProvider from "./context/AppContext.jsx";
import { AdminProvider } from "./context/AdminContext";
import { BookingProvider } from "./context/BookingContext";
import { I18nProvider } from "./i18n";

const SpeedInsights = lazy(() =>
  import("@vercel/speed-insights/react").then((module) => ({ default: module.SpeedInsights }))
);

const DeferredSpeedInsights = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 2000);
    return () => window.clearTimeout(id);
  }, []);

  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <SpeedInsights />
    </Suspense>
  );
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        <AdminProvider>
          <BookingProvider>
            <I18nProvider>
              <App />
              <DeferredSpeedInsights />
            </I18nProvider>
          </BookingProvider>
        </AdminProvider>
      </AppContextProvider>
    </BrowserRouter>
  </StrictMode>
);

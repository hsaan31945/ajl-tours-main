import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import AppContextProvider from "./context/AppContext.jsx";
import { AdminProvider } from "./context/AdminContext";
import { BookingProvider } from "./context/BookingContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        <AdminProvider>
          <BookingProvider>
            <App />
          </BookingProvider>
        </AdminProvider>
      </AppContextProvider>
    </BrowserRouter>
  </StrictMode>
);

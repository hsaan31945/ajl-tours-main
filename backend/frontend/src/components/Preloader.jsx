import React, { useEffect, useState } from "react";

const Preloader = () => {
  const [fade, setFade] = useState(false);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    // Start fade out after 1.3s, then hide after 1.5s
    const fadeTimer = setTimeout(() => setFade(true), 1300);
    const hideTimer = setTimeout(() => setHide(true), 1500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (hide) return null;

  return (
    <div
      id="preloader"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#f4f4f4",
        zIndex: 999999,
        transition: "opacity 0.5s ease-in-out",
        opacity: fade ? 0 : 1,
        pointerEvents: fade ? "none" : "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        id="status"
        aria-label="Loading"
        style={{
          width: 56,
          height: 56,
          border: "4px solid #e5e7eb",
          borderTopColor: "#ea580c",
          borderRadius: "50%",
          animation: "ajl-spin 0.8s linear infinite",
        }}
      />
      <style>
        {`@keyframes ajl-spin { to { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
};

export default Preloader; 

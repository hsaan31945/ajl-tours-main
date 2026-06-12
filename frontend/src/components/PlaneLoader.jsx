import React from "react";
import { Plane } from "lucide-react";

const PlaneLoader = ({ label = "Loading AJL Tours" }) => {
  return (
    <div className="plane-loader-overlay" role="status" aria-live="polite" aria-label={label}>
      <div className="plane-loader-card">
        <div className="plane-loader-path" aria-hidden="true">
          <span className="plane-loader-trail" />
          <Plane className="plane-loader-icon" />
        </div>
        <span className="plane-loader-text">{label}</span>
      </div>
    </div>
  );
};

export default PlaneLoader;

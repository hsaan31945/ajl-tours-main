import React from "react";

const locationPin = (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block text-red-600 align-middle mx-1">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21c-4.418 0-8-5.373-8-10a8 8 0 1116 0c0 4.627-3.582 10-8 10z" />
    <circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth={2} fill="white" />
  </svg>
);

const FeaturesSection = ({ address, features }) => (
  <div className="w-full mb-6">
    <div className="flex items-center mb-2">
      {locationPin}
      <span className="text-lg font-semibold text-black ml-2">Address</span>
    </div>
    <p className="text-gray-600 mb-4 ml-7">{address}</p>
    <h2 className="text-xl font-semibold mb-2 text-black">Features We Offer</h2>
    <ul className="list-disc list-inside text-gray-700 mb-2 ml-4">
      {features && features.map((feature, idx) => (
        <li key={idx}>{feature}</li>
      ))}
    </ul>
  </div>
);

export default FeaturesSection; 
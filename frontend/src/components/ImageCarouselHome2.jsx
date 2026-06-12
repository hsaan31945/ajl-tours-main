import React, { useState, useEffect, useRef } from "react";

const ImageCarouselHome2 = ({ images = [], alt = "", className = "" }) => {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef(null);
  const numImages = images.length;

  useEffect(() => {
    if (numImages <= 1) return;
    timeoutRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % numImages);
    }, 2500);
    return () => clearInterval(timeoutRef.current);
  }, [numImages]);

  if (!numImages) return null;

  return (
    <div className={"relative overflow-hidden " + className} style={{ height: "100%" }}>
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{
          width: `${numImages * 100}%`,
          transform: `translateX(-${current * (100 / numImages)}%)`,
        }}
      >
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={alt}
            className="w-full h-full object-cover rounded-lg flex-shrink-0"
            style={{ width: `${100 / numImages}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarouselHome2; 
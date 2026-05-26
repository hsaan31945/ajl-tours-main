import React from "react";

const TourCardSkeleton = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-4/5" />
            <div className="h-4 bg-gray-200 rounded w-3/5" />
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-12" />
                <div className="h-7 bg-gray-200 rounded w-28" />
              </div>
              <div className="h-11 bg-gray-200 rounded-xl w-28" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default TourCardSkeleton;

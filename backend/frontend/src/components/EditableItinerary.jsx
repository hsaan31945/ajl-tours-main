import React, { useState } from "react";
import { Plus, X, Edit3, Move } from "lucide-react";

const EditableItinerary = ({ itinerary, onSave, isAdmin }) => {
  const [editMode, setEditMode] = useState(false);
  const [itineraryData, setItineraryData] = useState(itinerary || []);

  const handleAddItem = () => {
    const newItem = {
      title: "New Location",
      description: "Add description here...",
      duration: "1-2 hours",
      location: "Location name",
      activities: ["Activity 1"]
    };
    setItineraryData([...itineraryData, newItem]);
  };

  const handleRemoveItem = (index) => {
    const updated = [...itineraryData];
    updated.splice(index, 1);
    setItineraryData(updated);
  };

  const handleMoveItem = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === itineraryData.length - 1)) {
      return;
    }
    
    const updated = [...itineraryData];
    const newIndex = index + direction;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setItineraryData(updated);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...itineraryData];
    updated[index] = { ...updated[index], [field]: value };
    setItineraryData(updated);
  };

  const handleActivityChange = (itemIndex, activityIndex, value) => {
    const updated = [...itineraryData];
    updated[itemIndex].activities[activityIndex] = value;
    setItineraryData(updated);
  };

  const handleAddActivity = (itemIndex) => {
    const updated = [...itineraryData];
    updated[itemIndex].activities.push("New Activity");
    setItineraryData(updated);
  };

  const handleRemoveActivity = (itemIndex, activityIndex) => {
    const updated = [...itineraryData];
    updated[itemIndex].activities.splice(activityIndex, 1);
    setItineraryData(updated);
  };

  const handleSave = () => {
    onSave(itineraryData);
    setEditMode(false);
  };

  const handleCancel = () => {
    setItineraryData(itinerary || []);
    setEditMode(false);
  };

  if (!isAdmin && !editMode) {
    // Display mode for non-admins
    return (
      <div className="space-y-6">
        {itineraryData && itineraryData.map((item, index) => (
          <div key={index} className="border-l-4 border-orange-500 pl-4 py-2 bg-gray-50 rounded-r">
            <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
            <p className="text-gray-600 mt-1">{item.description}</p>
            {item.location && (
              <p className="text-sm text-gray-500 mt-1"><span className="font-medium">Location:</span> {item.location}</p>
            )}
            {item.duration && (
              <p className="text-sm text-gray-500 mt-1"><span className="font-medium">Duration:</span> {item.duration}</p>
            )}
            {item.activities && item.activities.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-gray-700">Activities:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {item.activities.map((activity, idx) => (
                    <li key={idx}>{activity}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editMode ? (
        <div className="space-y-6">
          {itineraryData.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Itinerary Item {index + 1}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleMoveItem(index, -1)}
                    className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveItem(index, 1)}
                    className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    title="Remove item"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={(e) => handleFieldChange(index, "title", e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={item.location || ""}
                    onChange={(e) => handleFieldChange(index, "location", e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={item.duration || ""}
                    onChange={(e) => handleFieldChange(index, "duration", e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={item.description || ""}
                  onChange={(e) => handleFieldChange(index, "description", e.target.value)}
                  className="w-full p-2 border rounded-md text-sm min-h-[80px]"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Activities</label>
                  <button
                    type="button"
                    onClick={() => handleAddActivity(index)}
                    className="text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Add Activity
                  </button>
                </div>
                <div className="space-y-2">
                  {item.activities && item.activities.map((activity, actIndex) => (
                    <div key={actIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={activity}
                        onChange={(e) => handleActivityChange(index, actIndex, e.target.value)}
                        className="flex-1 p-2 border rounded-md text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(index, actIndex)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
            >
              <Plus size={16} />
              Add Itinerary Item
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Itinerary</h3>
            {isAdmin && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1 bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600 text-sm"
              >
                <Edit3 size={16} />
                Edit Itinerary
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {itineraryData && itineraryData.map((item, index) => (
              <div key={index} className="border-l-4 border-orange-500 pl-4 py-2 bg-gray-50 rounded-r">
                <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                <p className="text-gray-600 mt-1">{item.description}</p>
                {item.location && (
                  <p className="text-sm text-gray-500 mt-1"><span className="font-medium">Location:</span> {item.location}</p>
                )}
                {item.duration && (
                  <p className="text-sm text-gray-500 mt-1"><span className="font-medium">Duration:</span> {item.duration}</p>
                )}
                {item.activities && item.activities.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-gray-700">Activities:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {item.activities.map((activity, idx) => (
                        <li key={idx}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {isAdmin && (
            <div className="mt-4">
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1 bg-orange-500 text-white px-3 py-2 rounded hover:bg-orange-600 text-sm"
              >
                <Edit3 size={16} />
                Edit Itinerary
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditableItinerary;
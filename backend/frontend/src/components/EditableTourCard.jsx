import React, { useEffect, useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import axios from "axios";
import { getTourId } from "../utils/tourId";
import { apiUrl } from "../utils/api";

const EditableTourCard = ({ tour, onUpdate, onTourClick }) => {
  const { isAdmin, passcodeHeader } = useAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editedTour, setEditedTour] = useState(tour);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setEditedTour(tour);
    setError("");
  }, [tour]);

  const handleFieldEdit = (field, value) => {
    setEditedTour(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const tourId = getTourId(tour);
      if (tourId) {
        const headers = passcodeHeader ? { 'X-Admin-Passcode': passcodeHeader } : {};
        const response = await axios.put(apiUrl(`/api/tours/${tourId}`), editedTour, { headers });
        if (onUpdate) onUpdate(response.data?.tour || response.data);
      }

      setIsEditing(false);
      setEditingField(null);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedTour(tour);
    setIsEditing(false);
    setEditingField(null);
    setError("");
  };

  const handleCardClick = () => {
    if (isEditing || editingField) return;
    if (onTourClick) onTourClick(editedTour);
  };

  const handleCardKeyDown = (event) => {
    if ((event.key === "Enter" || event.key === " ") && !isEditing && !editingField) {
      event.preventDefault();
      if (onTourClick) onTourClick(editedTour);
    }
  };

  const EditableField = ({ field, label, value, type = "text", multiline = false }) => {
    const isFieldEditing = editingField === field;
    
    return (
      <div className="relative group">
        {isFieldEditing ? (
          <div className="flex items-center gap-2">
            {multiline ? (
              <textarea
                value={editedTour[field] || ""}
                onChange={(e) => handleFieldEdit(field, e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-xs sm:text-sm min-h-[60px]"
                rows={3}
                autoFocus
              />
            ) : (
              <input
                type={type}
                value={editedTour[field] || ""}
                onChange={(e) => handleFieldEdit(field, type === 'number' ? Number(e.target.value) : e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-xs sm:text-sm"
                autoFocus
              />
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditingField(null);
                setEditedTour(tour);
              }}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <div className="flex-1">
              {multiline ? (
                <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{value || "No description"}</p>
              ) : (
                <div className="text-sm sm:text-base font-bold text-gray-900" style={{paddingTop: '15px', paddingBottom: '15px'}}>{value || label}</div>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingField(field);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title={`Edit ${label}`}
              >
                <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col cursor-pointer"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${editedTour.name || "tour"}`}
    >
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
        <img src={editedTour.images?.[0] || tour.images?.[0]} alt={editedTour.name} className="w-full h-full object-cover" />
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
              if (isEditing) handleCancel();
            }}
            className="absolute top-3 left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-md hover:bg-blue-600 transition-colors z-10"
            title={isEditing ? "Cancel editing" : "Edit tour"}
          >
            <Pencil className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
      
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="group mb-2">
          <EditableField field="name" label="Tour Name" value={editedTour.name} />
        </div>
        
        <div className="group mb-3 flex-1">
          <EditableField 
            field="description" 
            label="Description" 
            value={editedTour.description || editedTour.desc} 
            multiline={true}
          />
        </div>
        
        {error && (
          <div className="text-red-600 text-xs mb-2">{error}</div>
        )}
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mt-auto">
          <div className="flex items-center">
            <EditableField field="price" label="Price" value={editedTour.price} type="number" />
            <span className="text-xs sm:text-sm text-gray-500 ml-1">/person</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onTourClick) onTourClick(editedTour);
            }}
            className="bg-orange-600 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-orange-700 transition-colors w-full sm:w-auto"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditableTourCard;

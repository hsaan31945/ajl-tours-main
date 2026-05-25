import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';

const EditableField = ({ 
  value, 
  onSave, 
  className = '', 
  tag = 'span',
  placeholder = 'Click to edit...',
  multiline = false,
  maxLength = 500,
  showEditIcon = true,
  forceEditMode = false
}) => {
  const { isAdmin } = useAdmin();
  const effectiveIsAdmin = isAdmin || forceEditMode;
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value || '');
  const [originalText, setOriginalText] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setText(value || '');
    setOriginalText(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        if (!multiline) inputRef.current?.select();
      }, 50);
    }
  }, [isEditing, multiline]);

  const handleSave = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (text.trim() !== originalText) {
      const ok = await onSave(text.trim());
      if (ok) {
        setOriginalText(text.trim());
      } else {
        setText(originalText);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setText(originalText);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSave(e);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel(e);
    }
  };

  const handleBlur = (e) => {
    // Don't save on blur if clicking save/cancel buttons
    if (e.relatedTarget && (
      e.relatedTarget.closest('button[data-editable-save]') ||
      e.relatedTarget.closest('button[data-editable-cancel]')
    )) {
      return;
    }
    handleSave(e);
  };

  const Tag = tag;

  // Show edit interface if forceEditMode is true OR if user is admin
  if (!forceEditMode && !isAdmin) {
    return <Tag className={className}>{text || placeholder}</Tag>;
  }

  if (isEditing) {
    return multiline ? (
      <div className="relative">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`${className} w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:border-blue-600 min-h-[100px] resize-y`}
          placeholder={placeholder}
          maxLength={maxLength}
        />
        <div className="absolute top-1 right-1 flex gap-1 z-10">
          <button
            type="button"
            data-editable-save
            onMouseDown={(e) => {
              e.preventDefault();
              handleSave(e);
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 cursor-pointer"
            title="Save (Enter)"
          >
            ✓
          </button>
          <button
            type="button"
            data-editable-cancel
            onMouseDown={(e) => {
              e.preventDefault();
              handleCancel(e);
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 cursor-pointer"
            title="Cancel (Esc)"
          >
            ×
          </button>
        </div>
      </div>
    ) : (
      <div className="relative inline-block">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`${className} border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:border-blue-600`}
          placeholder={placeholder}
          maxLength={maxLength}
        />
        <div className="absolute top-1 right-1 flex gap-1 z-10">
          <button
            type="button"
            data-editable-save
            onMouseDown={(e) => {
              e.preventDefault();
              handleSave(e);
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 cursor-pointer"
            title="Save (Enter)"
          >
            ✓
          </button>
          <button
            type="button"
            data-editable-cancel
            onMouseDown={(e) => {
              e.preventDefault();
              handleCancel(e);
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 cursor-pointer"
            title="Cancel (Esc)"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <span className="relative inline-flex items-center group">
      <Tag className={`${className} ${effectiveIsAdmin ? 'border-dashed border-transparent hover:border-yellow-400 px-1 py-0.5 rounded' : ''}`}>
        {text || placeholder}
      </Tag>
      {showEditIcon && (forceEditMode || isAdmin) && (
        <button
          onClick={() => setIsEditing(true)}
          className="ml-2 opacity-100 text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1 rounded transition-all"
          title="Click to edit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
    </span>
  );
};

export default EditableField;

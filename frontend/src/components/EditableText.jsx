import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useEditMode } from '../context/EditModeContext';

const EditableText = ({ 
  children, 
  onSave, 
  className = '', 
  tag = 'span',
  placeholder = 'Right-click to edit...',
  multiline = false,
  maxLength = 500
}) => {
  const { isAdmin } = useAdmin();
  const { isEditMode } = useEditMode();
  const [isEditingText, setIsEditingText] = useState(false);
  const [text, setText] = useState(children);
  const [originalText, setOriginalText] = useState(children);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setText(children);
    setOriginalText(children);
  }, [children]);

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    if (menuOpen) {
      document.addEventListener('click', closeMenu);
      document.addEventListener('scroll', closeMenu, true);
      return () => {
        document.removeEventListener('click', closeMenu);
        document.removeEventListener('scroll', closeMenu, true);
      };
    }
  }, [menuOpen]);

  useEffect(() => {
    if (isEditingText) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (!multiline) inputRef.current.select();
        }
      }, 50);
    }
  }, [isEditingText, multiline]);

  const openEdit = () => {
    setMenuOpen(false);
    setIsEditingText(true);
  };

  const handleContextMenu = (e) => {
    // Allow context menu for both admin users and when in edit mode
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  const handleSave = async () => {
    if (text.trim() !== originalText) {
      const ok = await onSave(text.trim());
      if (ok) {
        setOriginalText(text.trim());
      } else {
        setText(originalText);
      }
    }
    setIsEditingText(false);
  };

  const handleCancel = () => {
    setText(originalText);
    setIsEditingText(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const Tag = tag;

  return (
    <span ref={containerRef} className="relative inline-flex items-center group" onContextMenu={handleContextMenu}>
      {(!isAdmin || !isEditingText) && (
        <>
          <Tag 
            className={`${className} ${isAdmin ? 'cursor-pointer hover:bg-yellow-100 hover:outline-dashed hover:outline-2 hover:outline-yellow-400 px-1 py-0.5 rounded border-2 border-transparent focus:border-blue-500' : ''}`}
            title={isAdmin ? 'Click pencil icon to edit' : ''}
            onContextMenu={handleContextMenu}
          >
            {text || placeholder}
          </Tag>
          {isAdmin && !isEditingText && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openEdit();
              }}
              className="ml-2 opacity-100 text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1 rounded transition-all"
              title="Click to edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </>
      )}

      {isAdmin && menuOpen && !isEditingText && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded shadow-md text-sm"
          style={{ left: menuPos.x - (containerRef.current?.getBoundingClientRect().left || 0), top: menuPos.y - (containerRef.current?.getBoundingClientRect().top || 0) }}
          onClick={(e) => { e.stopPropagation(); }}
        >
          <button
            className="block px-3 py-2 w-full text-left hover:bg-gray-100"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(); }}
          >
            Edit field
          </button>
        </div>
      )}

      {isAdmin && isEditingText && (
        multiline ? (
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
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`${className} w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:border-blue-600`}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        )
      )}
    </span>
  );
};

export default EditableText;

import React from 'react';
import { useAdmin } from '../context/AdminContext';

const AdminModeIndicator = () => {
  const { isAdmin } = useAdmin();
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-green-600 text-white px-4 py-1.5 z-[100] text-xs font-bold text-center shadow-[0_-4px_6px_rgba(0,0,0,0.1)] transition-all animate-pulse">
      ✓ ADMIN MODE ACTIVE - YOU CAN EDIT ALL CONTENT DIRECTLY
    </div>
  );
};

export default AdminModeIndicator;


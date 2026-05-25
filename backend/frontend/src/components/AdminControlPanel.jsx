import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const AdminControlPanel = () => {
  const { isAdmin } = useAdmin();
  const { user } = useContext(AppContext);

  // Only show if admin is enabled AND user is logged in (admin logged in as user)
  if (!isAdmin || !user) {
    return null;
  }

  // Return null - panel removed as requested (not responsive)
  return null;
};

export default AdminControlPanel;

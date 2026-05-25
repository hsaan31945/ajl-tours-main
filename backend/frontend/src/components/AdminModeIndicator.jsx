import React from 'react';
import { useAdmin } from '../context/AdminContext';

const AdminModeIndicator = () => {
  useAdmin();
  return null;
};

export default AdminModeIndicator;

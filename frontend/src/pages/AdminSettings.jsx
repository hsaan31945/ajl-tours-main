import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";

const AdminSettings = () => {
  const { adminUsername, adminPassword, changeAdminCredentials } = useContext(AppContext);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [username, setUsername] = useState(adminUsername);
  const [password, setPassword] = useState(adminPassword);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    changeAdminCredentials(username, password);
    setSuccess("Credentials updated for this session.");
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 text-center">Admin Settings</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow max-w-md w-full">
        <div className="mb-4">
          <label className="block text-md font-medium">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
        <div className="mb-4">
          <label className="block text-md font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
        <button type="submit" className="w-full text-lg py-3 px-6 bg-red-600 hover:bg-red-700 font-bold rounded-lg shadow-md transition-colors">Update</button>
        {success && <div className="text-green-600 mt-4">{success}</div>}
      </form>
    </div>
  );
};

export default AdminSettings; 
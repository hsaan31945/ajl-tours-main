import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../utils/api";

export const AdminContext = createContext();

const TOKEN_KEY = 'adminToken';
const ADMIN_KEY = 'isAdminMode';

export function useAdmin() {
	return useContext(AdminContext);
}

export function AdminProvider({ children }) {
	const [isAdmin, setIsAdmin] = useState(false);
	const [token, setToken] = useState(null);
	const [loading, setLoading] = useState(true);

	// Initialize from localStorage
	useEffect(() => {
		const savedToken = localStorage.getItem(TOKEN_KEY);
		const savedAdmin = localStorage.getItem(ADMIN_KEY);
		
		if (savedToken) {
			// Verify token is still valid
			setToken(savedToken);
			setIsAdmin(true);
		} else if (savedAdmin === 'true') {
			// Legacy passcode mode - migrate to JWT
			setIsAdmin(true);
		}
		
		setLoading(false);
	}, []);

	/**
	 * Login with password only (JWT)
	 */
	const login = async (password) => {
		try {
			let response;
			try {
				response = await axios.post(apiUrl('/api/auth/admin/login'), { password });
			} catch (error) {
				response = await axios.post(apiUrl('/api/admin/login'), { password });
			}
			
			if (response.data.success && response.data.token) {
				const newToken = response.data.token;
				setToken(newToken);
				setIsAdmin(true);
				localStorage.setItem(TOKEN_KEY, newToken);
				localStorage.setItem(ADMIN_KEY, 'true');
				return { success: true };
			}
			
			return { success: false, error: 'Login failed' };
		} catch (error) {
			return {
				success: false,
				error: error.response?.data?.error || error.message || 'Login failed'
			};
		}
	};

	/**
	 * Legacy passcode login (deprecated but kept for backward compatibility)
	 * @deprecated Use login() with email/password instead
	 */
	const enableWithPasscode = async (code) => {
		try {
			const trimmedCode = String(code || '').trim();
			const response = await axios.post(
				apiUrl('/api/admin/verify'),
				{ passcode: trimmedCode },
				{ headers: { 'X-Admin-Passcode': trimmedCode } }
			);

			if (response.data?.success) {
			setIsAdmin(true);
			localStorage.setItem(ADMIN_KEY, 'true');
				localStorage.setItem('adminPasscode', code);
			return true;
		}
		} catch (error) {
			return false;
		}
		return false;
	};

	/**
	 * Logout
	 */
	const disableAdmin = () => {
		setIsAdmin(false);
		setToken(null);
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(ADMIN_KEY);
		localStorage.removeItem('isAdmin');
		localStorage.removeItem('adminPasscode');
	};

	/**
	 * Get authorization header for API requests
	 */
	const getAuthHeader = () => {
		if (token) {
			return { 'Authorization': `Bearer ${token}` };
		}
		// Fallback to passcode for backward compatibility
		const PASSCODE = localStorage.getItem('adminPasscode') || import.meta.env.VITE_ADMIN_PASSCODE || '';
		return PASSCODE ? { 'X-Admin-Passcode': PASSCODE } : {};
	};

	/**
	 * Get passcode header (for backward compatibility)
	 * @deprecated Use getAuthHeader() instead
	 */
	const getPasscodeHeader = () => {
		if (token) {
			return null; // Prefer JWT
		}
		const PASSCODE = localStorage.getItem('adminPasscode') || import.meta.env.VITE_ADMIN_PASSCODE || '';
		return PASSCODE || null;
	};

	const value = {
		isAdmin,
		token,
		loading,
		login,
		enableWithPasscode, // Deprecated
		disableAdmin,
		getAuthHeader,
		passcodeHeader: getPasscodeHeader(), // Deprecated - for backward compatibility
	};

	return (
		<AdminContext.Provider value={value}>
			{children}
		</AdminContext.Provider>
	);
} 

import React, { createContext, useState, useContext } from "react";

export const EditModeContext = createContext();

export function useEditMode() {
	return useContext(EditModeContext);
}

export function EditModeProvider({ children }) {
	const [isEditMode, setIsEditMode] = useState(false);

	const value = {
		isEditMode,
		setIsEditMode,
		toggleEditMode: () => setIsEditMode(prev => !prev)
	};

	return (
		<EditModeContext.Provider value={value}>
			{children}
		</EditModeContext.Provider>
	);
}
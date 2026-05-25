import React, { useEffect, useState } from "react";
import ImageCarouselHome2 from "./ImageCarouselHome2";
import ButtonHome2 from "./ButtonHome2";
import tourImg01 from "../assets/t1.jpg";
import tourImg02 from "../assets/t2.jpg";
import tourImg03 from "../assets/t3.jpg";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import EditableText from "./EditableText";

const SwitzerlandCardHome2 = () => {
	const navigate = useNavigate();
	const { passcodeHeader } = useAdmin();
	const [availableTours, setAvailableTours] = useState(null);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch('/api/content/homepage/available_tours');
				const data = await res.json();
				if (res.ok && data?.content) {
					setAvailableTours(data.content);
				}
			} catch (e) {}
		})();
	}, []);

	const updateSection = async (updated) => {
		try {
			const res = await fetch('/api/admin/content/available_tours', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'X-Admin-Passcode': passcodeHeader || ''
				},
				body: JSON.stringify({ content: updated })
			});
			if (!res.ok) return false;
			setAvailableTours(updated);
			return true;
		} catch (e) {
			return false;
		}
	};

	const handleSaveDescription = async (newDescription) => {
		const current = availableTours || {};
		const updated = {
			...current,
			switzerland: {
				...(current?.switzerland || {}),
				description: newDescription
			}
		};
		return await updateSection(updated);
	};

	const handleSaveTitle = async (newTitle) => {
		const current = availableTours || {};
		const updated = {
			...current,
			switzerland: {
				...(current?.switzerland || {}),
				title: newTitle
			}
		};
		return await updateSection(updated);
	};

	const switzerlandContent = (availableTours && availableTours.switzerland) || {
		title: 'Switzerland',
		description: 'Experience the beauty of Switzerland: Alps, lakes, scenic trains, and more!'
	};

	return (
		<div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center max-w-md w-full h-[500px]">
			<ImageCarouselHome2 images={[tourImg02, tourImg03, tourImg01]} alt="Switzerland" className="w-full h-64 object-cover rounded-lg mb-4" />
			
			<EditableText
				tag="h2"
				className="text-3xl font-bold mb-2 text-black"
				onSave={handleSaveTitle}
			>
				{switzerlandContent.title}
			</EditableText>
			
			{/* Price removed as requested */}
			
			<EditableText
				tag="p"
				className="text-gray-600 mb-6 text-center flex-1 line-clamp-3"
				onSave={handleSaveDescription}
				multiline={true}
			>
				{switzerlandContent.description}
			</EditableText>
			
			<ButtonHome2 onClick={() => navigate("/switzerland")}>Explore</ButtonHome2>
		</div>
	);
};

export default SwitzerlandCardHome2; 
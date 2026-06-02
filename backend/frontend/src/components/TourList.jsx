import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TourCard from "./TourCard.jsx";
import { fetchToursList } from "../services/toursApi";

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const TourList = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTours = async () => {
      try {
        const data = await fetchToursList({ full: true });
        setTours(data);
      } catch (error) {
        console.error('Error fetching tours:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTours();
  }, []);
  
  if (loading) return <div>Loading tours...</div>;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
      {tours.map((tour, index) => (
        <motion.div
          key={tour._id || index}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: index * 0.1 }}
          className="w-full"
        >
          <TourCard tour={tour} />
        </motion.div>
      ))}
    </div>
  );
};

export default TourList;

import React from "react";
import { motion } from "framer-motion";

const ServiceCard = ({ item }) => {
  return (
    <motion.div
      className="bg-white/20 shadow-lg rounded-lg overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out"
      whileHover={{ scale: 1.08, y: -6, transition: { duration: 0.3 } }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <div className="p-6 flex items-center space-x-4">
        <div className="text-4xl text-gray-700">{item.icon}</div>
        <div>
          <h5 className="text-xl font-semibold text-gray-800 mb-3">
            {item.title}
          </h5>
          <p className="text-gray-600">{item.desc}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;

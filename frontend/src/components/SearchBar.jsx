import React from "react";
import { stepsData } from "../assets/assets";
import { motion } from "framer-motion";

const SearchBar = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center my-32"
      initial={{ opacity: 0.2, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      viewport={{ once: true }}
    >
      <h1 className="text-3xl sm:text-4xl font-semibold mb-2 text-center">
        Find Your Perfect <span className="text-red-600">Destination</span>
      </h1>
      <p className="text-center text-lg text-gray-600 mb-8">
        Discover Destinations Based on Your Interests
      </p>

      <motion.div
        className="space-y-4 w-full max-w-3xl text-sm"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0, y: 50 },
          show: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.3, duration: 0.8 },
          },
        }}
      >
        {stepsData.map((item, index) => (
          <motion.div
            key={index}
            className="flex items-center gap-4 p-5 px-8 bg-white/20 shadow-md border cursor-pointer rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
            whileTap={{ scale: 0.98 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <item.icon className="text-red-600 w-6 h-6" />
            <div>
              <h2 className="text-xl font-medium">{item.title}</h2>
              <p className="mt-2 text-gray-500">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default SearchBar;

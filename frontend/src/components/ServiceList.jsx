import React from "react";
import ServiceCard from "./ServiceCard";
import { MapPin, Users, Star, Clock, Globe, Shield } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  {
    icon: <MapPin className="text-red-600" />,
    title: "Private Swiss Tours",
    desc: "Personalized tours tailored to your interests, pace, and schedule with multilingual local guides.",
  },
  {
    icon: <Users className="text-red-600" />,
    title: "Handpicked Destinations",
    desc: "Curated Swiss experiences featuring Crash Landing on You locations, Alpine villages, and hidden gems.",
  },
  {
    icon: <Clock className="text-red-600" />,
    title: "Seamless Planning & 24/7 Support",
    desc: "Complete travel planning from initial contact to journey's end with round-the-clock assistance.",
  },
  {
    icon: <Star className="text-red-600" />,
    title: "Customizable Itineraries",
    desc: "Fully flexible tours that adapt to your interests, schedule, and preferences for the perfect Swiss adventure.",
  },
  {
    icon: <Globe className="text-red-600" />,
    title: "Multilingual Guides",
    desc: "Knowledgeable local guides fluent in multiple languages to enhance your Swiss travel experience.",
  },
  {
    icon: <Shield className="text-red-600" />,
    title: "Professional Service",
    desc: "Punctual, polite, and professional chauffeurs with excellent communication skills and local expertise.",
  },
];

const ServiceList = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.15, duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <ServiceCard item={item} />
        </motion.div>
      ))}
    </div>
  );
};

export default ServiceList;

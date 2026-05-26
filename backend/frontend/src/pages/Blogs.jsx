import React from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { blogs } from "../data/blogs";
import SEO from "../components/SEO";

const Blogs = () => {
  const navigate = useNavigate();

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Switzerland Travel Blog | AJL Tours"
        description="Read AJL Tours travel guides, Swiss destination inspiration, and private tour tips for premium Switzerland trips."
      />
      {/* Hero Section */}
      <motion.div
        className="relative bg-gradient-to-r from-orange-500 to-red-600 text-white py-20"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Travel <span className="text-black">Blog</span>
          </h1>
          <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto">
            Discover amazing destinations, travel tips, and unforgettable experiences
          </p>
        </div>
      </motion.div>

      {/* Blog Posts */}
      <div className="max-w-6xl mx-auto px-6 py-16">
                 <motion.div
           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
           variants={staggerContainer}
           initial="hidden"
           animate="visible"
         >
                     {blogs.map((blog, index) => (
             <motion.article
               key={blog.id}
               className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
               variants={fadeIn}
             >
               {/* Image with Overlay */}
               <div className="relative h-64 md:h-80 overflow-hidden">
                 <img
                   src={blog.image}
                   alt={blog.title}
                   loading={index === 0 ? "eager" : "lazy"}
                   decoding="async"
                   className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                 
                 {/* Category Badge */}
                 <div className="absolute top-4 left-4">
                   <span className="inline-block bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                     {blog.category}
                   </span>
                 </div>
                 
                 {/* Meta Info Overlay */}
                 <div className="absolute bottom-4 left-4 right-4">
                   <div className="flex items-center gap-3 text-white text-xs mb-2">
                     <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                       <Calendar className="w-3 h-3" />
                       {blog.date}
                     </div>
                     <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                       <Clock className="w-3 h-3" />
                       {blog.readTime}
                     </div>
                     <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full">
                       <MapPin className="w-3 h-3" />
                       {blog.location}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Content Section */}
               <div className="p-6">
                 {/* Title */}
                 <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                   {blog.title}
                 </h2>

                 {/* Subtitle */}
                 <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                   {blog.subtitle}
                 </p>

                 {/* Tour Name */}
                 <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-xl border border-orange-100 mb-4">
                   <p className="text-xs text-orange-600 font-medium mb-1">Featured Tour</p>
                   <p className="text-sm font-semibold text-gray-900 line-clamp-1">{blog.tourName}</p>
                 </div>

                 {/* Content Preview */}
                  <div className="text-gray-700 text-sm leading-relaxed mb-4">
                    {blog.content.slice(0, 1).map((paragraph, idx) => (
                      <p key={idx} className="line-clamp-3">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                 {/* Read More Button */}
                 <div className="flex items-center justify-between">
                   <button
                     onClick={() => navigate(`/blogs/${blog.id}`)}
                     className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                   >
                     Read Full Article
                     <ArrowRight className="w-3 h-3" />
                   </button>
                   
                   {/* Decorative Element */}
                   <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-200 to-red-200 flex items-center justify-center">
                     <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                   </div>
                 </div>
               </div>
             </motion.article>
           ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Experience These Adventures?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Book your Switzerland tour today and create memories that will last a lifetime.
          </p>
          <button
            onClick={() => navigate('/tours')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200"
          >
            Explore Tours
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Blogs;

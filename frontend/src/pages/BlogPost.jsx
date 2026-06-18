import React from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, ArrowLeft, Share2, BookOpen } from "lucide-react";
import { blogs } from "../data/blogs";
import SEO from "../components/SEO";
import { absoluteUrl, createBreadcrumbJsonLd } from "../utils/seo";

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const blog = blogs.find((item) => item.slug === id || item.id === Number(id));

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SEO title="Blog Not Found | AJL Tours" description="The requested AJL Tours blog post could not be found." noIndex />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
          <button
            onClick={() => navigate('/blogs')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  if (id !== blog.slug) {
    return <Navigate to={`/blogs/${blog.slug}`} replace />;
  }

  const blogPath = `/blogs/${blog.slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={`${blog.title} | AJL Tours`}
        description={blog.subtitle}
        image={blog.image}
        canonicalPath={blogPath}
        type="article"
        structuredData={[
          createBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blogs", path: "/blogs" },
            { name: blog.title, path: blogPath },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: blog.title,
            description: blog.subtitle,
            image: absoluteUrl(blog.image),
            datePublished: new Date(blog.date).toISOString(),
            mainEntityOfPage: absoluteUrl(blogPath),
            author: { "@type": "Organization", name: "AJL Tours" },
            publisher: {
              "@type": "Organization",
              name: "AJL Tours",
              logo: { "@type": "ImageObject", url: absoluteUrl("/logoTravel-300.png") },
            },
          },
        ]}
      />
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <button
          onClick={() => navigate('/blogs')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blogs
        </button>
      </div>

      <article className="max-w-4xl mx-auto px-6 pb-16">
        <div className="mb-8">
          <img
            src={blog.image}
            alt={blog.title}
            loading="eager"
            decoding="async"
            className="w-full h-96 object-cover rounded-2xl shadow-lg"
          />
        </div>

        <header className="mb-8">
          <span className="inline-block bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            {blog.category}
          </span>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {blog.title}
          </h1>

          <p className="text-xl text-gray-600 mb-6">
            {blog.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {blog.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {blog.readTime}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {blog.location}
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {blog.content.length} paragraphs
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Featured Tour</h2>
            <p className="text-gray-700 font-medium">{blog.tourName}</p>
            <button
              onClick={() => navigate('/tours')}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
            >
              Book This Tour
            </button>
          </div>
        </header>

        <div className="prose prose-lg max-w-none">
          {blog.content.map((paragraph, index) => (
            <p key={index} className="text-gray-700 leading-relaxed mb-6 text-lg">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-orange-500 to-red-600 text-white p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Experience This Adventure?</h2>
          <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
            Book your Switzerland tour today and create memories that will last a lifetime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/tours')}
              className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200"
            >
              Explore All Tours
            </button>
            <button
              onClick={() => navigate('/blogs')}
              className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200"
            >
              Read More Blogs
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;

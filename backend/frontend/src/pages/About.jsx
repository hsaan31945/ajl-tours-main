import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const About = () => {
  return (
    <div className="about-page">
      <section
        className="about-header text-center py-16 bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url(https://img.freepik.com/free-photo/travel-concept-with-landmarks_23-2149153256.jpg?t=st=1734459512~exp=1734463112~hmac=956199774261d513cea7b1861f7343dcc4bcdc9298fbcf1c82e3028ab2da7f18&w=1800)",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <motion.h1
          className="text-white text-4xl font-bold relative z-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Welcome to <span className="text-red-400">AJL Tours</span>
        </motion.h1>
        <motion.p
          className="text-white mt-4 text-lg relative z-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          More Than Tours — We Create Life's Favourite Moments
        </motion.p>
      </section>

      <section className="about-intro py-16 px-4 bg-light-gray">
        <motion.div
          className="container mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-3xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            About <span className="text-red-600">AJL Tours</span>
          </motion.h2>
          <motion.p
            className="text-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            AJL Tours specializes in creating unforgettable Swiss travel experiences. 
            We transform destinations into lifelong memories through personalized private tours, 
            featuring handpicked destinations, seamless planning, and 24/7 support. 
            From Crash Landing on You locations to Alpine adventures, we craft 
            bespoke itineraries that cater to your pace and interests.
          </motion.p>
        </motion.div>
      </section>

      <section className="our-mission py-16">
        <motion.div
          className="container mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-3xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Our <span className="text-red-600">Mission</span>
          </motion.h2>
          <motion.p
            className="text-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Our mission is to provide exceptional Swiss travel experiences that go beyond 
            ordinary tours. We create personalized journeys that transform destinations 
            into lifelong memories, offering seamless planning, multilingual local guides, 
            and 24/7 support to ensure every moment of your Swiss adventure is perfect.
          </motion.p>
        </motion.div>
      </section>

      <section className="why-choose-us py-16 bg-light-gray">
        <motion.div
          className="container mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-3xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Why Choose <span className="text-red-600">Us?</span>
          </motion.h2>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              {
                img: "https://img.freepik.com/free-photo/young-woman-sitting-coffee-table-with-laptop-home-working-on-projects_1150-18219.jpg?w=1380&t=st=1689821537~exp=1689822137~hmac=ea537998d858e2d68fa85c2165e8ac9c07eab70f89db67d943e48a3e84665e13",
                title: "Professional Swiss Guides",
                desc: "Our multilingual local guides provide expert knowledge and personalized service, ensuring authentic Swiss experiences.",
              },
              {
                img: "https://img.freepik.com/free-photo/exotic-sunset-beach-ideal-relaxing-place_1150-18313.jpg?w=1380&t=st=1689821972~exp=1689822572~hmac=e4d945a3c49b09012d44a39b1b4b3a22cc2b6f700f9735360b171a320c2f29d5",
                title: "Handpicked Swiss Destinations",
                desc: "From Crash Landing on You locations to Alpine villages, we curate exclusive Swiss experiences including Zurich, Lucerne, Interlaken, and Rhine Falls.",
              },
              {
                img: "https://img.freepik.com/free-photo/tourist-enjoying-luxury-resort-terrace-with-beautiful-view_1150-18335.jpg?w=1380&t=st=1689822102~exp=1689822702~hmac=573d74584f5e647b90fcbd2e91c8a7f313e0b3f438742970de8763fc7be2f215",
                title: "Seamless Planning & 24/7 Support",
                desc: "Complete travel planning from initial contact to journey's end, with round-the-clock support and flexible itineraries tailored to your interests.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="w-full md:w-1/3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.3, duration: 0.8 }}
              >
                <img
                  className="rounded-lg mb-4"
                  src={item.img}
                  alt={item.title}
                />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="our-team py-16 bg-white/20">
        <motion.div
          className="container mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-3xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Meet Our <span className="text-red-600">Team</span>
          </motion.h2>
          <p className="text-lg mb-8">
            Our team of Swiss travel experts is dedicated to creating 
            unforgettable experiences. We are passionate about showcasing 
            Switzerland's hidden gems and helping you discover authentic 
            Swiss culture and breathtaking landscapes.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              {
                img: "https://img.freepik.com/free-photo/smiling-young-travel-agent-holding-travel-book-while-working-office_1150-18351.jpg?w=1380&t=st=1689822301~exp=1689822901~hmac=fd79c254f2a30fc1ad4fa28cc5e225e99f4232f9db184e00d5e20b27ff51d426",
                name: "Shabbir",
                title: "Senior Swiss Guide",
              },
              {
                img: "https://img.freepik.com/free-photo/cheerful-young-tourist-student-smiling-camera-outdoor_1150-18412.jpg?w=1380&t=st=1689822402~exp=1689823002~hmac=6177bbd4170abf3788d0bc6fc9ef62ff1b71c5791ec59001c0d50fa04a4d3e78",
                name: "Zafar",
                title: "Swiss Tour Specialist",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="team-member w-1/3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.3, duration: 0.8 }}
              >
                <img
                  className="rounded-full mb-4"
                  src={item.img}
                  alt={item.name}
                />
                <h3 className="text-xl font-semibold">{item.name}</h3>
                <p>{item.title}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="contact-info py-16 bg-light-gray text-center">
        <motion.div
          className="container mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-3xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Get in <span className="text-red-600">Touch</span>
          </motion.h2>
          <p className="text-lg mb-4">
            Have any questions or need help with your booking? We're here to
            assist you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mail className="w-8 h-8 mb-4" />,
                title: "Email",
                content: "contact@ajltransfer.com",
              },
              {
                icon: <Phone className="w-8 h-8 mb-4" />,
                title: "Phone",
                content: "+41 76 391 30 02",
              },
              {
                icon: <MapPin className="w-8 h-8 mb-4" />,
                title: "Address",
                content: "Plattenstrasse 7, 8152 Opfikon, Switzerland",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                transition={{ delay: index * 0.2 }}
              >
                <div className="flex justify-center">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p>{item.content}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <a
              href="mailto:contact@ajltransfer.com"
              className="inline-block px-8 py-3 bg-white text-red-600 rounded-full font-semibold hover:bg-red-100 transition duration-300"
            >
              Contact Us
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default About;

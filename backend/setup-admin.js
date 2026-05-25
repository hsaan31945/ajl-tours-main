const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const HomepageContent = require('./models/HomepageContent');
require('dotenv').config();

const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:salman1122@ajltours.ozyldk7.mongodb.net/AJLTours?appName=AJLTours');
    console.log('Connected to MongoDB');

    // Create admin account
    const adminData = {
      username: 'admin',
      email: 'admin@tripgo.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    };

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: adminData.username });
    if (existingAdmin) {
      console.log('Admin account already exists');
    } else {
      const admin = new Admin(adminData);
      await admin.save();
      console.log('Admin account created successfully');
      console.log('Username: admin');
      console.log('Password: admin123');
    }

    // Initialize homepage content
    const defaultContent = {
      available_tours: {
        switzerland: {
          title: 'Switzerland',
          description: 'Experience the beauty of Switzerland: Alps, lakes, scenic trains, and more!',
          showPrice: false,
          order: 1
        }
      },
      tour_descriptions: {
        switzerland: {
          title: 'Switzerland Tour',
          description: 'Experience the breathtaking Alps, pristine lakes, charming villages, and world-class cities of Switzerland with personalized attention and flexible itineraries designed just for you. Tailored tours available - tell us what you have in mind and we\'ll make it happen.',
          order: 1
        }
      }
    };

    // Initialize each section
    for (const [section, content] of Object.entries(defaultContent)) {
      const existingContent = await HomepageContent.findOne({ section });
      if (!existingContent) {
        const homepageContent = new HomepageContent({
          section,
          content,
          updatedBy: 'system'
        });
        await homepageContent.save();
        console.log(`${section} content initialized`);
      } else {
        console.log(`${section} content already exists`);
      }
    }

    console.log('Setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
};

setupAdmin();





const Admin = require('../models/Admin');
const HomepageContent = require('../models/HomepageContent');

// Basic admin login (username/email + password). For now, stub success.
async function adminLogin(req, res) {
  try {
    return res.json({ success: true, message: 'Admin login stub' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Create an admin user (stub that ensures required fields)
async function createAdmin(req, res) {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, password required' });
    }
    const admin = new Admin({ username, email, password });
    await admin.save();
    return res.status(201).json(admin.toJSON());
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Get homepage content for a section
async function getHomepageContent(req, res) {
  try {
    const { section } = req.params;
    const doc = await HomepageContent.findOne({ section });
    if (!doc) return res.status(404).json({ message: 'Section not found' });
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Update homepage content for a section
async function updateHomepageContent(req, res) {
  try {
    const { section } = req.params;
    const { content, isActive } = req.body || {};
    const doc = await HomepageContent.findOneAndUpdate(
      { section },
      { content: content ?? {}, isActive: isActive ?? true },
      { new: true, upsert: true }
    );
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// Get all homepage content
async function getAllHomepageContent(req, res) {
  try {
    const items = await HomepageContent.find().sort({ section: 1 });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  adminLogin,
  createAdmin,
  getHomepageContent,
  updateHomepageContent,
  getAllHomepageContent,
};

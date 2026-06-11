const HomepageContent = require('../models/HomepageContent');

async function getPublicHomepageContent(req, res) {
  try {
    const { section } = req.params;
    const doc = await HomepageContent.findOne({ section, isActive: true });
    if (!doc) return res.status(404).json({ message: 'Section not found' });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAllPublicHomepageContent(req, res) {
  try {
    const items = await HomepageContent.find({ isActive: true }).sort({ section: 1 });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getPublicHomepageContent,
  getAllPublicHomepageContent,
};

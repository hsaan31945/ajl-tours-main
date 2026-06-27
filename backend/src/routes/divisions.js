const express = require('express');
const Division = require('../../models/Division');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const divisions = await Division.find({
      isActive: { $ne: false },
      $or: [
        { slug: { $in: ['switzerland', 'srilanka', 'sri-lanka', 'france'] } },
        { name: /^Switzerland$/i },
        { name: /^Srilanka$/i },
        { name: /^Sri Lanka$/i },
        { name: /^France$/i },
      ],
    }).sort({ name: 1 }).lean();

    res.setHeader('Cache-Control', 'no-store');
    res.json(divisions.map((division) => ({
      id: division._id.toString(),
      _id: division._id.toString(),
      name: division.name,
      slug: division.slug,
      description: division.description || '',
      bannerImage: division.bannerImage || '',
      banner_image: division.bannerImage || '',
      isActive: division.isActive !== false,
    })));
  } catch (error) {
    next(error);
  }
});

module.exports = router;

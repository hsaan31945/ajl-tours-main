/**
 * Database config bridge
 * Maps configuration-based database requires to the unified db helper in lib/
 */
const { connectDB } = require('../../lib/db');

module.exports = { connectDB };

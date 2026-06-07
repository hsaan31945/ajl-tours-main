const supabase = require('../config/supabase');
const User = require('../models/User');
const { getPasswordPolicyMessage } = require('../src/utils/passwordPolicy');

/**
 * Register a new user using Supabase Auth
 */
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // 1. Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone } // Store metadata in auth for redundancy
      }
    });

    if (authError) throw authError;

    // 2. Create user profile in our 'profiles' table
    // Note: In Supabase, often triggers handle this, but we'll do it manually for explicit migration logic.
    if (authData.user) {
      const { error: profileError } = await User.create({
        id: authData.user.id, // Match the UUID from auth.users
        name,
        email,
        phone,
        role: 'user'
      });
      if (profileError) console.error('Error creating profile:', profileError);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      user: authData.user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Login user using Supabase Auth
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      session: data.session,
      user: data.user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and new password are required' });
    }

    const passwordMessage = getPasswordPolicyMessage(password);
    if (passwordMessage) {
      return res.status(400).json({ success: false, error: passwordMessage });
    }

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(404).json({ success: false, error: "Account with this email doesn't exist." });
    }

    user.password = password;
    user.passwordChangedAt = new Date();
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to reset password' });
  }
};

/**
 * Verify current session token
 */
const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  resetPassword,
  verifyToken
};

// utils/generateToken.js - JWT token generation utility
const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user
 * @param {string} id - User's MongoDB ObjectId
 * @param {string} role - User's role (admin, manager, user)
 * @returns {string} JWT token valid for 7 days
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = generateToken;

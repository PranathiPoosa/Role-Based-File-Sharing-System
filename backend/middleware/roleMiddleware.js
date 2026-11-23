// middleware/roleMiddleware.js - Role-based access control middleware

/**
 * Authorize specific roles to access a route
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'manager', 'user')
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = { authorize };

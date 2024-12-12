const Role = require('../models/Role'); // Role model
const User = require('../models/User'); // User model

const roleCheckMiddleWare = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).populate('role');

      if (!user || !allowedRoles.includes(user.role.name)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports = roleCheckMiddleWare
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pakistan_police_lost_and_found_default_secret');
    
    req.user = decoded; // { id, username, name }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// middleware/authMiddleware.js
// JWT authentication middleware
// Verifies the Bearer token sent by the frontend on protected routes

import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing or unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_here', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

export default authenticateToken;

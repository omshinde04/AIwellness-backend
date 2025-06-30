const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if header exists and is formatted correctly
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token and attach payload to request
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT Verification Failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;

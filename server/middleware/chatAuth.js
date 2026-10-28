
const jwt = require("jsonwebtoken");

module.exports = function chatAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Please login to use the AI assistant.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from server/.env");
      return res.status(500).json({
        message: "Authentication is not configured.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded._id || decoded.userId;
    const role = String(decoded.role || "").toLowerCase();

    if (!userId) {
      return res.status(401).json({
        message: "Invalid login token.",
      });
    }

    const allowedRoles = [
      "patient",
      "doctor",
      "receptionist",
      "admin",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: "Your account role is not supported.",
      });
    }

    req.chatUser = { id: String(userId), role };
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Your session is invalid or expired. Please login again.",
    });
  }
};

import app from '../backend/src/server.js';

export default function handler(req, res) {
  try {
    // Strip trailing slashes or adjust path if needed
    return app(req, res);
  } catch (err) {
    console.error("Vercel Serverless Function Crash:", err);
    return res.status(500).json({
      error: err.message || "Internal Server Error",
      stack: err.stack
    });
  }
}

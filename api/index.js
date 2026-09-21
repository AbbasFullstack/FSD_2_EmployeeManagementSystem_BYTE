const server = require("../server");

// Export the Express app for Vercel Serverless Functions
module.exports = server.app;

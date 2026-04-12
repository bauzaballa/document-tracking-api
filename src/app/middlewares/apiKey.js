/**
 * API Key Middleware
 *
 * @param {import("express").Request} req - Express request
 * @param {import("express").Response} res - Express response
 * @param {import("express").NextFunction} next - Express next function
 */
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['authorization'];

    if (!apiKey) {
        return res.status(401).json({ error: "No API key provided" });
    }

    if (apiKey !== `Bearer ${process.env.API_KEY}`) {
        return res.status(403).json({ error: "Invalid API key" });
    }

    next();
}

module.exports = apiKeyMiddleware;
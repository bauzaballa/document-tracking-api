/**
 * Logger Middleware
 *
 * @param {import("express").Request} req - Express request
 * @param {import("express").Response} res - Express response
 * @param {import("express").NextFunction} next - Express next function
 */
const logger = (req, res, next) => {
    if (process.env.NODE_ENV === "development") {
        const start = Date.now();

        res.on("finish", () => {
            const duration = Date.now() - start;
            const statusColor = getStatusColor(res.statusCode);
            console.log(
                `${req.method} ${req.originalUrl} ${statusColor(res.statusCode)} - ${duration}ms`
            );
        });
    }

    next();
}

/**
 * Add colors according HTTP status
 *
 * @param {number} status
 */
const getStatusColor = (status) => {
    if (status >= 500) return (text) => `\x1b[31m${text}\x1b[0m`; // Red
    if (status >= 400) return (text) => `\x1b[33m${text}\x1b[0m`; // Yellow
    if (status >= 300) return (text) => `\x1b[36m${text}\x1b[0m`; // Cyan
    return (text) => `\x1b[32m${text}\x1b[0m`; // Green
}

module.exports = logger;
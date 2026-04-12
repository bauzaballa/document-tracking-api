const { serverInfoService } = require("../services/health.service");

class HealthController {
    async getServerInfo(_, res) {
        try {
            const serverInfo = await serverInfoService.getServerInfo();
            res.status(200).json(serverInfo);
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: "Could not retrieve server information",
                timestamp: new Date().toISOString()
            });
        }
    }
}

const healthController = new HealthController();
module.exports = { HealthController, healthController };

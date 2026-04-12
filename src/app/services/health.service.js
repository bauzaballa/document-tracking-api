const fs = require("fs").promises;
const path = require("path");
const os = require("os");

class ServerInfoService {
    constructor() {
        this.packageJsonPath = path.join(process.cwd(), "package.json");
    }

    async readPackageJson() {
        try {
            const packageJsonContent = await fs.readFile(this.packageJsonPath, "utf-8");
            return JSON.parse(packageJsonContent);
        } catch (error) {
            logger.error("Error reading package.json:", error);
            throw new Error("Could not read package.json");
        }
    }

    formatBytes(bytes) {
        const units = ["B", "KB", "MB", "GB", "TB"];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    getMemoryUsage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        return {
            total: this.formatBytes(totalMemory),
            free: this.formatBytes(freeMemory),
            used: this.formatBytes(usedMemory),
            usage_percentage: `${((usedMemory / totalMemory) * 100).toFixed(2)}%`
        };
    }

    getCPUInfo() {
        return {
            cores: os.cpus().length,
            load_average: os.loadavg().map(avg => Number(avg.toFixed(2)))
        };
    }

    async getServerInfo() {
        try {
            const packageJson = await this.readPackageJson();
            const memoryUsage = this.getMemoryUsage();
            const cpuInfo = this.getCPUInfo();

            return {
                status: "OK",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                server: {
                    node_version: process.version,
                    platform: process.platform,
                    arch: process.arch,
                    memory: memoryUsage,
                    cpu: cpuInfo
                },
                application: {
                    name: packageJson.name,
                    version: packageJson.version,
                    environment: process.env.NODE_ENV || "development"
                },
                system: {
                    hostname: os.hostname(),
                    user: os.userInfo().username,
                    uptime: os.uptime()
                }
            };
        } catch (error) {
            throw error;
        }
    }
}

const serverInfoService = new ServerInfoService();
module.exports = { ServerInfoService, serverInfoService };

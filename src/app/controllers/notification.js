const { Notifications } = require("@/database/db");
const { Op } = require("sequelize");

class Notification {
    constructor() {}

    /**
     * Create new notification
     *
     * @param {Object} data - Data to create notification
     */
    create = async data => {
        try {
            const newNotificationData = {
                userId: data.userId,
                departmentId: data.departmentId,
                userIdReceive: data.userIdReceive,
                content: data.content,
                type: data.type,
                urlRedirect: data.urlRedirect,
                isForAdmin: data.isForAdmin,
                metadata: (typeof data.metadata === "object" ? JSON.stringify(data.metadata) : data.metadata) || null
            };
            const result = await Notifications.create(newNotificationData);

            return result;
        } catch (error) {
            console.error("❌ Error interno al crear notificación:", error);
            throw new Error("Error creating the notification", error.message);
        }
    };

    /**
     * Update notification
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    update = async (req, res) => {
        try {
            const data = req.body;

            const whereClause = {
                id: data.notificationId
            };

            const updateData = {
                wasReceived: true
            };

            if (data.metadata) {
                updateData.metadata = typeof data.metadata === "object" ? JSON.stringify(data.metadata) : data.metadata;
            }

            const result = await Notifications.update(updateData, {
                where: whereClause
            });

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Update all notifications
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    updateAll = async (req, res) => {
        try {
            const data = req.body;

            const whereClause = {};

            if (data.userId && data.departmentId) {
                whereClause[Op.or] = [{ userIdReceive: data.userId }, { departmentId: data.departmentId }];
            } else if (data.userId) {
                whereClause.userIdReceive = data.userId;
            } else if (data.departmentId) {
                whereClause.departmentId = data.departmentId;
            } else {
                whereClause.isForAdmin = true;
            }

            const result = await Notifications.update({ wasReceived: true }, { where: whereClause });

            res.status(200).send(result);
        } catch (error) {
            console.error("❌ Error al marcar como leídas:", error);
            res.status(500).send(error);
        }
    };

    /**
     * Delete notification
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    delete = async (req, res) => {
        try {
            const data = req.query;

            const whereClause = {
                id: data.notificationId
            };

            await Notifications.destroy({
                where: whereClause
            });

            res.sendStatus(200);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Get notifications
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getNotifications = async (req, res) => {
        try {
            const { userId, departmentId, role } = req.query;

            let whereClause = {};

            if (role === "admin") {
                whereClause = { userIdReceive: userId };
            } else if (role === "director" || role === "coordinador") {
                whereClause = {
                    [Op.or]: [{ userIdReceive: userId }, { departmentId: departmentId }]
                };
            } else if (role === "colaborador") {
                whereClause = { userIdReceive: userId };
            } else {
                // fallback si el rol no es reconocido
                whereClause = { userIdReceive: userId };
            }

            const result = await Notifications.findAll({
                where: whereClause,
                order: [["createdAt", "DESC"]]
            });

            res.status(200).send(result);
        } catch (error) {
            console.error("❌ Error al obtener notificaciones:", error);
            res.status(500).send(error);
        }
    };
}

module.exports = Notification;

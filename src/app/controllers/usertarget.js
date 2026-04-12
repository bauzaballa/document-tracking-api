const { UserTargets } = require("@/database/db");

class UserTarget {
    constructor() { };

    /**
     * Create new target for an user
     * 
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    create = async (req, res) => {
        try {
            const data = req.body;

            const newTargetData = {
                userId: data.userId,
                description: data.description,
                startDate: data.startDate,
                dueDate: data.dueDate
            }

            const result = await UserTargets.create(newTargetData);

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    /**
     * Update target status
     * 
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    update = async (req, res) => {
        try {
            const data = req.body;

            const updateData = {};
            if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;
            if (data.description) updateData.description = data.description;
            if (data.startDate) updateData.startDate = data.startDate;  // ✅ Ahora sí lo actualiza
            if (data.dueDate) updateData.dueDate = data.dueDate;

            const result = await UserTargets.update(updateData, {
                where: {
                    id: data.targetId
                }
            });

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    /**
     * Get user's targets
     * 
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getTargets = async (req, res) => {
        try {
            const data = req.query;

            const result = await UserTargets.findAll({
                where: {
                    userId: data.userId,
                    isCompleted: false
                },
                order: [
                    ["createdAt", "DESC"]
                ]
            });

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    /**
     * Get user's targets completed
     * 
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getTargetsCompleted = async (req, res) => {
        try {
            const data = req.query;

            const result = await UserTargets.findAll({
                where: {
                    userId: data.userId,
                    isCompleted: true
                },
                order: [
                    ["updatedAt", "DESC"]
                ],
                limit: 20
            });

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    }
}

module.exports = UserTarget;
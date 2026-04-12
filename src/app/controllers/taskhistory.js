const { TaskHistories } = require("@/database/db");
const apiAuth = require("../utils/apiAuth");

class TaskHistory {
    constructor() {}

    /**
     * Create new task's history
     *
     * @param {Object} data - Data to create task's history
     */
    create = async data => {
        try {            
            const newHistoryData = {
                taskId: data.taskId,
                userId: data.userId,
                content: data.content
            };

            const result = await TaskHistories.create(newHistoryData);

            return result;
        } catch (error) {
            console.log(error);

            throw new Error("Error creating the history", error.message);
        }
    };

    /**
     * Add a new comment to task
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    addComment = async (req, res) => {
        try {
            const data = req.body;

            const newHistoryData = {
                taskId: data.taskId,
                userId: data.userId,
                content: data.content
            };

            const result = await TaskHistories.create(newHistoryData);

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Delete task's history
     *
     * @param {number} taskId - Task's id
     */
    delete = async taskId => {
        try {
            await TaskHistories.destroy({
                where: {
                    taskId: taskId
                }
            });

            return;
        } catch (error) {
            throw new Error("Error deleting the history", error.message);
        }
    };

    /**
     * Get task's history
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getHistory = async (req, res) => {
        try {
            const data = req.query;

            const result = await TaskHistories.findAll({
                where: {
                    taskId: data.taskId
                },
                order: [["createdAt", "DESC"]]
            });

            const resultWithUsers = await Promise.all(
                result.map(async history => {
                    const user = await apiAuth.get("/user/get-user", {
                        params: {
                            userId: history.userId
                        }
                    });

                    return {
                        ...history.toJSON(),
                        userDid: {
                            firstName: user.data.firstName,
                            lastName: user.data.lastName,
                            role: user.data.role,
                            avatarUrl: user.data.avatarUrl
                        }
                    };
                })
            );

            res.status(200).send(resultWithUsers);
        } catch (error) {
            res.status(500).send(error);
        }
    };
}

module.exports = TaskHistory;

const { TaskChecklists } = require("@/database/db");

class TaskChecklist {
    constructor() { };

    /**
     * Create new task's checklist
     * 
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    create = async (req, res) => {
        try {
            const data = req.body;

            const newChecklistData = {
                title: data.title,
                taskId: data.taskId,
                checks: {}
            }

            const result = await TaskChecklists.create(newChecklistData);

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    /**
     * Create checklist's check
     * 
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    createCheck = async (req, res) => {
        try {
            const data = req.body;

            const checklist = await TaskChecklists.findOne({
                where: {
                    id: data.checklistId
                },
                attributes: ['checks']
            });

            let checks = checklist.checks;
            if (!Array.isArray(checks)) {
                try {
                    checks = JSON.parse(checks);
                } catch (error) {
                    checks = [];
                }
            }

            const lastId = checks.length > 0 ? Math.max(...checks.map(check => check.id || 0)) : 0;
            const newId = lastId + 1;

            const newCheck = {
                id: newId,
                title: data.title,
                wasChecked: false
            }

            checks.push(newCheck);

            const result = await TaskChecklists.update(
                {
                    checks: JSON.stringify(checks)
                },
                {
                    where: {
                        id: data.checklistId
                    }
                }
            );

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    /**
     * Update checklist's check
     * 
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    updateCheck = async (req, res) => {
        try {
            const data = req.body;

            const checklist = await TaskChecklists.findOne({
                where: {
                    id: data.checklistId
                },
                attributes: ['checks']
            });

            const checks = JSON.parse(checklist.checks);

            const updatedChecks = checks.map(check => {
                if (check.id === data.checkId) {
                    return {
                        ...check,
                        wasChecked: !check.wasChecked
                    };
                }
                return check;
            });

            const result = await TaskChecklists.update(
                {
                    checks: JSON.stringify(updatedChecks)
                },
                {
                    where: {
                        id: data.checklistId
                    }
                }
            );

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    /**
     * Delete a task's checklist
     * 
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    delete = async (req, res) => {
        try {
            const data = req.query;

            await TaskChecklists.destroy({
                where: {
                    id: data.checklistId
                }
            });

            res.sendStatus(200);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    /**
     * Delete all task's checklists
     * 
     * @param {number} taskId - Task's id
     */
    deleteAll = async (taskId) => {
        try {
            await TaskChecklists.destroy({
                where: {
                    taskId: taskId
                }
            });

            return;
        } catch (error) {
            throw new Error(
                'Error deleting the checklists',
                error.message,
            );
        }
    }

    /**
     * Get task's checklists
     * 
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getChecklists = async (req, res) => {
        try {
            const data = req.query;

            const result = await TaskChecklists.findAll({
                where: {
                    taskId: data.taskId
                },
                order: [
                    ["id", "ASC"]
                ]
            });

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    }
}

module.exports = TaskChecklist;
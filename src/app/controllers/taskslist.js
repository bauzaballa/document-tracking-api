const { TasksLists, Tasks, TaskFiles } = require("@/database/db");
const { Op } = require("sequelize");
const moment = require("moment");

class TasksList {
    constructor() {}

    /**
     * Create new tasks list
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    create = async (req, res) => {
        try {
            const data = req.body;

            const newTasksListData = {
                name: data.name,
                departmentId: data.departmentId
            };

            const result = await TasksLists.create(newTasksListData);

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Update list's name
     * 
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    updateName = async (req, res) => {
        try {
            const data = req.body;

            const result = await TasksLists.update(
                {
                    name: data.name
                },
                {
                    where: {
                        id: data.taskListId
                    }
                }
            );

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    }

     /**
     * Update list's color
     * 
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    updateColor = async (req, res) => {
        try {
            const data = req.body;

            const result = await TasksLists.update(
                {
                    colorHex: data.colorHex
                },
                {
                    where: {
                        id: data.taskListId
                    }
                }
            );

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    /**
     * Get tasks lists by department
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getTasksLists = async (req, res) => {
        try {
            const data = req.query;

            const result = await TasksLists.findAll({
                where: {
                    departmentId: data.departmentId
                },
                include: [
                    {
                        model: Tasks,
                        as: "tasks",
                        include: [
                            {
                                model: TaskFiles,
                                as: "files"
                            }
                        ]
                    }
                ],
                order: [["id", "ASC"]]
            });

            const userId = data.userId;

            const filtered = result.map(list => {
                const tasks = list.tasks.filter(task => {
                    const users = JSON.parse(task.userIds || "[]");

                    const matchesPriority = !data.taskPriority || task.priority === data.taskPriority;
                    const matchesDate =
                        (!data.fromDate || new Date(task.createdAt) >= new Date(data.fromDate)) &&
                        (!data.toDate || new Date(task.createdAt) <= new Date(data.toDate));
                    const matchesUser = users.includes(userId);

                    return matchesPriority && matchesDate && matchesUser;
                });
                return {
                    ...list.toJSON(),
                    tasks
                };
            });

            res.status(200).send(filtered);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Get tasks that have ended date
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getTasksCalendar = async (req, res) => {
        try {
            const { userId, month, year } = req.query;

            const formatMonth = month.toString().padStart(2, "0");
            const startDate = moment(`${year}-${formatMonth}-01`).startOf("month").format("YYYY-MM-DD");
            const endDate = moment(`${year}-${formatMonth}-01`).endOf("month").format("YYYY-MM-DD");

            const result = await Tasks.findAll({
                attributes: [
                    "id",
                    "title",
                    "createdAt",
                    "userIds",
                    "status",
                    "priority",
                    "dueDate",
                    "description",
                    "userIds",
                    "departmentId"
                ],
                where: {
                    dueDate: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });

            const filtered = result.filter(task => {
                const users = JSON.parse(task.userIds || "[]");
                return users.includes(userId);
            });

            res.status(200).send(filtered);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Delete tasks list if it's empty
     *
     * @param {import("express").Request} req - Express request
     * @param {import("express").Response} res - Express response
     */
    delete = async (req, res) => {
        try {
            const { id } = req.params;

            const list = await TasksLists.findByPk(id);

            if (!list) {
                return res.status(404).send({ message: "Lista no encontrada" });
            }

            // Desvinculamos todas las tareas de esta lista (activas o no)
            await Tasks.update(
                { listId: 0 },
                { where: { listId: id } }
            );

            // Eliminamos la lista
            await TasksLists.destroy({ where: { id } });

            res.status(200).send({ message: "Lista eliminada correctamente" });

        } catch (error) {
            console.error("Error al eliminar la lista:", error);
            res.status(500).send(error);
        }
    };

    /**
     * Get tasks of selected list
     *
     * @param {import("express").Request} req - Express request
     * @param {import("express").Response} res - Express response
     */
    getHasTasks = async (req, res) => {
        try {
            const { id } = req.params;

            const tasks = await Tasks.findAll({
                where: { listId: id, isDraft: false }
            });

            res.status(200).send({ hasTasks: tasks.length > 0 });
        } catch (error) {
            res.status(500).send(error);
        }
    };
}

module.exports = TasksList;

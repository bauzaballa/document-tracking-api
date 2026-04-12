const { Tasks, TaskFiles } = require("@/database/db");
const { Op } = require("sequelize");
const apiAuth = require("../utils/apiAuth");
const microserviceSocket = require("../services/sockets.services");

const TaskHistory = require("./taskhistory");
const TaskChecklist = require("./taskchecklist");
const TaskFile = require("./taskfile");
const TaskTemplateController = require("./taskTemplate");
const Notification = require("./notification");

class Task {
    #taskHistory;
    #taskChecklist;
    #taskFile;
    #notification;
    #taskTemplate;

    constructor() {
        this.#taskHistory = new TaskHistory();
        this.#taskChecklist = new TaskChecklist();
        this.#taskFile = new TaskFile();
        this.#notification = new Notification();
        this.#taskTemplate = new TaskTemplateController();
    }

    /**
     * Create new task
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    create = async (req, res) => {
        try {
            const data = req.body;
            let litstId = null;
            if (data.listId === 0 || data.listId === "0") {
                litstId = null;
            } else {
                litstId = data.listId;
            }
            const newTasksData = {
                listId: data.listId !== 0 ? data.listId : null,
                departmentId: data.departmentId,
                userIds: JSON.stringify(data.userIds),
                priority: data.priority,
                status: data.status,
                subareaId: data.subareaId,
                unitId: data.unitId
            };

            const result = await Tasks.create(newTasksData);

            await this.#taskHistory.create({
                taskId: result.id,
                userId: data.userIdCreated,
                content: `${data.firstName} ha creado la tarea`
            });

            const colaborators = await apiAuth.get("/department/get-users", {
                params: { departmentId: data.departmentId }
            });

            const userIds = Array.isArray(data.userIds) ? data.userIds : JSON.parse(data.userIds || "[]");

            const mainColaborator = Array.isArray(colaborators?.data?.users)
                ? colaborators.data.users.filter(user => userIds.includes(user.id))
                : [];

            // Enviar notificaciones a los usuarios asignados
            for (const user of mainColaborator) {
                if (user.id !== data.userIdCreated) {
                    microserviceSocket.emit("receiveNotification", {
                        userId: data.userIdCreated,
                        departmentId: null,
                        userIdReceive: user.id,
                        content: `<strong>${data.firstName}</strong> te asignó una tarea`,
                        type: "redirect",
                        urlRedirect: `/panel/tareas/area/${data.departmentId}/empleado/${user.id}?unitId=${
                            data.unitId ?? "null"
                        }${data.subareaId ? `&subareaId=${data.subareaId}` : ""}&taskId=${result.id}`,
                        isForAdmin: false
                    });
                }
            }
            microserviceSocket.emit("updateTable", {});
            res.status(200).send(result);
        } catch (error) {
            console.error("❌ Error en create:", error.message, error.stack);
            res.status(500).send({ error: error.message });
        }
    };

    /**
     * Update task
     *
     * @returns {(req: import("express").Request, res: import("express").Response) => Promise<void>}
     */
    update = async (req, res) => {
        try {
            const data = req.body;

            const task = await Tasks.findByPk(data.taskId);

            if (!task) {
                return res.status(404).send({ error: "Tarea no encontrada" });
            }

            // Función para convertir cualquier entrada en array de strings
            const normalizeToArray = val => {
                if (!val) return [];
                if (typeof val === "string") {
                    // si viene "uuid1,uuid2"
                    return val.includes(",") ? val.split(",") : [val];
                }
                if (Array.isArray(val)) return val;
                return [];
            };

            const normalizeIds = arr =>
                normalizeToArray(arr)
                    .map(id => String(id).trim())
                    .sort();

            // Obtener y normalizar los userIds previos
            const rawUserIds = task.userIds;
            let prevUserIds = [];
            if (typeof rawUserIds === "string" && rawUserIds.trim() !== "") {
                try {
                    const parsed = JSON.parse(rawUserIds);
                    prevUserIds = normalizeToArray(parsed);
                } catch {
                    prevUserIds = [];
                }
            }

            // Normalizar los nuevos userIds
            const newUserIds = normalizeToArray(data.userIds).map(id => String(id).trim());

            // Comparación robusta
            const userIdsChanged = JSON.stringify(normalizeIds(prevUserIds)) !== JSON.stringify(newUserIds);

            // Actualización de la tarea

            let litstId = null;
            if (data.listId === 0 || data.listId === "0") {
                litstId = null;
            } else {
                litstId = data.listId;
            }
            const updateTasksData = {
                title: data.title,
                listId: litstId,
                userIds: JSON.stringify(newUserIds),
                priority: data.priority,
                status: data.status,
                description: data.description,
                startDate: data.startDate || null,
                dueDate: data.dueDate || null,
                isDraft: false,
                subareaId: data.subareaId ? Number(data.subareaId) : null,
                unitId: data.unitId ? Number(data.unitId) : null
            };

            await Tasks.update(updateTasksData, {
                where: { id: data.taskId }
            });

            const colaborators = await apiAuth.get("/department/get-users", {
                params: {
                    departmentId: data.departmentId
                }
            });
            const users = colaborators?.data?.users || [];
            const mainColaborator = users.filter(user => newUserIds.includes(user.id));

            // Cambios de estado
            if (task.status !== data.status) {
                await this.#taskHistory.create({
                    taskId: data.taskId,
                    userId: data.userIdUpdated,
                    content: `${data.firstName} cambió el estado de la tarea de ${task.status.replace(
                        "-",
                        " "
                    )} a ${data.status.replace("-", " ")}`
                });

                if (data.status === "completada" && data.userRole !== "director") {
                    await this.#notification.create({
                        userId: data.userIdUpdated,
                        departmentId: data.departmentId,
                        userIdReceive: null,
                        content: `La tarea <strong>#${data.taskId}</strong> fue completada por <strong>${data.firstName}</strong>`,
                        type: "redirect",
                        urlRedirect: `/panel/tareas/area/${data.departmentId}/empleado/${
                            mainColaborator[0].id
                        }?unitId=${data.unitId ?? "null"}${
                            data.subareaId ? `&subareaId=${data.subareaId}` : ""
                        }&taskId=${data.taskId}`,
                        isForAdmin: false
                    });
                }
            }

            // Cambios de prioridad
            if (task.priority !== data.priority) {
                await this.#taskHistory.create({
                    taskId: data.taskId,
                    userId: data.userIdUpdated,
                    content: `${data.firstName} cambió la prioridad de la tarea de ${task.priority} a ${data.priority}`
                });
            }

            // Cambios en fecha de vencimiento
            if (task.dueDate) {
                if (data.dueDate) {
                    if (task.dueDate !== data.dueDate) {
                        await this.#taskHistory.create({
                            taskId: data.taskId,
                            userId: data.userIdUpdated,
                            content: `${data.firstName} cambió la fecha de vencimiento de la tarea`
                        });
                    }
                } else {
                    await this.#taskHistory.create({
                        taskId: data.taskId,
                        userId: data.userIdUpdated,
                        content: `${data.firstName} eliminó la fecha de vencimiento de la tarea`
                    });
                }
            }

            if (data.templateId) {
                updateTasksData.taskTemplateId = data.templateId;

                await this.#taskTemplate.createTask(data);
            }

            // Comentario
            if (data.comment) {
                await this.#taskHistory.create({
                    taskId: data.taskId,
                    userId: data.userIdUpdated,
                    content: data.comment
                });
            }

            // Notificaciones por cambio de usuarios asignados
            if (userIdsChanged) {
                if (data.userRole === "coordinador") {
                    microserviceSocket.emit("receiveNotification", {
                        userId: data.userIdUpdated,
                        departmentId: data.departmentId,
                        userIdReceive: null,
                        content: `El coordinador <strong>${
                            data.firstName
                        }</strong> asignó una tarea a <strong>${mainColaborator
                            ?.map(c => c.firstName)
                            .join(", ")}</strong>`,
                        type: "redirect",
                        urlRedirect: `/panel/tareas/area/${data.departmentId}/empleado/${
                            mainColaborator[0].id
                        }?unitId=${data.unitId ?? "null"}${
                            data.subareaId ? `&subareaId=${data.subareaId}` : ""
                        }&taskId=${data.taskId}`,
                        isForAdmin: false
                    });
                }

                const prevIdsSet = new Set(normalizeIds(prevUserIds));
                const newAssignedUsers = mainColaborator.filter(user => !prevIdsSet.has(user.id));

                for (const user of newAssignedUsers) {
                    if (user.id !== data.userIdUpdated) {
                        microserviceSocket.emit("receiveNotification", {
                            userId: data.userIdUpdated,
                            departmentId: null,
                            userIdReceive: user.id,
                            content: `<strong>${data.firstName}</strong> te asignó a una tarea`,
                            type: "redirect",
                            urlRedirect: `/panel/tareas/area/${data.departmentId}/empleado/${
                                mainColaborator[0].id
                            }?unitId=${data.unitId ?? "null"}${
                                data.subareaId ? `&subareaId=${data.subareaId}` : ""
                            }&taskId=${data.taskId}`,
                            isForAdmin: false
                        });
                    }
                }
            }
            microserviceSocket.emit("updateTable", {});

            res.status(200).send({ success: true });
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    };

    /**
     * Delete a task
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    delete = async (req, res) => {
        try {
            const data = req.query;
            const taskId = Number(data.taskId);
            await Tasks.destroy({
                where: {
                    id: data.taskId
                }
            });

            try {
                await this.#taskHistory.delete(taskId);
            } catch (err) {
                console.warn(`⚠️ No se pudo borrar historial de tarea ${taskId}`, err.message);
            }

            try {
                await this.#taskChecklist.deleteAll(taskId);
            } catch (err) {
                console.warn(`⚠️ No se pudo borrar checklist de tarea ${taskId}`, err.message);
            }

            try {
                await this.#taskFile.deleteAll(taskId);
            } catch (err) {
                console.warn(`⚠️ No se pudieron borrar archivos de tarea ${taskId}`, err.message);
            }

            res.sendStatus(200);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Get tasks without linked on a lists by department
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getTasksWithoutLists = async (req, res) => {
        try {
            const data = req.query;

            const whereClause = {
                departmentId: data.departmentId,
                listId: null
            };

            if (data.taskPriority) {
                whereClause.priority = data.taskPriority;
            }

            if (data.fromDate && data.toDate) {
                whereClause.createdAt = {};
                if (data.fromDate) whereClause.createdAt[Op.gte] = new Date(data.fromDate);
                if (data.toDate) whereClause.createdAt[Op.lte] = new Date(data.toDate);
            }

            const result = await Tasks.findAll({
                where: whereClause,
                include: [
                    {
                        model: TaskFiles,
                        as: "files"
                    }
                ],
                order: [["id", "ASC"]]
            });

            const userId = data.userId;

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
     * Update task by colaborator
     *
     * @returns {(req: import("express").Request, res: import("express").Response) => Promise<void>}
     */
    updateState = async (req, res) => {
        try {
            const { taskId, status, userId, firstName, departmentId } = req.body;

            const task = await Tasks.findByPk(taskId);

            if (!task) {
                return res.status(404).send({ error: "Tarea no encontrada" });
            }

            await this.#taskHistory.create({
                taskId,
                userId,
                content: `${firstName} cambió el estado de la tarea de ${task.status.replace(
                    "-",
                    " "
                )} a ${status.replace("-", " ")}`
            });

            if (status === "completada") {
                microserviceSocket.emit("receiveNotification", {
                    userId: userId,
                    departmentId: departmentId,
                    userIdReceive: null,
                    content: `La tarea <strong>#${taskId}</strong> fue completada por <strong>${firstName}</strong>`,
                    type: "redirect",
                    urlRedirect: `/panel/tareas/area/${departmentId}/empleado/${userId}?taskId=${taskId}`,
                    isForAdmin: false
                });
            }

            task.status = status;
            await task.save();
            microserviceSocket.emit("updateTable", {});

            res.status(200).send({ success: true });
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Get task by ID
     *
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     */
    getById = async (req, res) => {
        try {
            const { taskId } = req.query;

            const task = await Tasks.findByPk(taskId, {
                include: [
                    {
                        model: TaskFiles,
                        as: "files"
                    }
                ]
            });

            if (!task) {
                return res.status(404).send({ error: "Tarea no encontrada" });
            }

            res.status(200).send(task);
        } catch (error) {
            console.error("❌ Error al obtener tarea por ID:", error);
            res.status(500).send(error);
        }
    };
}

module.exports = Task;

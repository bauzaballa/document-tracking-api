const {
    Tasks,
    TaskFiles,
    TaskTemplate,
    ChatMessages,
    Chats,
    CalendarEvents,
    Requests,
    UserTargets
} = require("@/database/db");
const { Op } = require("sequelize");
const moment = require("moment");
require("moment/locale/es");
const apiAuth = require("../utils/apiAuth");
const parseUserIds = require("../helpers/parseUserIds");

class Statistics {
    constructor() {
        moment.locale("es");
    }

    /**
     * Get performance statistics by department or user
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getPerformanceStatistics = async (req, res) => {
        try {
            const { departmentId, userId, period, fromDate, toDate } = req.query;

            const whereClause = {
                departmentId
            };

            // Lógica de fechas
            if (fromDate || toDate) {
                whereClause.createdAt = {};
                if (fromDate) whereClause.createdAt[Op.gte] = new Date(fromDate);
                if (toDate) whereClause.createdAt[Op.lte] = new Date(toDate);
            } else if (period) {
                const today = moment();
                let startDate;

                switch (period.toLowerCase()) {
                    case "diario":
                        startDate = today.clone().startOf("day");
                        break;
                    case "semanal":
                        startDate = today.clone().startOf("week");
                        break;
                    case "mensual":
                        startDate = today.clone().startOf("month");
                        break;
                    case "anual":
                        startDate = today.clone().startOf("year");
                        break;
                }

                if (startDate) {
                    whereClause[Op.and] = [
                        {
                            [Op.or]: [{ dueDate: null }, { dueDate: { [Op.gte]: startDate.format("YYYY-MM-DD") } }]
                        }
                    ];
                }
            }

            let result = await Tasks.findAll({
                where: whereClause,
                include: [
                    {
                        model: TaskFiles,
                        as: "files"
                    },
                    { model: TaskTemplate, as: "taskTemplate" }
                ],
                order: [["id", "DESC"]]
            });

            if (userId) {
                result = result.filter(task => {
                    const users = JSON.parse(task.userIds || "[]");
                    return users.includes(userId);
                });
            }

            const statistics = {
                tasks: result,
                tasksPending: result.filter(task => task.status === "pendiente").length,
                tasksProcess: result.filter(task => task.status === "en-proceso").length,
                tasksCompleted: result.filter(task => task.status === "completada").length,
                tasksExpired: result.filter(task => task.status === "vencida").length
            };

            res.status(200).send(statistics);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Get preview department tasks
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getPreviewDepartmentTasks = async (req, res) => {
        try {
            const { departmentId, userId, period, fromDate, toDate } = req.query;

            const whereClause = {
                departmentId,
                status: ["pendiente", "completada"]
            };

            // Lógica de fechas
            if (fromDate || toDate) {
                whereClause.createdAt = {};
                if (fromDate) whereClause.createdAt[Op.gte] = new Date(fromDate);
                if (toDate) whereClause.createdAt[Op.lte] = new Date(toDate);
            } else if (period) {
                const today = moment();
                let startDate;

                switch (period.toLowerCase()) {
                    case "diario":
                        startDate = today.clone().startOf("day");
                        break;
                    case "semanal":
                        startDate = today.clone().startOf("week");
                        break;
                    case "mensual":
                        startDate = today.clone().startOf("month");
                        break;
                    case "anual":
                        startDate = today.clone().startOf("year");
                        break;
                }

                if (startDate) {
                    whereClause[Op.and] = [
                        {
                            [Op.or]: [{ dueDate: null }, { dueDate: { [Op.gte]: startDate.format("YYYY-MM-DD") } }]
                        }
                    ];
                }
            }

            const result = await Tasks.findAll({
                where: whereClause,
                include: [
                    {
                        model: TaskFiles,
                        as: "files"
                    }
                ],
                order: [["id", "DESC"]]
            });

            const tasks = await Tasks.findAll({
                where: {
                    departmentId: departmentId
                }
            });

            let tasksFiltered = result;
            let totalTasks = tasks;

            if (userId) {
                tasksFiltered = result.filter(task => {
                    const users = JSON.parse(task.userIds || "[]");
                    return users.includes(userId);
                });

                totalTasks = tasks.filter(task => {
                    const users = JSON.parse(task.userIds || "[]");
                    return users.includes(userId);
                });
            }

            const statistics = {
                tasks: tasksFiltered,
                taskLength: totalTasks.length,
                tasksPending: tasksFiltered.filter(task => task.status === "pendiente").length,
                tasksCompleted: tasksFiltered.filter(task => task.status === "completada").length
            };

            res.status(200).send(statistics);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Get statistics for admins
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getAdminStatistics = async (req, res) => {
        try {
            const data = req.query;

            const [usersRes, departmentsRes] = await Promise.all([
                apiAuth.get("/user/get-all-users", {
                    params: {
                        role: ["director", "coordinador", "colaborador"]
                    }
                }),
                apiAuth.get("/department/get-all")
            ]);

            const taskWhereClause = {};
            if (data.fromDate || data.toDate) {
                taskWhereClause.createdAt = {};
                if (data.fromDate) taskWhereClause.createdAt[Op.gte] = new Date(data.fromDate);
                if (data.toDate) taskWhereClause.createdAt[Op.lte] = new Date(data.toDate);
            }
            const tasks = await Tasks.findAll({
                where: taskWhereClause
            });

            const calendarEvents = await CalendarEvents.findAll({
                where: {
                    userId: data.userId
                },
                limit: 3,
                order: [["date", "DESC"]]
            });

            const users = usersRes.data.rows;
            const departments = departmentsRes.data;

            const userStatsMap = {};
            const deptStatsMap = {};

            for (const task of tasks) {
                const taskUsers = parseUserIds(task.userIds);

                const isCompleted = task.status === "completada";

                for (const userId of taskUsers) {
                    const user = users.find(u => u.id === userId);

                    if (!user) continue;

                    if (!userStatsMap[userId]) {
                        userStatsMap[userId] = {
                            id: user.id,
                            name: `${user.firstName} ${user.lastName}`,
                            department: user.departments?.[0]?.name || null,
                            total: 0,
                            completed: 0
                        };
                    }

                    userStatsMap[userId].total += 1;
                    if (isCompleted) userStatsMap[userId].completed += 1;
                }

                if (task.departmentId) {
                    if (!deptStatsMap[task.departmentId]) {
                        const dept = departments.find(d => d.id === task.departmentId);
                        if (dept) {
                            deptStatsMap[task.departmentId] = {
                                id: dept.id,
                                name: dept.name,
                                total: 0,
                                completed: 0
                            };
                        }
                    }

                    deptStatsMap[task.departmentId].total += 1;
                    if (isCompleted) deptStatsMap[task.departmentId].completed += 1;
                }
            }

            // Top 10 usuarios
            const topUsers = Object.values(userStatsMap)
                .map(user => ({
                    ...user,
                    completionRate: user.total > 0 ? (user.completed / user.total) * 100 : 0
                }))
                .sort((a, b) => b.completionRate - a.completionRate)
                .slice(0, 10);

            // Top 3 departamentos
            const topDepartments = Object.values(deptStatsMap)
                .map(dept => ({
                    ...dept,
                    completionRate: dept.total > 0 ? (dept.completed / dept.total) * 100 : 0
                }))
                .sort((a, b) => b.completionRate - a.completionRate)
                .slice(0, 3);

            // Últimos 3 mensajes entre admin y director
            const directorIds = users.filter(u => u.role === "director").map(u => u.id);

            const lastMessages = await ChatMessages.findAll({
                where: {
                    userId: { [Op.not]: data.userId }
                },
                include: [
                    {
                        model: Chats,
                        as: "chatMessages",
                        required: true,
                        where: {
                            [Op.or]: [
                                {
                                    user1Id: data.userId,
                                    user2Id: { [Op.in]: directorIds }
                                },
                                {
                                    user2Id: data.userId,
                                    user1Id: { [Op.in]: directorIds }
                                }
                            ]
                        }
                    }
                ],
                order: [["createdAt", "DESC"]],
                limit: 3
            });

            const filteredMappedMessages = lastMessages.map(msg => {
                const chat = msg.chatMessages;
                const u1 = users.find(u => u.id === chat.user1Id);
                const u2 = users.find(u => u.id === chat.user2Id);

                const director = [u1, u2].find(u => u?.role === "director");

                return {
                    id: msg.id,
                    preview: msg.message?.slice(0, 40) + "...",
                    createdAt: msg.createdAt,
                    chatId: chat.id,
                    directorName: director ? `${director.firstName} ${director.lastName}` : "Director"
                };
            });

            const statistics = {
                totalDirectores: users.filter(user => user.role === "director").length,
                totalColaboradores: users.filter(user => user.role !== "director").length,
                topUsers,
                topDepartments,
                latestMessages: filteredMappedMessages,
                calendarEvents
            };

            res.status(200).send(statistics);
        } catch (error) {
            console.error(error);
            res.status(500).send(error);
        }
    };

    /**
     * Get statistics performance for admins
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getStatisticsAdminPerformance = async (req, res) => {
        try {
            const data = req.query;

            const [usersRes, departmentsRes] = await Promise.all([
                apiAuth.get("/user/get-all-users", {
                    params: {
                        role: ["director", "coordinador", "colaborador"]
                    }
                }),
                apiAuth.get("/department/get-all")
            ]);

            const users = usersRes.data.rows;
            const departments = departmentsRes.data;

            const taskWhereClause = {};
            if (data.fromDate || data.toDate) {
                taskWhereClause.createdAt = {};
                if (data.fromDate) taskWhereClause.createdAt[Op.gte] = new Date(data.fromDate);
                if (data.toDate) taskWhereClause.createdAt[Op.lte] = new Date(data.toDate);
            }

            const [tasks, requests] = await Promise.all([
                Tasks.findAll({ where: taskWhereClause }),
                Requests.findAll()
            ]);

            // Mapa de performance por departamento
            const deptPerformanceMap = {};

            for (const task of tasks) {
                const deptId = task.departmentId;
                if (!deptId) continue;

                if (!deptPerformanceMap[deptId]) {
                    const dept = departments.find(d => d.id === deptId);
                    const deptUsers = users.filter(u => u.departments?.some(d => d.id === deptId));

                    const director = dept?.director || deptUsers.find(u => u.role === "director");

                    const colaboradoresActivos = deptUsers.filter(
                        u => u.role === "colaborador" && u.status === "activo"
                    ).length;

                    deptPerformanceMap[deptId] = {
                        id: dept?.id,
                        name: dept?.name || "Desconocido",
                        total: 0,
                        completed: 0,
                        director: director
                            ? {
                                  id: director.id,
                                  name: `${director.firstName} ${director.lastName}`
                              }
                            : null,
                        colaboradoresActivos
                    };
                }

                deptPerformanceMap[deptId].total += 1;
                if (task.status === "completada") {
                    deptPerformanceMap[deptId].completed += 1;
                }
            }

            // Mapa de requests por departamento con nombre del director
            const requestsMap = {};

            for (const req of requests) {
                const deptId = req.requestedByDepartmentId;
                if (!deptId) continue;

                if (!requestsMap[deptId]) {
                    const dept = departments.find(d => d.id === deptId);
                    const deptUsers = users.filter(u => u.departments?.some(d => d.id === deptId));
                    const director = dept?.director || deptUsers.find(u => u.role === "director");

                    requestsMap[deptId] = {
                        departmentId: deptId,
                        directorName: director ? `${director.firstName} ${director.lastName}` : "Sin director",
                        requestsTotal: 0,
                        requestsResueltas: 0,
                        requestsPendientes: 0
                    };
                }

                requestsMap[deptId].requestsTotal += 1;
                if (req.isCompleted) {
                    requestsMap[deptId].requestsResueltas += 1;
                } else {
                    requestsMap[deptId].requestsPendientes += 1;
                }
            }

            // Detalle por colaborador / coordinador
            const collaboratorsPerformance = [];

            const taskByUserMap = {};

            for (const task of tasks) {
                const userIds = parseUserIds(task.userIds);

                for (const userId of userIds) {
                    const key = String(userId);
                    if (!taskByUserMap[key]) taskByUserMap[key] = [];
                    taskByUserMap[key].push(task);
                }
            }

            const allowedRoles = ["coordinador", "colaborador"];
            const filteredUsers = users.filter(
                u =>
                    allowedRoles.includes(u.role) &&
                    (!data.departmentId || u.departments?.some(d => d.id === parseInt(data.departmentId)))
            );

            for (const user of filteredUsers) {
                const userIdStr = String(user.id);
                const userTasks = taskByUserMap[userIdStr] || [];

                const totalTasks = userTasks.length;
                const totalCompleted = userTasks.filter(t => t.status === "completada").length;
                const totalPending = userTasks.filter(t => t.status === "pendiente").length;
                const totalProcess = userTasks.filter(t => t.status === "en-proceso").length;
                const totalExpire = userTasks.filter(t => t.status === "vencida").length;

                const percentagePerformance = totalTasks ? Math.round((totalCompleted / totalTasks) * 100) : 0;

                const departmentId = user.departments?.[0]?.id || null;

                collaboratorsPerformance.push({
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`,
                    departmentId,
                    totalTasks,
                    totalCompleted,
                    totalPending,
                    totalProcess,
                    totalExpire,
                    percentagePerformance
                });
            }

            const statistics = {
                departments: Object.values(deptPerformanceMap),
                requestsByDepartment: Object.values(requestsMap),
                collaboratorsPerformance
            };

            res.status(200).send(statistics);
        } catch (error) {
            console.error("Error en getStatisticsAdminPerformance:", error);
            res.status(500).send({ error: "Error al obtener estadísticas" });
        }
    };

    /**
     * Get performance statistics by department and user on Admin
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getPerformanceAdmin = async (req, res) => {
        try {
            const { departmentId, userId, fromDate, toDate } = req.query;

            const whereClause = {
                departmentId
            };

            if (fromDate || toDate) {
                whereClause.createdAt = {};
                if (fromDate) whereClause.createdAt[Op.gte] = new Date(fromDate);
                if (toDate) whereClause.createdAt[Op.lte] = new Date(toDate);
            }

            let result = await Tasks.findAll({
                where: whereClause,
                include: [
                    {
                        model: TaskFiles,
                        as: "files"
                    }
                ],
                order: [["id", "DESC"]]
            });

            const targetsByMonthArray = [];
            const today = moment();

            if (userId) {
                result = result.filter(task => {
                    const users = JSON.parse(task.userIds || "[]");
                    return users.includes(userId);
                });

                // Generar últimos 6 meses y estructura inicial
                for (let i = 5; i >= 0; i--) {
                    const monthMoment = today.clone().subtract(i, "months").startOf("month");
                    const key = monthMoment.format("YYYY-MM"); // clave interna
                    const name = monthMoment.format("MMMM");
                    targetsByMonthArray.push({
                        key,
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        completados: 0,
                        noCompletados: 0
                    });
                }

                const startOf6MonthsAgo = today.clone().subtract(5, "months").startOf("month").toDate();
                const endOfCurrentMonth = today.clone().endOf("month").toDate();

                const userTargets = await UserTargets.findAll({
                    where: {
                        userId,
                        startDate: {
                            [Op.between]: [startOf6MonthsAgo, endOfCurrentMonth]
                        }
                    }
                });

                userTargets.forEach(target => {
                    const monthKey = moment(target.startDate).format("YYYY-MM");
                    const monthData = targetsByMonthArray.find(m => m.key === monthKey);
                    if (monthData) {
                        if (target.isCompleted) {
                            monthData.completados += 1;
                        } else {
                            monthData.noCompletados += 1;
                        }
                    }
                });
            }

            const membersDepartment = await apiAuth.get("/user/get-all-users", {
                params: {
                    departmentId: departmentId
                }
            });

            const statistics = {
                department: membersDepartment.data.rows[0].departments[0],
                tasks: result.length,
                tasksPending: result.filter(task => task.status === "pendiente").length,
                tasksProcess: result.filter(task => task.status === "en-proceso").length,
                tasksCompleted: result.filter(task => task.status === "completada").length,
                tasksExpired: result.filter(task => task.status === "vencida").length,
                members: {
                    director: membersDepartment.data.rows.find(user => user.role === "director"),
                    colaborators: membersDepartment.data.rows.filter(user => user.role !== "director")
                },
                targetColaborator: {
                    resumenMensual: targetsByMonthArray.map(({ key, ...rest }) => rest),
                    totalCompletados: targetsByMonthArray.reduce((acc, m) => acc + m.completados, 0),
                    totalNoCompletados: targetsByMonthArray.reduce((acc, m) => acc + m.noCompletados, 0)
                }
            };

            res.status(200).send(statistics);
        } catch (error) {
            res.status(500).send(error);
        }
    };
}

module.exports = Statistics;

const { Tasks, CalendarEvents, Chats, ChatMessages } = require("@/database/db");
const { Op } = require("sequelize");
const cron = require("node-cron");
const moment = require("moment");
const Notification = require("./notification");
const apiAuth = require("../utils/apiAuth");
const Mailer = require("../mails");
const microserviceSocket = require("../services/sockets.services"); // Importar el cliente

/**
 * Cron jobs class - MODIFICADO para usar microservicio
 *
 * @param {MicroserviceSocketClient} socketClient - Cliente del microservicio de sockets
 */
class CronJobs {
    #notification;
    #mailer;

    constructor(socketClient) {
        this.#notification = new Notification();
        this.#mailer = new Mailer();

        // Guardar referencia al cliente de sockets
        this.socketClient = socketClient || microserviceSocket;

        // Iniciar cron jobs después de asegurar que el socket está conectado
        if (this.socketClient.isConnected()) {
            this.initializeCronJobs();
        } else {
            // Esperar a que se conecte
            this.socketClient.socket?.on("connect", () => {
                this.initializeCronJobs();
            });
        }
    }

    /**
     * Initialize cron jobs
     */
    initializeCronJobs = async () => {
        console.log("🕐 Inicializando cron jobs con microservicio de sockets...");

        // Running every day at 5 am
        cron.schedule("0 5 * * *", () => {
            this.tasksCron();
        });

        // Running every 15 minutes
        cron.schedule("*/15 * * * *", () => {
            this.calendarCron();
        });

        // Running every 2 hours between 9 am and 5 pm
        cron.schedule("0 9-17/2 * * *", () => {
            this.chatMessagesCron();
        });
    };

    /**
     * Enviar notificación a través del microservicio
     */
    async sendNotification(notificationData, userId) {
        if (!this.socketClient.isConnected()) {
            console.warn("⚠️ Socket no conectado, no se pudo enviar notificación");
            return;
        }

        try {
            // Emitir al usuario específico
            this.socketClient.emitToUser(userId, "receiveNotification", notificationData);
        } catch (error) {
            console.error("❌ Error enviando notificación:", error);
        }
    }

    /**
     * Enviar notificación a una sala/departamento
     */
    async sendToDepartment(departmentId, notificationData) {
        if (!this.socketClient.isConnected()) {
            console.warn("⚠️ Socket no conectado, no se pudo enviar notificación a departamento");
            return;
        }

        try {
            // Emitir a la sala del departamento
            this.socketClient.emitToRoom(`department-${departmentId}`, "receiveNotification", notificationData);
        } catch (error) {
            console.error("❌ Error enviando notificación a departamento:", error);
        }
    }

    /**
     * Tasks cron jobs - MODIFICADO
     */
    tasksCron = async () => {
        try {
            const tasks = await Tasks.findAll({
                where: {
                    status: ["pendiente", "en-proceso"],
                    dueDate: {
                        [Op.not]: null
                    }
                }
            });

            const today = moment().startOf("day");
            const tomorrow = moment().add(1, "days").startOf("day");

            for (const task of tasks) {
                const dueDate = moment(task.dueDate).startOf("day");
                const userIds = task.userIds ? task.userIds.split(",").map(id => id.trim().replace(/["[\]]/g, "")) : [];

                // Verificar si expira mañana
                if (dueDate.isSame(tomorrow)) {
                    for (const userId of userIds) {
                        const newNotification = await this.#notification.create({
                            userId,
                            departmentId: task.departmentId,
                            userIdReceive: userId,
                            content: `La tarea <strong>#${task.id}</strong> está próxima a vencer. Revisá tu agenda.`,
                            type: "redirect",
                            urlRedirect: `/panel/tareas/area/${task.departmentId}/empleado/${userId}?taskId=${task.id}`,
                            isForAdmin: false
                        });

                        // USAR MICROSERVICIO
                        await this.sendNotification(newNotification, userId);
                    }

                    console.log(`📅 Tarea #${task.id} próxima a vencer (mañana)`);
                }

                // Verificar si está vencida (hoy o en el pasado)
                if (dueDate.isSameOrBefore(today)) {
                    task.status = "vencida";
                    await task.save();

                    for (const userId of userIds) {
                        const newNotification = await this.#notification.create({
                            userId,
                            departmentId: task.departmentId,
                            userIdReceive: userId,
                            content: `La tarea <strong>#${task.id}</strong> ha vencido.`,
                            type: "redirect",
                            urlRedirect: `/panel/tareas/area/${task.departmentId}/empleado/${userId}?taskId=${task.id}`,
                            isForAdmin: false
                        });

                        // USAR MICROSERVICIO
                        await this.sendNotification(newNotification, userId);
                    }

                    // Obtener directores del departamento
                    const departmentRes = await apiAuth.get("/department/get-directors", {
                        params: {
                            departmentId: task.departmentId
                        }
                    });

                    const directors = departmentRes.data.users || [];

                    // Enviar notificación a cada director individualmente
                    for (const director of directors) {
                        const newNotificationDirector = await this.#notification.create({
                            userId: director.id,
                            departmentId: task.departmentId,
                            userIdReceive: director.id,
                            content: `La tarea <strong>#${task.id}</strong> ha vencido.`,
                            type: "redirect",
                            urlRedirect: `/panel/tareas/area/${task.departmentId}/empleado/${userIds[0]}?taskId=${task.id}`,
                            isForAdmin: false
                        });

                        await this.sendNotification(newNotificationDirector, director.id);
                    }

                    // También enviar a la sala del departamento (por si hay otros usuarios en la sala)
                    if (directors.length > 0) {
                        const notificationForDept = await this.#notification.create({
                            userId: directors[0].id,
                            departmentId: task.departmentId,
                            userIdReceive: directors[0].id,
                            content: `La tarea <strong>#${task.id}</strong> ha vencido.`,
                            type: "redirect",
                            urlRedirect: `/panel/tareas/area/${task.departmentId}/empleado/${userIds[0]}?taskId=${task.id}`,
                            isForAdmin: false
                        });

                        await this.sendToDepartment(task.departmentId, notificationForDept);
                    }

                    console.log(`⚠️ Tarea #${task.id} marcada como vencida`);
                }
            }
        } catch (error) {
            console.error("❌ Error en el cron de tareas:", error);
        }
    };

    /**
     * Calendar cron job - MODIFICADO
     */
    calendarCron = async () => {
        try {
            const now = moment().startOf("minute");
            const events = await CalendarEvents.findAll({
                where: {
                    date: {
                        [Op.gt]: now.toDate() // solo eventos futuros
                    },
                    wasNotified: false
                }
            });

            for (const event of events) {
                const eventTime = moment(event.date);
                let notifyTime;

                switch (event.notification) {
                    case "30 minutos antes":
                        notifyTime = moment(eventTime).subtract(30, "minutes");
                        break;
                    case "1 hora antes":
                        notifyTime = moment(eventTime).subtract(1, "hours");
                        break;
                    case "1 día antes":
                        notifyTime = moment(eventTime).subtract(1, "days");
                        break;
                    default:
                        continue;
                }

                const windowStart = moment(notifyTime);
                const windowEnd = moment(notifyTime).add(5, "minutes");

                if (now.isSameOrAfter(windowStart, windowEnd)) {
                    const newNotification = await this.#notification.create({
                        userId: event.userId,
                        departmentId: null,
                        userIdReceive: event.userId,
                        content: `Tenés un evento próximo: <strong>${event.title}</strong>`,
                        type: "redirect",
                        urlRedirect: `/panel/calendario`,
                        isForAdmin: false
                    });

                    // USAR MICROSERVICIO
                    await this.sendNotification(newNotification, event.userId);

                    event.wasNotified = true;
                    await event.save();

                    console.log(`📅 Notificación enviada para evento: ${event.title}`);
                }
            }
        } catch (error) {
            console.error("❌ Error en el cron de calendario:", error);
        }
    };

    /**
     * Chat messages cron job
     * (Este no usa sockets, se mantiene igual)
     */
    chatMessagesCron = async () => {
        try {
            const chatMessages = await ChatMessages.findAll({
                where: {
                    wasRead: false
                },
                include: [
                    {
                        model: Chats,
                        as: "chatMessages"
                    }
                ]
            });

            const notifiedUserIds = new Set();

            for (const message of chatMessages) {
                const chat = message.chatMessages;
                const receptorId = message.userId === chat.user1Id ? chat.user2Id : chat.user1Id;

                if (notifiedUserIds.has(receptorId)) continue;

                const userRes = await apiAuth.get("/user/get-user", {
                    params: { userId: receptorId }
                });

                const user = userRes.data;
                if (!user || !user.email) continue;

                await this.#mailer.messagesUnread(user.email);

                notifiedUserIds.add(receptorId);

                console.log(`📧 Email enviado a ${user.email} por mensajes sin leer.`);
            }
        } catch (error) {
            console.error("❌ Error en el cron de mensajes sin leer:", error);
        }
    };
}

module.exports = CronJobs;

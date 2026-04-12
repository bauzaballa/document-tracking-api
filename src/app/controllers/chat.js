const { Chats, ChatMessages } = require("@/database/db");
const { Op } = require("sequelize");
const uploadToS3 = require("../middlewares/uploadToS3");
const apiAuth = require("../utils/apiAuth");
const { onlineUsers } = require("../config");
const microserviceSocket = require("../services/sockets.services");

class Chat {
    constructor() {}

    /**
     * Get or Create chat room
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getOrcreate = async (req, res) => {
        try {
            const data = req.body;

            const chatData = {
                user1Id: data.user1Id,
                user2Id: data.user2Id
            };

            const checkChat1 = await Chats.findOne({
                where: chatData
            });

            if (checkChat1) {
                res.status(200).send(checkChat1);
                return;
            } else {
                const checkChat2 = await Chats.findOne({
                    where: {
                        user1Id: data.user2Id,
                        user2Id: data.user1Id
                    }
                });

                if (checkChat2) {
                    res.status(200).send(checkChat2);
                    return;
                } else {
                    const result = await Chats.create(chatData);
                    res.status(200).send(result);
                }
            }
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Send message
     *
     * @returns {(req: import("express").Request, res: import("express").Response) => Promise<void>}
     */
    sendMessage = async (req, res) => {
        try {
            const data = req.body;

            let fileUrl = null;
            if (data.file && data.fileName) {
                fileUrl = await uploadToS3("ChatFiles", data.file, data.fileName);
            }

            const newMessageData = {
                chatId: data.chatId,
                userId: data.userId,
                message: data.message,
                isBuzz: data.isBuzz,
                fileUrl: fileUrl
            };

            const result = await ChatMessages.create(newMessageData);

            microserviceSocket.emitToChat(data.chatId, "messageLive", result);

            const usersChat = await Chats.findOne({
                where: {
                    id: data.chatId
                }
            });

            microserviceSocket.emitToUser(usersChat.user1Id, "messageLiveNotification", result);
            microserviceSocket.emitToUser(usersChat.user2Id, "messageLiveNotification", result);

            if (data.isBuzz) {
                if (usersChat.user1Id === data.userId) {
                    microserviceSocket.emitToUser(usersChat.user2Id, "receiveChatBuzz", {});
                } else {
                    microserviceSocket.emitToUser(usersChat.user1Id, "receiveChatBuzz", {});
                }
            }

            const recipientId = usersChat.user1Id === data.userId ? usersChat.user2Id : usersChat.user1Id;

            const senderUser = await apiAuth.get("/user/get-user", {
                params: { userId: data.userId }
            });

            const senderName = `${senderUser.data.firstName} ${senderUser.data.lastName}`;

            microserviceSocket.emitToUser(recipientId, "newMessage", {
                chatId: data.chatId,
                message: {
                    ...result.dataValues,
                    userName: senderName
                }
            });

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Update message status
     *
     * @returns {(req: import("express").Request, res: import("express").Response) => Promise<void>}
     */
    updateMessageStatus = async (req, res) => {
        try {
            const data = req.body;

            const messages = await ChatMessages.findAll({
                where: {
                    chatId: data.chatId,
                    userId: data.userId,
                    wasRead: false
                }
            });

            if (messages.length > 0) {
                for (let i = 0; i < messages.length; i++) {
                    await ChatMessages.update(
                        {
                            wasRead: true
                        },
                        {
                            where: {
                                id: messages[i].id
                            }
                        }
                    );
                }

                microserviceSocket.emitToChat(data.chatId, "messagesRead", {
                    chatId: data.chatId,
                    userId: data.userId
                });

                const usersChat = await Chats.findOne({
                    where: {
                        id: data.chatId
                    }
                });

                const recipientId = usersChat.user1Id === data.userId ? usersChat.user2Id : usersChat.user1Id;

                microserviceSocket.emitToUser(recipientId, "messagesHaveBeenRead", {
                    chatId: data.chatId
                });
            }

            res.sendStatus(200);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Get chat messages
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getMessages = async (req, res) => {
        try {
            const data = req.query;

            const page = data.page;
            const pageLimit = data.pageSize;
            const pageOffset = (page - 1) * pageLimit;

            const result = await ChatMessages.findAndCountAll({
                where: {
                    chatId: data.chatId
                },
                order: [["createdAt", "DESC"]],
                limit: pageLimit,
                offset: pageOffset
            });

            if (result.rows.length > 0) {
                result.rows = result.rows.reverse();
            }

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Get chat rooms
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getRooms = async (req, res) => {
        try {
            const data = req.query;
            let rooms = [];

            if (data.userRole === "director") {
                const users = await apiAuth.get("/user/get-all-users", {
                    params: { role: ["director", "admin"] }
                });

                const colaborators = await apiAuth.get("/department/get-users", {
                    params: { departmentId: data.departmentId }
                });

                const userList = Array.isArray(users.data.rows) ? users.data.rows : [];
                const colaboratorList = Array.isArray(colaborators.data.users) ? colaborators.data.users : [];

                rooms = [...userList, ...colaboratorList];
            } else if (data.userRole === "admin") {
                const directors = await apiAuth.get("/user/get-all-users", {
                    params: { role: "director" }
                });

                rooms = Array.isArray(directors.data.rows) ? directors.data.rows : [];
            } else if (data.userRole === "coordinador") {
                const directors = await apiAuth.get("/department/get-directors", {
                    params: { departmentId: data.departmentId }
                });

                const colaborators = await apiAuth.get("/department/get-users", {
                    params: { departmentId: data.departmentId }
                });

                const directorList = Array.isArray(directors.data.users) ? directors.data.users : [];
                const colaboratorList = Array.isArray(colaborators.data.users) ? colaborators.data.users : [];

                rooms = [...directorList, ...colaboratorList];
            } else {
                const directors = await apiAuth.get("/department/get-directors", {
                    params: { departmentId: data.departmentId }
                });

                const coordinators = await apiAuth.get("/department/get-users", {
                    params: { departmentId: data.departmentId }
                });

                const directorList = Array.isArray(directors.data.users) ? directors.data.users : [];
                const coordinatorUsers = Array.isArray(coordinators.data.users) ? coordinators.data.users : [];

                const coordinatorsFilter = coordinatorUsers.filter(user => user.role === "coordinador");

                rooms = [...directorList, ...coordinatorsFilter];
            }

            rooms = rooms
                .filter(room => room.id !== data.userId)
                .map(room => ({
                    ...room,
                    isOnline: onlineUsers.has(room.id)
                }));

            res.status(200).send(rooms);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Get last messages
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getLastMessages = async (req, res) => {
        try {
            const { userId, roomIds } = req.body;

            const results = [];

            for (const roomId of roomIds) {
                let chat = await Chats.findOne({
                    where: { user1Id: userId, user2Id: roomId }
                });

                if (!chat) {
                    chat = await Chats.findOne({
                        where: { user1Id: roomId, user2Id: userId }
                    });
                }

                if (chat) {
                    // Último mensaje
                    const message = await ChatMessages.findOne({
                        where: { chatId: chat.id },
                        order: [["createdAt", "DESC"]]
                    });

                    // Cantidad de mensajes no leídos enviados por la otra persona
                    const unreadCount = await ChatMessages.count({
                        where: {
                            chatId: chat.id,
                            wasRead: false, // o `isRead: false` dependiendo de tu modelo
                            userId: {
                                [Op.not]: userId
                            } // solo cuenta si el mensaje lo envió el otro usuario
                        }
                    });

                    let otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
                    let user = null;
                    try {
                        const res = await apiAuth.get("/user/get-user", {
                            params: { userId: otherUserId }
                        });
                        user = res.data;
                    } catch (e) {
                        console.warn("❌ No se pudo obtener usuario:", e);
                    }

                    results.push({
                        roomId,
                        message,
                        unreadCount,
                        user
                    });
                } else {
                    results.push({
                        roomId,
                        message: null,
                        unreadCount: 0
                    });
                }
            }

            res.status(200).send(results);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Get chat files
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getChatFiles = async (req, res) => {
        try {
            const data = req.query;

            const page = data.page;
            const pageLimit = data.pageSize;
            const pageOffset = (page - 1) * pageLimit;

            const result = await ChatMessages.findAndCountAll({
                where: {
                    chatId: data.chatId,
                    fileUrl: {
                        [Op.not]: null
                    }
                },
                order: [["createdAt", "DESC"]],
                limit: pageLimit,
                offset: pageOffset
            });

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    };

    /**
     * Get total unread messages for a user
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getTotalUnread = async (req, res) => {
        try {
            const { userId } = req.query;

            const count = await ChatMessages.count({
                where: {
                    wasRead: false,
                    userId: {
                        [Op.not]: userId
                    }
                },
                include: [
                    {
                        model: Chats,
                        as: "chatMessages",
                        where: {
                            [Op.or]: [{ user1Id: userId }, { user2Id: userId }]
                        },
                        required: true
                    }
                ]
            });

            res.status(200).send(count);
        } catch (error) {
            res.status(500).send({ error: "Error getting unread messages count" });
        }
    };

    async getChatById(req, res) {
        try {
            const { chatId } = req.query;
            const chat = await Chats.findByPk(chatId);
            if (!chat) return res.status(404).json({ message: "Chat no encontrado" });
            return res.json(chat);
        } catch (err) {
            console.error("❌ Error en getChatById:", err);
            return res.status(500).json({ message: "Error interno del servidor" });
        }
    }
}

module.exports = Chat;

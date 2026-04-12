const { io } = require("socket.io-client");

class MicroserviceSocketClient {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    connect() {
        console.log("🔄 Conectando al microservicio Sockets...");

        this.socket = io(process.env.MICROSERVICE_SOCKET_URL, {
            transports: ["websocket", "polling"],
            auth: {
                service: "direction-backend",
                type: "backend"
            }
        });

        this.socket.on("connect", () => {
            console.log(`✅ Conectado al microservicio Sockets: ${this.socket.id}`);
            this.connected = true;
        });

        this.socket.on("disconnect", reason => {
            console.log(`❌ Desconectado del microservicio Sockets: ${reason}`);
            this.connected = false;
        });

        this.socket.on("connect_error", error => {
            console.log("⚠️ Error conectando al microservicio Sockets:", error.message);
            this.connected = false;
        });
    }

    // Método para emitir eventos
    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
            return true;
        } else {
            console.log("⚠️ No se pudo emitir, el microservicio Sockets no está conectado.");
            return false;
        }
    }

    // Método para emitir a una sala específica
    emitToRoom(room, event, data) {
        if (this.socket?.connected) {
            this.socket.emit("backendEmitToRoom", {
                room: room,
                event: event,
                data: data
            });
            return true;
        } else {
            console.log("⚠️ No se pudo emitir a sala, socket no conectado.");
            return false;
        }
    }

    // Método para emitir a un usuario específico
    emitToUser(userId, event, data) {
        if (this.socket?.connected) {
            this.socket.emit("backendEmitToUser", {
                userId: userId,
                event: event,
                data: data
            });
            return true;
        } else {
            console.log("⚠️ No se pudo emitir a usuario, socket no conectado.");
            return false;
        }
    }

    // Métodos específicos para chat
    emitToChat(chatId, event, data) {
        return this.emitToRoom(`chat-${chatId}`, event, data);
    }

    to(room) {
        return {
            emit: (event, data) => this.emitToRoom(room, event, data)
        };
    }

    isConnected() {
        return this.connected;
    }
}

module.exports = new MicroserviceSocketClient();

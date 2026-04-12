const { createServer } = require("http");
const express = require("express");
const cors = require("cors");
const db = require("../database/models/index");
const routes = require("./routes");
const logger = require("./middlewares/logger");
const apiKeyMiddleware = require("./middlewares/apiKey");
const CronJobs = require("./controllers/cronjobs");
const morgan = require("morgan");
const microserviceSocket = require("./services/sockets.services");

const app = express();
const port = process.env.SERVER_PORT || 3001;

const allowedOrigins = ["http://localhost:3000", "http://localhost:5173"];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        // if (allowedOrigins.indexOf(origin) === -1) {
        //     const msg = 'The CORS policy for this site does not allow access from the specified origin.';
        //     return callback(new Error(msg), false);
        // }
        return callback(null, true);
    },
    credentials: true
};

app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ limit: "300mb", extended: true }));
app.use(cors(corsOptions));
app.use(logger);
app.use(morgan("dev"));

// Crear servidor HTTP compartido entre Express y Socket.io
const httpServer = createServer(app);
microserviceSocket.connect();

// app.use('/api/v1', apiKeyMiddleware, routes(io));
app.use("/api/v1", routes());

db.sequelize.sync({ alter: false }).then(() => {
    console.log("DB sincronizada");
    httpServer.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});

const initializeCronJobs = () => {
    if (microserviceSocket.isConnected()) {
        cronJobsInstance = new CronJobs(microserviceSocket);
        console.log("✅ Cron jobs inicializados con microservicio de sockets");
    } else {
        console.log("⏳ Esperando conexión para inicializar cron jobs...");
        microserviceSocket.socket?.once("connect", () => {
            cronJobsInstance = new CronJobs(microserviceSocket);
            console.log("✅ Cron jobs inicializados con microservicio de sockets");
        });
    }
};

// Intentar inicializar inmediatamente o esperar conexión
initializeCronJobs();

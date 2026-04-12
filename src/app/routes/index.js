const router = require("express").Router();

const calendarEventRouter = require("./calendarevent");
const userTargetRouter = require("./usertarget");
const requestRouter = require("./request");
const tasksListRouter = require("./taskslist");
const tasksRouter = require("./task");
const tasksChecklistRouter = require("./taskchecklist");
const tasksFileRouter = require("./taskfile");
const tasksHistoryRouter = require("./taskhistory");
const statisticsRouter = require("./statistics");
const notificationRouter = require("./notification");
const chatRouter = require("./chat");
const formRoutes = require("./form");
const taskTemplateRoutes = require("./rrhh/taskTemplate.routes");
const taskRrhhRoutes = require("./rrhh/task.routes");
const observationAplicantRoutes = require("./rrhh/observationApplicant.routes");
const jobPositionRoutes = require("./rrhh/jobPosition.routes");
const { healthController } = require("../controllers/health");

module.exports = () => {
    router.use("/calendar-event", calendarEventRouter);
    router.use("/user-target", userTargetRouter);
    router.use("/request", requestRouter);
    router.use("/tasks-list", tasksListRouter);
    router.use("/task", tasksRouter);
    router.use("/task-checklist", tasksChecklistRouter);
    router.use("/task-file", tasksFileRouter);
    router.use("/task-history", tasksHistoryRouter);
    router.use("/statistics", statisticsRouter);
    router.use("/notification", notificationRouter);
    router.use("/chat", chatRouter);
    router.use("/forms", formRoutes);
    router.use("/rrhh/task", taskRrhhRoutes);
    router.use("/rrhh", taskTemplateRoutes);
    router.use("/observation-aplicant", observationAplicantRoutes);
    router.use("/jobposition", jobPositionRoutes);
    router.use("/health", healthController.getServerInfo.bind(healthController));

    return router;
};

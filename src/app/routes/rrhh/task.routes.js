const Task = require("../../controllers/task-rrhh");
const express = require("express");
const router = express.Router();

const tasksRRHHController = new Task();

router.put("/:id", tasksRRHHController.update);
router.post("/create", tasksRRHHController.create);
router.get("/:id", tasksRRHHController.getTaskById);
router.get("/get/all", tasksRRHHController.getTasks);
router.post("/comment", tasksRRHHController.addComment);
router.get("/comments/:id", tasksRRHHController.obtainTaskComments);

module.exports = router;

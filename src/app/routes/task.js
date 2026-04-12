const router = require("express").Router();
const Task = require("../controllers/task");

const tasksController = new Task();

router.post("/create", tasksController.create);
router.put("/update", tasksController.update);
router.delete("/delete", tasksController.delete);
router.get("/get-without-list", tasksController.getTasksWithoutLists);
router.put("/update/state", tasksController.updateState);
router.get("/get-by-id", tasksController.getById);

module.exports = router;

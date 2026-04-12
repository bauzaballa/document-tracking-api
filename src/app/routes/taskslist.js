const router = require("express").Router();
const TasksList = require("../controllers/taskslist");

const tasksListController = new TasksList();

router.post("/create", tasksListController.create);
router.put("/update-name", tasksListController.updateName);
router.put("/update-color", tasksListController.updateColor);
router.get("/get-tasks-lists", tasksListController.getTasksLists);
router.get("/get-tasks-calendar", tasksListController.getTasksCalendar);
router.delete("/delete/:id", tasksListController.delete);
router.get("/get-has-tasks/:id", tasksListController.getHasTasks);

module.exports = router;

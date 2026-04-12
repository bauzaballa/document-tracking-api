const router = require("express").Router();
const TaskFile = require("../controllers/taskfile");

const taskFileController = new TaskFile();

router.post("/create", taskFileController.create);
router.delete("/delete", taskFileController.delete);

module.exports = router;
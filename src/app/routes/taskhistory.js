const router = require("express").Router();
const TaskHistory = require("../controllers/taskhistory");

const taskHistoryController = new TaskHistory();

router.post("/add-comment", taskHistoryController.addComment);
router.get("/get-history", taskHistoryController.getHistory);

module.exports = router;
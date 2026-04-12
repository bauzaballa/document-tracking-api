const router = require("express").Router();
const TaskChecklist = require("../controllers/taskchecklist");

const taskChecklistController = new TaskChecklist();

router.post("/create", taskChecklistController.create);
router.put("/create-check", taskChecklistController.createCheck);
router.put("/update-check", taskChecklistController.updateCheck);
router.delete("/delete", taskChecklistController.delete);
router.get("/get-checklists", taskChecklistController.getChecklists);

module.exports = router;
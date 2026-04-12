const TasksTemplateController = require("../../controllers/taskTemplate");
const express = require("express");
const router = express.Router();

const taskTemplateController = new TasksTemplateController();

router.post("/template", taskTemplateController.createTemplate);
router.get("/templates", taskTemplateController.getTemplates);
router.put("/template/:id", taskTemplateController.updateTemplate);
router.get("/template/:id", taskTemplateController.getTemplateById);
router.delete("/template/:id", taskTemplateController.deleteTemplate);

module.exports = router;

const JobPositionController = require("../../controllers/jobPosition");
const express = require("express");
const router = express.Router();

const JobPosition = new JobPositionController();

router.post("/create", JobPosition.create);
router.put("/:id", JobPosition.update);
router.get("/get-all", JobPosition.getAll);
router.get("/:id", JobPosition.getById);
router.delete("/:id", JobPosition.delete);

module.exports = router;

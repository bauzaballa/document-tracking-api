const ObservationApplicantController = require("../../controllers/observationApplicant");
const express = require("express");
const router = express.Router();

const observationApplicant = new ObservationApplicantController();

router.post("/create", observationApplicant.create);
router.put("/:id", observationApplicant.update);

module.exports = router;

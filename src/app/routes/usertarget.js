const router = require("express").Router();
const UserTarget = require("../controllers/usertarget");

const userTargetController = new UserTarget();

router.post("/create", userTargetController.create);
router.put("/update", userTargetController.update);
router.get("/get-targets", userTargetController.getTargets);
router.get("/get-targets-completed", userTargetController.getTargetsCompleted);

module.exports = router;
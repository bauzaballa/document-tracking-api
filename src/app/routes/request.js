const router = require("express").Router();
const Request = require("../controllers/request");

const requestController = new Request();

router.post("/create", requestController.create);
router.put("/send-message", requestController.sendMessage);
router.put("/finish-request", requestController.finishRequest);
router.put("/decline-request", requestController.declineRequest);
router.put("/accept-request", requestController.acceptRequest);
router.get("/get-by-type", requestController.getRequestsByType);
router.get("/:id", requestController.getRequestsById);
router.post("/upload-file", requestController.uploadFile);

module.exports = router;

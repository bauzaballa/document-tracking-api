const router = require("express").Router();
const Notification = require("../controllers/notification");

const notificationController = new Notification();

router.put("/update", notificationController.update);
router.put("/update-all", notificationController.updateAll);
router.delete("/delete", notificationController.delete);
router.get("/get-notifications", notificationController.getNotifications);
router.post("/create", async (req, res) => {
    try {
        const Notification = notificationController;
        // console.log("📨 Datos recibidos para crear notificación:", req.body);
        const result = await Notification.create(req.body);
        res.status(201).send(result);
    } catch (error) {
        // console.error("❌ Error al crear notificación:", error);
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;

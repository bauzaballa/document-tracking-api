const router = require("express").Router();
const Chat = require("../controllers/chat");

const chatController = new Chat();

router.post("/get-create-chat", chatController.getOrcreate);
router.post("/send-message", chatController.sendMessage);
router.put("/update-message-status", chatController.updateMessageStatus);
router.get("/get-messages", chatController.getMessages);
router.get("/get-rooms", chatController.getRooms);
router.post("/get-last-messages", chatController.getLastMessages);
router.get("/get-chat-files", chatController.getChatFiles);
router.get("/unread-total", chatController.getTotalUnread);
router.get("/get-chat-by-id", chatController.getChatById);

module.exports = router;

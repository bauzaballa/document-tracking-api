const router = require("express").Router();
const CalendarEvent = require("../controllers/calendarevent");

const calendarEventController = new CalendarEvent();

router.post("/create", calendarEventController.create);
router.put("/update", calendarEventController.update);
router.delete("/delete", calendarEventController.delete);
router.get("/get-events", calendarEventController.getEvents);
router.get("/get-google-events", calendarEventController.getGoogleEvents);

module.exports = router;

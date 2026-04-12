const router = require("express").Router();
const Statistics = require("../controllers/statistics");

const statisticsController = new Statistics();

router.get("/performance", statisticsController.getPerformanceStatistics);
router.get("/preview-department-tasks", statisticsController.getPreviewDepartmentTasks);
router.get("/stats-admin", statisticsController.getAdminStatistics);
router.get("/stats-admin-performance", statisticsController.getStatisticsAdminPerformance);
router.get("/admin-performance", statisticsController.getPerformanceAdmin);

module.exports = router;
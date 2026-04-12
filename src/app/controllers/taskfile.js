const { TaskFiles } = require("@/database/db");
const uploadToS3 = require("../middlewares/uploadToS3");

class TaskFile {
    constructor() { };

    /**
     * Create new task's file
     * 
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    create = async (req, res) => {
        try {
            const data = req.body;

            const fileUrl = await uploadToS3("Tareas", data.file, data.fileName);

            const newFileData = {
                taskId: data.taskId,
                fileUrl: fileUrl
            }

            const result = await TaskFiles.create(newFileData);

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
        }
    }

    /**
     * Delete all task's files
     */
    delete = async (req, res) => {
        const { taskId } = req.query;

        if (!taskId) {
            return res.status(400).json({ message: "taskId es requerido" });
        }

        try {
            await TaskFiles.destroy({ where: { taskId } });
            res.sendStatus(200);
        } catch (error) {
            console.error("❌ Error eliminando archivos:", error);
            res.status(500).json({ message: "Error al eliminar archivos" });
        }
    };
}

module.exports = TaskFile;
const { ObservationApplicant, Applicant, TaskFieldValue, TaskField, Tasks } = require("@/database/db");
const { sequelize } = require("@/database/models");
const TaskHistory = require("./taskhistory");
const apiAuth = require("../utils/apiAuth");

class ObservationApplicantController {
    #taskHistory;

    constructor() {
        this.#taskHistory = new TaskHistory();
    }

    create = async (req, res) => {
        try {
            const observation = req.body;

            const newObservation = {
                description: observation.description,
                applicantId: observation.applicantId,
                userId: observation.userId,
                taskStepId: observation.taskStepId,
                type: observation.type
            };

            const createdObservation = await ObservationApplicant.create(newObservation);

            const applicant = Applicant.findByPk(observation.applicantId);
            let name;
            if (applicant) {
                name = await TaskField.findOne({
                    where: {
                        applicantId: observation.applicantId,
                        label: "Nombre y Apellido"
                    },
                    include: [
                        {
                            model: TaskFieldValue,
                            as: "values",
                            required: false
                        }
                    ]
                });
            }

            if (createdObservation) {
                await this.#taskHistory.create({
                    taskId: observation.taskId,
                    userId: observation.userId,
                    content: `Nueva observación para ${name?.values[0]?.value ? name.values[0].value : "un candidato"}`
                });
            }

            //crear notificacion
            const task = await Tasks.findOne({ where: { id: observation.taskId } });
            const UserOfChange = await apiAuth(`/user/get-user?userId=${observation.userId}`);

            let userIds = JSON.parse(task.userIds); // todos los ids que pertenecen a la task
            userIds = userIds.filter(userId => userId !== observation.userId);

            if (observation.userId !== task.userIdCreated) {
                userIds.push(task.userIdCreated);
            }

            await Promise.all(
                userIds.map(async userId => {
                    notificationSocketClient.emit("receiveNotification", {
                        userId: observation.userId,
                        departmentId: null,
                        userIdReceive: userId,
                        content: `${
                            UserOfChange.data.firstName + " " + UserOfChange.data.lastName
                        } agregó una observación en la tarea ${task.title} para ${
                            name?.values[0]?.value ? name.values[0].value : "un candidato"
                        } `,
                        type: "redirect",
                        urlRedirect: `/panel/tareas-rrhh`,
                        isForAdmin: false,
                        metadata: JSON.stringify({
                            taskId: observation.taskId,
                            applicantId: newObservation.applicantId
                        })
                    });
                })
            );
            res.status(201).json(createdObservation);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    };

    update = async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const { id } = req.params;
            const data = req.body;

            const UserOfChange = await apiAuth(`/user/get-user?userId=${data.userId}`);

            const observation = await ObservationApplicant.findByPk(id, { transaction });

            if (!observation) {
                await transaction.rollback();
                return res.status(404).send({ error: "observation not found" });
            }

            // Get applicant name for history
            const applicant = await Applicant.findByPk(observation.applicantId);
            let applicantName = "un candidato";

            if (applicant) {
                const nameField = await TaskField.findOne({
                    where: {
                        applicantId: observation.applicantId,
                        label: "Nombre y Apellido"
                    },
                    include: [
                        {
                            model: TaskFieldValue,
                            as: "values",
                            required: false
                        }
                    ],
                    transaction
                });

                if (nameField && nameField.values && nameField.values[0]) {
                    applicantName = nameField.values[0].value;
                }
            }

            // Create task history
            await this.#taskHistory.create(
                {
                    taskId: data.taskId || observation.taskId,
                    userId: data.userId,
                    content: `Observación actualizada para ${applicantName} hecha por  ${
                        UserOfChange.data.firstName + " " + UserOfChange.data.lastName
                    }`
                },
                { transaction }
            );

            // Update observation description if provided
            if (data.description) {
                await observation.update({ description: data.description }, { transaction });
            }

            // Get task and user info for notifications
            const task = await Tasks.findOne({
                where: { id: data.taskId },
                transaction
            });

            let userIds = JSON.parse(task.userIds); // todos los ids que pertenecen a la task
            userIds = userIds.filter(userId => userId !== observation.userId);

            if (observation.userId !== task.userIdCreated) {
                userIds.push(task.userIdCreated);
            }

            await Promise.all(
                userIds.map(async userId => {
                    notificationSocketClient.emit("receiveNotification", {
                        userId: data.userId,
                        departmentId: null,
                        userIdReceive: userId,
                        content: `${
                            UserOfChange.data.firstName + " " + UserOfChange.data.lastName
                        } actualizó una observación en la tarea ${task?.title} para ${applicantName} `,
                        type: "redirect",
                        urlRedirect: `/panel/tareas-rrhh`,
                        isForAdmin: false,
                        metadata: JSON.stringify({
                            taskId: observation.taskId,
                            applicantId: observation.applicantId
                        })
                    });
                })
            );

            await transaction.commit();

            const updatedObservation = await ObservationApplicant.findByPk(id);
            res.status(200).json(updatedObservation);
        } catch (error) {
            await transaction.rollback();
            console.error("Error updating observation:", error);
            res.status(500).json({ message: error.message });
        }
    };
}

module.exports = ObservationApplicantController;

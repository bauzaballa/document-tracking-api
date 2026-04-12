const {
    Tasks,
    TaskFiles,
    TaskTemplate,
    TaskField,
    TaskStep,
    TaskHistories,
    TaskFieldValue,
    Applicant,
    ObservationApplicant
} = require("@/database/db");
const { sequelize } = require("@/database/models");
const apiAuth = require("../utils/apiAuth");
const microserviceSocket = require("../services/sockets.services");

const TaskHistory = require("./taskhistory");
const Notification = require("./notification"); // Nueva importación

const { parseValueStringToValue, isValidStringValue, parserValueToString } = require("../utils/parserValueToString");

class Task {
    #taskHistory;
    #notification;

    constructor() {
        this.#taskHistory = new TaskHistory();
        this.#notification = new Notification();
    }

    create = async (req, res) => {
        try {
            const data = req.body;

            const newTasksData = {
                title: data.title,
                departmentId: data.departmentId,
                userIds: JSON.stringify(data.userIds),
                priority: data.priority,
                status: data.status,
                description: data.description,
                startDate: data.startDate || null,
                dueDate: data.dueDate || null,
                isDraft: false,
                subareaId: data.subareaId,
                position: data.position,
                category: data.category || "No comercial",
                unitId: data.unitId,
                userIdCreated: data.userIdCreated,
                requestId: data.requestId,

                //===============================
                firstNameUser: data?.firstNameUser,
                taskTemplateName: data.taskTemplateName,
                taskTemplateId: data.templateId
            };

            const result = await Tasks.create(newTasksData);
            if (result) {
                await this.#taskHistory.create({
                    taskId: result.id,
                    userId: newTasksData?.userIdCreated,
                    content: `${newTasksData?.firstNameUser} ha creado la tarea`
                });
            }

            microserviceSocket.emit("updateTable", {});
            if (newTasksData.taskTemplateId) {
                let response = await this.processCreateStepsTask({ ...data, taskId: result.id });

                await this.taskNotifications(
                    {
                        ...data,
                        id: result.id,
                        userId: data.userIdCreated, // Asegurar que userId esté presente
                        userIdCreated: data.userIdCreated,
                        firstNameUser: data.firstNameUser
                    },
                    [], // previousUserIds - vacío para create
                    "", // previousPriority - vacío para create
                    "", // previousStatus - vacío para create
                    result, // task object
                    result.id, // id
                    "create" // Tipo de operación
                );
                res.status(200).json(response);
            } else {
                res.status(400).json({ message: "templateId is required" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    };

    getTasks = async (req, res) => {
        try {
            const {
                department,
                category,
                status,
                priority,
                startDate,
                templateId,
                userId,
                page = 1,
                orderBy = "ASC",
                limit = 10
            } = req.query;

            // Validar parámetros de paginación
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
            const offset = (pageNumber - 1) * limitNumber;

            if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {
                return res.status(400).json({
                    message: "Los parámetros de paginación deben ser números positivos"
                });
            }

            //---------- OBTENER DEPARTAMENTOS Y USUARIOS ----------
            const [departmentsResponse, usersResponse, subareasResponse] = await Promise.all([
                apiAuth.get("/department/get-all"),
                apiAuth.get("/user/get-all-users"),
                apiAuth.get("/subarea/get-all")
            ]);

            const departments = departmentsResponse.data;
            const allUsers = usersResponse.data.rows;
            const allSubareas = subareasResponse.data;

            const departmentFilter = departments?.filter(el => el.name === department);

            if (!departmentFilter || departmentFilter.length === 0) {
                return res.status(404).json({
                    message: "Departamento no encontrado"
                });
            }

            const subareaIdFound = departmentFilter[0].subareas.find(el => el.name === category)?.id;

            if (!subareaIdFound) {
                return res.status(404).json({
                    message: "Categoría no encontrada en el departamento"
                });
            }

            //---------- CLAUSULA WHERE ----------
            const whereClause = {
                subareaId: subareaIdFound
            };

            if (status) whereClause.status = status;
            if (priority) whereClause.priority = priority;
            if (startDate) whereClause.startDate = startDate;
            if (templateId) whereClause.taskTemplateId = templateId;

            let tasks = await Tasks.findAll({
                where: whereClause,
                order: [["id", orderBy]],
                attributes: [
                    "id",
                    "priority",
                    "status",
                    "startDate",
                    "dueDate",
                    "subareaId",
                    "title",
                    "userIds",
                    "createdAt"
                ],
                include: [{ model: TaskTemplate, as: "taskTemplate", attributes: ["id", "title"] }]
            });

            const parseUserIds = userIdsData => {
                if (!userIdsData) return [];

                // Si ya es un array, retornarlo
                if (Array.isArray(userIdsData)) {
                    return userIdsData;
                }

                if (typeof userIdsData === "string") {
                    try {
                        const parsed = parseValueStringToValue(userIdsData);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        // Fallback: manejar como string separado por comas
                        return userIdsData
                            .replace(/[\[\]\"]/g, "")
                            .split(",")
                            .filter(id => id.trim() !== "")
                            .map(id => id.trim());
                    }
                }

                return [];
            };

            // Filtrar por userId si se especificó
            if (userId) {
                tasks = tasks.filter(task => {
                    const userIdsArray = parseUserIds(task.userIds);
                    return userIdsArray.includes(userId);
                });
            }

            // Aplicar paginación
            const totalTasks = tasks.length;
            const totalPages = Math.ceil(totalTasks / limitNumber);
            const paginatedTasks = tasks.slice(offset, offset + limitNumber);

            if (!paginatedTasks || paginatedTasks.length === 0) {
                return res.status(200).json({
                    message: "No se encontraron tareas con tales filtros",
                    data: [],
                    pagination: {
                        currentPage: pageNumber,
                        pageSize: limitNumber,
                        totalItems: totalTasks,
                        totalPages: totalPages,
                        hasNextPage: pageNumber < totalPages,
                        hasPreviousPage: pageNumber > 1
                    }
                });
            }

            const subareaData = allSubareas.find(subarea => subarea.id === subareaIdFound);

            // Procesar las tareas para incluir información de usuarios asignados
            const tasksWithUsers = paginatedTasks.map(task => {
                const taskUserIds = parseUserIds(task.userIds);

                const assignedUsers = allUsers
                    .filter(user => taskUserIds.includes(user.id))
                    .map(user => ({
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role
                    }));

                // Crear un nuevo objeto sin el userIds original y agregar el array parseado
                const taskData = task.toJSON();
                const { userIds: originalUserIds, ...taskWithoutUserIds } = taskData;

                return {
                    ...taskWithoutUserIds,
                    userIds: taskUserIds, // <=== Ahora es el array, no el string JSON
                    assignedUsers,
                    subareaData: subareaData || null
                };
            });

            res.status(200).json({
                data: tasksWithUsers,
                pagination: {
                    currentPage: pageNumber,
                    pageSize: limitNumber,
                    totalItems: totalTasks,
                    totalPages: totalPages,
                    hasNextPage: pageNumber < totalPages,
                    hasPreviousPage: pageNumber > 1
                }
            });
        } catch (error) {
            console.error("Error en getTasks:", error);
            res.status(500).json({
                message: "Error al obtener las tareas",
                error: error.message
            });
        }
    };

    getTaskById = async (req, res) => {
        try {
            const { id } = req.params;

            const task = await Tasks.findByPk(id, {
                include: [
                    {
                        model: TaskFiles,
                        as: "files"
                    },
                    {
                        model: TaskTemplate,
                        as: "taskTemplate",
                        attributes: ["id", "title"],
                        include: [
                            {
                                model: TaskStep,
                                as: "taskSteps",
                                attributes: ["id", "title", "subTitle", "typeStep", "order", "stepStatus"],
                                include: [
                                    {
                                        model: TaskField,
                                        as: "taskFields",
                                        required: false,
                                        include: [
                                            {
                                                model: TaskFieldValue,
                                                as: "values",
                                                required: false,
                                                where: { taskId: id }
                                            }
                                        ]
                                    },
                                    {
                                        model: Applicant,
                                        as: "applicants",
                                        required: false,
                                        where: { taskId: id },
                                        include: [
                                            {
                                                model: TaskField,
                                                as: "taskFields",
                                                include: [
                                                    {
                                                        model: TaskFieldValue,
                                                        as: "values",
                                                        required: false,
                                                        where: { taskId: id }
                                                    }
                                                ]
                                            },
                                            {
                                                model: ObservationApplicant,
                                                as: "observations"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            if (!task) {
                return res.status(404).json({
                    message: "No se encontró la tarea"
                });
            }

            // Historial de cambios
            const records = await TaskHistories.findAll({
                where: { taskId: id },
                order: [["createdAt", "ASC"]],
                attributes: ["createdAt", "id", "userId", "content"]
            });

            let recordsWithUsers = await Promise.all(
                records.map(async record => {
                    try {
                        const userDetail = await apiAuth.get(`/user/get-user?userId=${record.userId}`);
                        return {
                            id: record.id,
                            content: record.content,
                            createdAt: record.createdAt,
                            lastName: userDetail.data.lastName,
                            firstName: userDetail.data.firstName,
                            rol: userDetail.data.role
                        };
                    } catch (error) {
                        return {
                            id: record.id,
                            content: record.content,
                            createdAt: record.createdAt
                        };
                    }
                })
            );

            // Usuarios y subáreas
            const responseUsers = await apiAuth.get("/user/get-all-users");
            const responseSubareas = await apiAuth.get("/subarea/get-all");
            const allUsers = responseUsers.data.rows;
            const allSubareas = responseSubareas.data;

            let taskUserIds = await parseValueStringToValue(task.userIds);

            const assignedUsers = allUsers
                .filter(user => taskUserIds.includes(user.id))
                .map(user => ({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    avatarUrl: user.avatarUrl
                }));

            // Pasar a JSON plano para poder manipular
            const plainTask = task.toJSON();

            plainTask.users = assignedUsers;
            plainTask.record = recordsWithUsers;
            plainTask.userIds = JSON.parse(plainTask.userIds);

            // ========== ENRIQUECER OBSERVACIONES CON DATOS DE USUARIO ==========
            if (plainTask.taskTemplate && plainTask.taskTemplate.taskSteps) {
                // Recopilar todos los user IDs únicos de las observaciones
                const uniqueUserIds = new Set();

                plainTask.taskTemplate.taskSteps.forEach(step => {
                    if (step.applicants) {
                        step.applicants.forEach(applicant => {
                            if (applicant.observations) {
                                applicant.observations.forEach(observation => {
                                    if (observation.userId) {
                                        uniqueUserIds.add(observation.userId);
                                    }
                                });
                            }
                        });
                    }
                });

                const usersMap = new Map();

                if (uniqueUserIds.size > 0) {
                    try {
                        const usersResponse = await apiAuth.get("/user/get-users", {
                            params: {
                                userIds: Array.from(uniqueUserIds).join(",")
                            }
                        });

                        if (usersResponse.data && Array.isArray(usersResponse.data)) {
                            usersResponse.data.forEach(user => {
                                usersMap.set(user.id, user);
                            });
                        }
                    } catch (batchError) {
                        console.warn(
                            "No se pudo obtener usuarios en batch, obteniendo individualmente:",
                            batchError.message
                        );

                        // Fallback: obtener usuarios uno por uno
                        await Promise.all(
                            Array.from(uniqueUserIds).map(async userId => {
                                try {
                                    const userDetail = await apiAuth.get(`/user/get-user?userId=${userId}`);
                                    usersMap.set(userId, userDetail.data);
                                } catch (err) {
                                    console.warn(`No se pudo obtener usuario ${userId}:`, err.message);
                                }
                            })
                        );
                    }
                }

                // Aplicar los datos de usuario a las observaciones
                plainTask.taskTemplate.taskSteps.forEach(step => {
                    if (step.applicants) {
                        step.applicants.forEach(applicant => {
                            if (applicant.observations) {
                                applicant.observations = applicant.observations.map(observation => {
                                    if (observation.userId && usersMap.has(observation.userId)) {
                                        const user = usersMap.get(observation.userId);
                                        return {
                                            ...observation,
                                            user: {
                                                id: user.id,
                                                firstName: user.firstName,
                                                lastName: user.lastName,
                                                email: user.email,
                                                role: user.role,
                                                avatarUrl: user.avatarUrl
                                            }
                                        };
                                    }
                                    return observation;
                                });
                            }
                        });
                    }
                });
            }

            // Función para parsear campos y opciones
            const parseFieldStructure = field => {
                // Parsear options si es string
                if (field.options && typeof field.options === "string") {
                    try {
                        field.options = JSON.parse(field.options);
                    } catch (error) {
                        console.warn(`Error parsing options for field ${field.id}:`, error);
                        field.options = null;
                    }
                }

                // Parsear fields si es string
                if (field.fields && typeof field.fields === "string") {
                    try {
                        field.fields = JSON.parse(field.fields);

                        // Parsear recursivamente campos anidados
                        if (Array.isArray(field.fields)) {
                            field.fields.forEach(nestedField => {
                                if (nestedField.fields && typeof nestedField.fields === "string") {
                                    try {
                                        nestedField.fields = JSON.parse(nestedField.fields);
                                    } catch (error) {
                                        console.warn(`Error parsing nested fields for field ${field.id}:`, error);
                                        nestedField.fields = null;
                                    }
                                }
                            });
                        }
                    } catch (error) {
                        console.warn(`Error parsing fields for field ${field.id}:`, error);
                        field.fields = null;
                    }
                }

                return field;
            };

            // Función para procesar campos y sus valores
            const processFieldValues = field => {
                field = parseFieldStructure(field);

                if (field.values && field.values.length > 0) {
                    field.values = field.values.map(value => {
                        value.value = parseValueStringToValue(value.value);
                        return value;
                    });
                }

                return field;
            };

            // Procesar campos de los steps
            plainTask.taskTemplate.taskSteps.forEach(step => {
                if (step.taskFields) {
                    step.taskFields = step.taskFields.map(processFieldValues);
                }

                // Procesar campos de los applicants
                if (step.applicants) {
                    step.applicants.forEach(applicant => {
                        if (applicant.taskFields) {
                            // Primero parsear la estructura de los campos del applicant
                            applicant.taskFields = applicant.taskFields.map(parseFieldStructure);
                            // Luego procesar los valores
                            applicant.taskFields = applicant.taskFields.map(processFieldValues);
                        }
                    });
                }
            });

            // Subárea
            if (plainTask.subareaId) {
                const subareaData = allSubareas.find(subarea => subarea.id === plainTask.subareaId);
                plainTask.subareaData = subareaData;
            }

            res.status(200).send(plainTask);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Error al obtener la tarea",
                error: error.message
            });
        }
    };

    update = async (req, res) => {
        const transaction = await sequelize.transaction();
        let shouldHistory = false;
        try {
            const { id } = req.params;
            const data = req.body;

            const task = await Tasks.findByPk(id);

            if (!task) {
                throw new Error("Task not found");
            }

            // Obtener valores anteriores para comparar
            const previousUserIds = JSON.parse(task.userIds || "[]");
            const previousPriority = task.priority;
            const previousStatus = task.status;

            let userIdsToSave;
            if (typeof data.userIds === "string") {
                try {
                    const parsedUserIds = JSON.parse(data.userIds);
                    userIdsToSave = JSON.stringify(parsedUserIds);
                } catch (parseError) {
                    userIdsToSave = data.userIds;
                }
            } else if (Array.isArray(data.userIds)) {
                userIdsToSave = JSON.stringify(data.userIds);
            } else {
                userIdsToSave = JSON.stringify([]);
            }

            const updateTasksData = {
                title: data.title,
                status: data.status,
                userIds: userIdsToSave,
                priority: data.priority,
                description: data.description,
                dueDate: data.dueDate || task.dueDate,
                startDate: data.startDate || task.startDate
            };

            const { taskTemplate } = req.body;

            await Tasks.update(updateTasksData, {
                where: { id }
            });

            // Cambio de estado
            if (task.status !== data.status) {
                await this.#taskHistory.create({
                    taskId: data.id,
                    userId: data.userIdUpdated,
                    content: `${data.firstNameUser} cambió el estado de la tarea de '${task.status.replace(
                        "-",
                        " "
                    )}' a '${data.status.replace("-", " ")}'`
                });
            }

            // Cambios de prioridad
            if (task.priority !== data.priority) {
                await this.#taskHistory.create({
                    taskId: id,
                    userId: data.userIdUpdated,
                    content: `${data.firstNameUser} cambió la prioridad de la tarea de '${task.priority.replace(
                        "-",
                        " "
                    )}' a '${data.priority.replace("-", " ")}'`
                });
            }

            // Comentario
            if (data.comment) {
                await this.#taskHistory.create({
                    taskId: id,
                    userId: data.userId,
                    content: data.comment
                });
            }

            let taskSteps = null;
            if (taskTemplate && Array.isArray(taskTemplate.taskSteps)) {
                taskSteps = taskTemplate.taskSteps;
            } else if (Array.isArray(data.taskSteps)) {
                taskSteps = data.taskSteps;
            }
            let hasApplicantModifications = false;
            if (taskSteps && taskSteps.length > 0) {
                for (const step of taskSteps) {
                    // Saltar steps sin ID
                    if (!step.id) continue;

                    const existingStep = await TaskStep.findAll({ where: { id: step.id } });

                    if (!existingStep) continue;

                    // Procesar campos principales del step
                    if (step.taskFields && Array.isArray(step.taskFields)) {
                        for (const field of step.taskFields) {
                            await this.processField(field, id, transaction);
                        }
                    }

                    if (step.applicants) {
                        for (const applicantData of step.applicants) {
                            // Procesar campos del applicant
                            let wasModify = await this.processApplicants(
                                applicantData,
                                id,
                                step.id,
                                data,
                                transaction,
                                task.requestId
                            );
                            if (wasModify) {
                                hasApplicantModifications = true;
                            }
                        }
                        // Elimina los applicants que fueron eliminados
                        const hadCleanup = await this.cleanupApplicants(step.applicants, id, transaction, step.id);
                        if (hadCleanup) {
                            hasApplicantModifications = true;
                        }
                    }
                    const isComplete = await this.isStepComplete(step, id);
                    await TaskStep.update({ stepStatus: isComplete }, { where: { id: step.id }, transaction });
                }
            }

            if (hasApplicantModifications) {
                shouldHistory = true;
            }
            if (shouldHistory) {
                await this.#taskHistory.create({
                    taskId: id,
                    userId: data?.userIdUpdated,
                    content: `${
                        data?.firstNameUser
                            ? `${data.firstNameUser} (${data.rolActionUser}) actualizó la tarea`
                            : "Se actualizó la tarea"
                    }`
                });
            }

            // Envío de notificaciones
            await this.taskNotifications(data, previousUserIds, previousPriority, previousStatus, task, id, "update");
            await transaction.commit();
            microserviceSocket.emit("updateTable", {});
            res.status(200).json({
                success: true,
                message: "Task updated successfully"
            });
        } catch (error) {
            await transaction.rollback();
            console.error(error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                message: error.message
            });
        }
    };

    addComment = async (req, res) => {
        const transaction = await sequelize.transaction();

        try {
            const { message, taskId, userId, taskDetails, directorId } = req.body;

            // Crear el comentario
            await TaskHistories.create(
                {
                    taskId,
                    userId,
                    content: message
                },
                { transaction }
            );
            await transaction.commit();
            // Enviar notificaciones después del commit exitoso
            try {
                // Obtener información del usuario que comenta
                const commenterResponse = await apiAuth.get(`/user/get-user?userId=${userId}`);
                const commenter = commenterResponse.data;
                const commenterName = `${commenter.firstName} ${commenter.lastName}`;
                const commenterRole = commenter.role;

                if (commenterRole === "director") {
                    // Si es director, notificar a los usuarios asignados a la tarea
                    const assignedUsers = taskDetails.users || [];

                    await Promise.all(
                        assignedUsers
                            .filter(user => user.id !== userId) // No notificar al mismo director
                            .map(async user => {
                                try {
                                    const notification = await this.#notification.create({
                                        userId: userId, // ✅ CORRECTO: Director que comenta
                                        departmentId: taskDetails.departmentId,
                                        userIdReceive: user.id, // ✅ CORRECTO: Usuario que recibe
                                        content: `<strong>${commenterName}</strong> agregó un comentario en la tarea <strong>${taskDetails.taskTemplate.title}</strong>`,
                                        type: "redirect",
                                        urlRedirect: `/panel/tareas-rrhh`,
                                        isForAdmin: false,
                                        metadata: JSON.stringify({ taskId: taskDetails.id, comment: true })
                                    });
                                } catch (err) {
                                    console.error(`Error enviando notificación a usuario ${user.id}:`, err);
                                }
                            })
                    );
                } else {
                    // Si es colaborador, notificar al director usando el directorId del req.body
                    if (directorId && directorId !== userId) {
                        const notification = await this.#notification.create({
                            userId: userId,
                            departmentId: taskDetails.departmentId,
                            userIdReceive: directorId,
                            content: `<strong>${commenterName}</strong> agregó un comentario en la tarea <strong>${taskDetails.taskTemplate.title}</strong>`,
                            type: "redirect",
                            urlRedirect: `/panel/tareas-rrhh`,
                            isForAdmin: true,
                            metadata: JSON.stringify({ taskId: taskId, comment: true })
                        });
                    }
                }
            } catch (notificationError) {
                console.error("Error general al enviar notificaciones:", notificationError);
            }

            res.status(201).json({
                success: true,
                message: "Comment added successfully."
            });
        } catch (error) {
            await transaction.rollback();
            console.error("Error en addComment:", error);

            res.status(500).json({
                success: false,
                error: "Internal server error",
                message: error.message
            });
        }
    };

    /**
     * Get all comments for a specific task
     *
     * @async
     * @function obtainTaskComments
     * @param {import('express').Request} req - Express request object
     * @param {Object} req.params - Request parameters
     * @param {string} req.params.id - Task ID to get comments for
     * @param {import('express').Response} res - Express response object
     * @returns {Promise<void>} Returns a JSON response with the task comments or error message
     */
    obtainTaskComments = async (req, res) => {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;

            const result = await TaskHistories.findAll({
                where: { taskId: id },
                order: [["createdAt", "ASC"]],
                transaction
            });

            await transaction.commit();

            res.status(201).json({
                success: true,
                result
            });
        } catch (error) {
            await transaction.rollback();
            console.error(error);

            res.status(500).json({
                success: false,
                error: "Internal server error",
                message: error.message
            });
        }
    };

    //=============== Functions shareds========================
    async processField(field, taskId, transaction) {
        if (!field.id) {
            console.warn("Field without ID found, skipping:", field);
            return false; // Retornar false cuando no hay field.id
        }

        let values = field.values;

        if (!Array.isArray(values)) {
            values = values !== null && values !== undefined ? [values] : [];
        }

        const normalizedValues = values.map(v =>
            typeof v === "object" && v !== null && "value" in v ? v : { value: v }
        );

        try {
            const taskFieldExists = await TaskField.findByPk(field.id, { transaction });
            if (!taskFieldExists) {
                console.warn(`TaskField with ID ${field.id} does not exist, skipping`);
                return false; // Retornar false cuando no existe el TaskField
            }

            const existingValues = await TaskFieldValue.findAll({
                where: { taskFieldId: field.id, taskId },
                transaction,
                order: [["id", "ASC"]]
            });

            const existingValuesMap = new Map(existingValues.map(ev => [ev.id, ev]));
            let hasChanges = false; // Variable para rastrear cambios

            // Procesar valores - CONVERTIR TODO A STRING
            for (const val of normalizedValues) {
                const stringValue = parserValueToString(val.value);

                if (isValidStringValue(stringValue)) {
                    const updateData = {
                        value: stringValue
                    };

                    if (val.id && existingValuesMap.has(val.id)) {
                        const existingValue = existingValuesMap.get(val.id);
                        // Verificar si el valor realmente cambió
                        if (existingValue.value !== stringValue) {
                            await existingValue.update(updateData, { transaction });
                            hasChanges = true; // Hubo actualización
                        }
                        existingValuesMap.delete(val.id);
                    } else {
                        // Crear nuevo valor
                        await TaskFieldValue.create(
                            {
                                ...updateData,
                                taskId: Number(taskId),
                                taskFieldId: field.id
                            },
                            { transaction }
                        );
                        hasChanges = true; // Hubo creación
                    }
                }
            }

            // Eliminar sobrantes
            if (existingValuesMap.size > 0) {
                await TaskFieldValue.destroy({
                    where: {
                        id: Array.from(existingValuesMap.keys()),
                        taskFieldId: field.id,
                        taskId
                    },
                    transaction
                });
                hasChanges = true; // Hubo eliminación
            }

            return hasChanges; // Retornar true si hubo cambios, false si no
        } catch (error) {
            console.error(`Error processing field ${field.id}:`, error);
            throw error;
        }
    }

    async isStepComplete(step, taskId) {
        try {
            // Verificar campos principales del step
            if (step.taskFields && Array.isArray(step.taskFields)) {
                for (const field of step.taskFields) {
                    // Solo verificar campos requeridos
                    if (field.required) {
                        const isFieldComplete = await this.isFieldComplete(field, taskId);
                        if (!isFieldComplete) {
                            return false; // Si algún campo requerido no está completo, el step no está completo
                        }
                    }
                }
            }

            // Verificar campos de applicants si existen
            if (step.applicants && Array.isArray(step.applicants)) {
                for (const applicant of step.applicants) {
                    if (applicant.taskFields && Array.isArray(applicant.taskFields)) {
                        for (const field of applicant.taskFields) {
                            // Solo verificar campos requeridos
                            if (field.required) {
                                const isFieldComplete = await this.isFieldComplete(field, taskId);
                                if (!isFieldComplete) {
                                    return false; // Si algún campo requerido no está completo, el step no está completo
                                }
                            }
                        }
                    }
                }
            }

            // Si todos los campos requeridos están completos, el step está completo
            return true;
        } catch (error) {
            console.error("Error en isStepComplete:", error);
            return false; // En caso de error, considerar el step como incompleto
        }
    }

    async isFieldComplete(field, taskId, applicantId = null) {
        const whereClause = {
            taskFieldId: field.id,
            taskId
        };

        if (applicantId) {
            whereClause.applicantId = applicantId;
        }

        const values = await TaskFieldValue.findAll({ where: whereClause });

        // Si no hay valores y el campo es requerido, no está completo
        if (values.length === 0) {
            return false;
        }

        // Verificar que al menos un valor no esté vacío
        return values.some(item => {
            try {
                const parsedValue = JSON.parse(item.value);
                return parsedValue !== null && parsedValue !== "" && parsedValue !== "null";
            } catch {
                return item.value !== null && item.value !== "" && item.value !== "null";
            }
        });
    }

    async processApplicants(applicantData, taskId, stepId, data, transaction, requestId) {
        let hasChanges = false; // Variable para rastrear cambios

        // Procesar taskFields del applicant
        if (applicantData.taskFields && Array.isArray(applicantData.taskFields)) {
            for (const field of applicantData.taskFields) {
                const fieldChanged = await this.processField(field, taskId, transaction);
                if (fieldChanged) {
                    hasChanges = true; // Hubo cambios en los fields
                }
            }
        }

        if (applicantData.id) {
            let applicantId = applicantData.id;
            const existingApplicant = await Applicant.findByPk(applicantId);
            const previousApplicantStatus = existingApplicant ? existingApplicant.status : null;

            const nameApplicantField = await TaskField.findOne({
                where: {
                    applicantId: applicantData.id,
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

            let applicantName =
                nameApplicantField.values[0] && nameApplicantField?.values[0].value
                    ? `el candidato ${nameApplicantField?.values[0].value}`
                    : "un candidato";

            if (applicantData.status !== "cancel") {
                const checkstatus =
                    applicantData.statusDirector && applicantData.statusColaborador && applicantData.statusRequest
                        ? "approved"
                        : "pending";

                const statusChanged = existingApplicant.status !== checkstatus;
                const directorChanged = existingApplicant.statusDirector !== applicantData.statusDirector;
                const colaboradorChanged = existingApplicant.statusColaborador !== applicantData.statusColaborador;
                const requestChanged = existingApplicant.statusRequest !== applicantData.statusRequest;

                const [affectedRows] = await Applicant.update(
                    {
                        status: checkstatus,
                        statusDirector: applicantData.statusDirector,
                        statusColaborador: applicantData.statusColaborador,
                        statusRequest: applicantData.statusRequest
                    },
                    {
                        where: { id: applicantId },
                        transaction
                    }
                );

                if (affectedRows > 0 && (statusChanged || directorChanged || colaboradorChanged || requestChanged)) {
                    hasChanges = true; // Hubo cambios en el applicant

                    if (statusChanged) {
                        const formatStatus = status => {
                            if (!status) return "sin estado";

                            const statusMap = {
                                pending: "Pendiente",
                                cancel: "Cancelado",
                                approved: "Aprobado"
                            };

                            const cleanStatus = status.replace(/-/g, " ");
                            return statusMap[cleanStatus] || cleanStatus;
                        };

                        await this.#taskHistory.create({
                            taskId: taskId,
                            userId: data.userIdUpdated,
                            content: `${data.firstNameUser} (${
                                data.rolActionUser
                            }) cambió el estado de '${applicantName}' de "${formatStatus(
                                previousApplicantStatus
                            )}" a "${formatStatus(checkstatus)}"`
                        });
                    }

                    // Si cambió statusDirector a true
                    if (directorChanged && applicantData.statusDirector) {
                        await this.#taskHistory.create({
                            taskId: taskId,
                            userId: data.userIdUpdated,
                            content: `${data.firstNameUser} (${data.rolActionUser}) confirmó a ${applicantName}`
                        });
                    }

                    // Si cambió statusColaborador a true
                    if (colaboradorChanged && applicantData.statusColaborador) {
                        await this.#taskHistory.create({
                            taskId: taskId,
                            userId: data.userIdUpdated,
                            content: `${data.firstNameUser} (${data.rolActionUser}) confirmó a ${applicantName}`
                        });
                    }

                    // Si cambió statusRequest a true
                    if (requestChanged && applicantData.statusRequest) {
                        await this.#taskHistory.create({
                            taskId: taskId,
                            userId: data.userIdUpdated,
                            content: `${data.firstNameUser} (${data.rolActionUser}) eligió a ${applicantName}`
                        });
                    }
                }
            } else {
                const statusChanged = existingApplicant.status !== "cancel";

                const [affectedRows] = await Applicant.update(
                    {
                        status: "cancel",
                        statusDirector: false,
                        statusColaborador: false,
                        statusRequest: !requestId ? true : false
                    },
                    {
                        where: { id: applicantId },
                        transaction
                    }
                );

                // CREAR HISTORIAL SI HUBO CAMBIOS
                if (affectedRows > 0) {
                    hasChanges = true; // Hubo cambios en el applicant
                    if (statusChanged) {
                        await this.#taskHistory.create({
                            taskId: taskId,
                            userId: data.userIdUpdated,
                            content: `${data.firstNameUser} (${data.rolActionUser}) eliminó a ${applicantName}`
                        });
                    }
                }
            }
        } else {
            // Crear nuevo applicant
            const existingStep = await TaskStep.findByPk(stepId, {
                transaction
            });
            if (!existingStep) {
                return hasChanges; // Retornar el estado actual de cambios
            }

            const newApplicant = await Applicant.create(
                {
                    status: applicantData.status || "pending",
                    statusDirector: applicantData.statusDirector || false,
                    statusColaborador: applicantData.statusColaborador || false,
                    statusRequest: applicantData.statusRequest || false,
                    taskStepId: existingStep.id,
                    taskId: taskId
                },
                { transaction }
            );

            hasChanges = true; // Crear nuevo applicant siempre es un cambio

            // Crear historial para nuevo applicant
            await this.#taskHistory.create({
                taskId: taskId,
                userId: data.userIdUpdated,
                content: `${data.firstNameUser} (${data.rolActionUser}) agregó un nuevo candidato`
            });

            // Crear nuevos taskfields de applicant
            if (applicantData.taskFields && Array.isArray(applicantData.taskFields)) {
                for (const fieldData of applicantData.taskFields) {
                    const taskField = await TaskField.create(
                        {
                            applicantId: newApplicant.id,
                            taskStepId: null,
                            label: fieldData.label,
                            directionMapOption: fieldData.directionMapOption,
                            type: fieldData.type,
                            required: fieldData.required,
                            options: fieldData.options,
                            isMultiple: fieldData.isMultiple,
                            limitFile: fieldData.limitFile,
                            order: fieldData.order,
                            text: fieldData.text,
                            showRequest: fieldData.showRequest || false,
                            placeHolder: fieldData.placeHolder,
                            fields: fieldData.fields
                        },
                        { transaction }
                    );

                    if (fieldData.values !== undefined && fieldData.values !== null) {
                        let valuesToProcess = fieldData.values;

                        // Normalizar valores
                        if (!Array.isArray(valuesToProcess)) {
                            valuesToProcess = [valuesToProcess];
                        }

                        for (const value of valuesToProcess) {
                            const valueNormalized = parseValueStringToValue(value);

                            if (valueNormalized !== "" && valueNormalized !== "null") {
                                await TaskFieldValue.create(
                                    {
                                        taskFieldId: taskField.id,
                                        taskId: taskId,
                                        value: valueNormalized
                                    },
                                    { transaction }
                                );
                            }
                        }
                    }
                }
            }
        }

        return hasChanges; // Retornar si hubo cambios en total
    }

    async cleanupApplicants(currentApplicants, taskId, transaction, stepId) {
        const allApplicantsOfStep = await Applicant.findAll({
            where: { taskId, taskStepId: stepId }
        });

        const currentApplicantIds = currentApplicants?.filter(applicant => applicant.id).map(applicant => applicant.id);

        const applicantsToDelete = allApplicantsOfStep.filter(
            dbApplicant => !currentApplicantIds.includes(dbApplicant.id)
        );

        for (const applicantToDelete of applicantsToDelete) {
            await Applicant.destroy({ where: { id: applicantToDelete.id }, transaction });
        }
    }

    //===============crear task
    processCreateStepsTask = async data => {
        const transaction = await sequelize.transaction();
        const { taskSteps, templateId, taskId } = data;

        try {
            const template = await TaskTemplate.findByPk(templateId);
            if (!template) throw new Error("Template not found");
            if (!taskSteps || !Array.isArray(taskSteps) || taskSteps.length === 0) {
                throw new Error("No task steps provided");
            }

            const taskFieldValues = [];
            for (const step of taskSteps) {
                const existingStep = await TaskStep.findByPk(step.id, { transaction });
                if (!existingStep) throw new Error(`Step with ID ${step.id} not found`);

                //proceso los fields del step
                if (step?.taskFields?.length > 0) {
                    const stepFieldValues = await this.processFieldValues(step.taskFields, taskId, transaction, null);
                    taskFieldValues.push(...stepFieldValues);
                }

                if (step?.applicants?.length > 0) {
                    for (const applicantData of step.applicants) {
                        // Crear el applicant
                        const applicant = await Applicant.create(
                            {
                                taskId: taskId,
                                taskStepId: step.id,
                                status: applicantData.status || "pending",
                                statusDirector: applicantData.statusDirector || false,
                                statusColaborador: applicantData.statusColaborador || false,
                                statusRequest: applicantData.statusRequest || false
                            },
                            { transaction }
                        );

                        // Desde el front me envian los applicant segun lo que haya mandado el director, entonces desde el front envian la cantidad.
                        // se crean los applicant y los fields de dentro de cada applicant
                        // y en el update se actualizaran los datos

                        if (applicantData?.taskFields?.length > 0) {
                            const applicantFieldValues = await this.processFieldValues(
                                applicantData.taskFields,
                                taskId,
                                transaction,
                                applicant.id
                            );

                            taskFieldValues.push(...applicantFieldValues);
                        }
                    }
                }
            }
            await transaction.commit();

            return {
                success: true,
                message: `Task created successfully. ID: ${taskId}`
            };
        } catch (error) {
            await transaction.rollback();
            console.error("Error in createTask:", error);
            throw error;
        }
    };

    processFieldValues = async (taskFields, taskId, transaction, applicantId = null) => {
        const fieldValues = [];

        for (const fieldData of taskFields) {
            // Verificar si el TaskField ya existe
            const whereConditions = {
                taskStepId: fieldData.taskStepId,
                label: fieldData.label,
                type: fieldData.type
            };

            // Si applicantId no es null, incluirlo en la búsqueda
            if (applicantId !== null) {
                whereConditions.applicantId = applicantId;
            } else {
                whereConditions.applicantId = null;
            }

            // Buscar si ya existe un TaskField con estas características
            const existingTaskField = await TaskField.findOne({
                where: whereConditions,
                transaction
            });

            let taskField;

            if (existingTaskField) {
                // Si existe, usar el existente
                taskField = existingTaskField;
            } else {
                // Si no existe, crear uno nuevo
                taskField = await TaskField.create(
                    {
                        applicantId: applicantId,
                        taskStepId: fieldData.taskStepId,
                        label: fieldData.label,
                        directionMapOption: fieldData.directionMapOption,
                        type: fieldData.type,
                        required: fieldData.required,
                        options: fieldData.options,
                        isMultiple: fieldData.isMultiple,
                        limitFile: fieldData.limitFile,
                        order: fieldData.order,
                        text: fieldData.text,
                        placeHolder: fieldData.placeHolder,
                        fields: fieldData.fields
                    },
                    { transaction }
                );
            }

            // Verificar si ya existe un TaskFieldValue para este campo y task
            const existingFieldValue = await TaskFieldValue.findOne({
                where: {
                    taskFieldId: taskField.id,
                    taskId: taskId
                },
                transaction
            });

            const valueToStore = parserValueToString(fieldData.values);

            // Crear el TaskFieldValue solo si hay valores válidos y no existe
            if (isValidStringValue(valueToStore) && !existingFieldValue) {
                const fieldValue = await TaskFieldValue.create(
                    {
                        taskFieldId: taskField.id,
                        taskId: taskId,
                        value: valueToStore
                    },
                    { transaction }
                );

                fieldValues.push(fieldValue);
            } else if (existingFieldValue) {
                // Si ya existe, actualizar el valor (incluso si es null para limpiar)
                await existingFieldValue.update(
                    {
                        value: valueToStore
                    },
                    { transaction }
                );

                console.log(`TaskFieldValue actualizado para el campo: ${fieldData.label}`);
                fieldValues.push(existingFieldValue);
            }
        }

        return fieldValues;
    };
    //===============
    async taskNotifications(
        data,
        previousUserIds,
        previousPriority,
        previousStatus,
        task,
        id,
        operationType = "update"
    ) {
        try {
            // Obtener los nuevos userIds

            let newUserIds = [];
            if (Array.isArray(data.userIds)) {
                newUserIds = data.userIds;
            } else if (typeof data.userIds === "string") {
                try {
                    newUserIds = JSON.parse(data.userIds);
                } catch (e) {
                    newUserIds = [];
                }
            }

            // Detectar cambios específicos (solo para UPDATE)
            const membersChanged =
                operationType === "update" &&
                JSON.stringify(previousUserIds.sort()) !== JSON.stringify(newUserIds.sort());
            const priorityChanged = operationType === "update" && previousPriority !== data.priority;
            const statusChanged = operationType === "update" && previousStatus !== data.status;

            const taskName =
                `${data.taskTemplate?.title || data.taskTemplateName || ""} | ${data.description}`.trim() || "Tarea";
            const taskNumber = data.id || task?.id;

            let changeType;

            if (operationType === "create") {
                changeType = "TASK_CREATED";
            } else if (membersChanged) {
                changeType = "MEMBERS_CHANGED";
            } else if (priorityChanged) {
                changeType = "PRIORITY_CHANGED";
            } else if (statusChanged) {
                changeType = "STATUS_CHANGED";
            } else {
                changeType = "OTHER_CHANGED";
            }

            // Configurar notificaciones para usuarios asignados
            let usersToNotify = [];
            let notificationMessage = "";

            switch (changeType) {
                case "TASK_CREATED":
                    // Notificar a todos los usuarios asignados
                    usersToNotify = newUserIds.filter(userId => userId !== data.userIdCreated);
                    notificationMessage = `<strong>${data.firstNameUser}</strong> te asignó la tarea <strong>"${taskName}"</strong>`;
                    break;

                case "MEMBERS_CHANGED":
                    // Notificar a usuarios nuevos que fueron asignados
                    const newlyAssignedUsers = newUserIds.filter(
                        userId => !previousUserIds.includes(userId) && userId !== data.userId
                    );

                    if (newlyAssignedUsers.length > 0) {
                        usersToNotify = newlyAssignedUsers;
                        notificationMessage = `<strong>${data.firstNameUser}</strong> te asignó una nueva tarea - <strong>"${taskName}"</strong>`;
                    }
                    break;

                case "PRIORITY_CHANGED":
                    // Notificar a todos los miembros actuales sobre cambio de prioridad
                    usersToNotify = newUserIds.filter(userId => userId !== data.userId);
                    notificationMessage = `<strong>${data.firstNameUser}</strong> cambió la prioridad de la tarea <strong>"${taskName}"</strong> de <strong>${previousPriority}</strong> a <strong>${data.priority}</strong>`;
                    break;

                case "STATUS_CHANGED":
                    // Notificar a todos los miembros actuales sobre cambio de status
                    usersToNotify = newUserIds.filter(userId => userId !== data.userId);
                    if (data.userIdUpdated != task.userIdCreated) {
                        usersToNotify.push(task.userIdCreated);
                    }
                    notificationMessage = `<strong>${
                        data.firstNameUser
                    }</strong> cambió el estado de la tarea <strong>"${taskName}"</strong> de <strong>${previousStatus.replace(
                        "-",
                        " "
                    )}</strong> a <strong>${data.status.replace("-", " ")}</strong>`;
                    break;

                default:
                    // // Para cualquier otra actualización, mensaje genérico
                    // usersToNotify = newUserIds.filter(userId => userId !== data.userId);
                    // if (data.userIdUpdated != task.userIdCreated) {
                    //     usersToNotify.push(task.userIdCreated);
                    // }
                    // notificationMessage = `<strong>${data.firstNameUser}</strong> actualizó la tarea <strong>"${taskName}"</strong>`;
                    break;
            }

            // Enviar notificaciones a usuarios asignados
            if (usersToNotify.length > 0 && notificationMessage) {
                await Promise.all(
                    usersToNotify.map(async userId => {
                        microserviceSocket.emit("receiveNotification", {
                            userId: data.userId || data.userIdCreated,
                            departmentId: null,
                            userIdReceive: userId,
                            content: notificationMessage,
                            type: "redirect",
                            urlRedirect: `/panel/tareas-rrhh`,
                            isForAdmin: false,
                            metadata: JSON.stringify({ taskId: taskNumber })
                        });

                        return notification;
                    })
                );
            }
        } catch (notificationError) {
            console.error("Error al enviar notificaciones de actualización:", notificationError);
            // No fallar la respuesta por errores de notificación
        }
    }
}

module.exports = Task;

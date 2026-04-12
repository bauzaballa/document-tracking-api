const {
    Requests,
    Tasks,
    TaskTemplate,
    TaskStep,
    TaskField,
    TaskFieldValue,
    Applicant,
    ObservationApplicant
} = require("../../database/db");
const apiAuth = require("../utils/apiAuth");
const uploadToS3 = require("../middlewares/uploadToS3");
const { parseValueStringToValue } = require("../utils/parserValueToString");
const microserviceSocket = require("../services/sockets.services");

class Request {
    constructor() {}

    /**
     * Create new request to a department
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    create = async (req, res) => {
        try {
            const data = req.body;

            const directorsRes = await apiAuth.get("/department/get-directors", {
                params: { departmentId: data.departmentId }
            });

            const directorUsers = directorsRes?.data?.users || [];
            const receiverUserId = directorUsers.length > 0 ? directorUsers[0].id : null;

            const newRequestData = {
                title: data.title,
                departmentId: data.departmentId,
                requestedByDepartmentId: data.requestedByDepartmentId,
                unitId: data.unitId,
                formId: data.formId,
                priority: data.priority.toLocaleLowerCase(),
                content: data.content,
                formResponse: data.formResponse,
                receiverUserId: receiverUserId,
                createdByUserId: data.userId,
                timeline: {},
                status: "pendiente",
                branchId: data.branchId
            };

            const result = await Requests.create(newRequestData);

            const requesterDeptRes = await apiAuth.get("/department/get-department", {
                params: { departmentId: data.requestedByDepartmentId }
            });

            const requesDirectorRecive = await apiAuth.get(
                `/user/get-all-users?departmentId=${data.departmentId}&role=director`
            );

            const deptName = requesterDeptRes?.data?.name || "Departamento";

            requesDirectorRecive?.data?.rows.forEach(async director => {
                microserviceSocket.emit("receiveNotification", {
                    userId: data.userId,
                    departmentId: data.departmentId,
                    userIdReceive: director.id,
                    content: `<strong>Dirección de ${deptName}</strong> envió una <strong>nueva solicitud</strong>.`,
                    type: "redirect",
                    urlRedirect: `/panel/solicitudes?requestId=${result.id}`,
                    isForAdmin: false,
                    metadata: { requestId: result.id, comment: true }
                });
            });

            if (data.branchId) {
                const branchs = await apiAuth.get("/branch/get-all");
                let branchName = branchs?.data.filter(branch => branch.id === data.branchId)?.name || null;
                result.branchName = branchName;
            }

            microserviceSocket.emit("updateTable", {});
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ error: error.message || "Error interno" });
        }
    };

    /**
     * Send message
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    sendMessage = async (req, res) => {
        try {
            const data = req.body;

            const request = await Requests.findOne({
                where: { id: data.requestId },
                attributes: ["timeline"]
            });

            let timeline = request.timeline;
            if (!Array.isArray(timeline)) {
                try {
                    timeline = JSON.parse(timeline);
                } catch (error) {
                    timeline = [];
                }
            }

            const lastId = timeline.length > 0 ? Math.max(...timeline.map(event => event.id || 0)) : 0;
            const newId = lastId + 1;

            const newEvent = {
                id: newId,
                title: data.title,
                content: data.content,
                date: new Date()
            };

            timeline.unshift(newEvent);

            const result = await Requests.update(
                { timeline: JSON.stringify(timeline) },
                { where: { id: data.requestId } }
            );

            res.status(200).send(result);
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    };

    /**
     * Finish a request
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    finishRequest = async (req, res) => {
        try {
            const data = req.body;

            const request = await Requests.findOne({
                where: { id: data.requestId }
            });

            if (request.isCompleted) {
                res.sendStatus(405);
                return;
            }

            let timeline = request.timeline;
            if (!Array.isArray(timeline)) {
                try {
                    timeline = JSON.parse(timeline);
                } catch (error) {
                    timeline = [];
                }
            }

            const lastId = timeline.length > 0 ? Math.max(...timeline.map(event => event.id || 0)) : 0;
            const newId = lastId + 1;

            const newEvent = {
                id: newId,
                title: "Tarea finalizada",
                content: "",
                date: new Date()
            };

            timeline.unshift(newEvent);

            const result = await Requests.update(
                {
                    timeline: JSON.stringify(timeline),
                    isCompleted: true,
                    status: "finalizada"
                },
                {
                    where: { id: data.requestId }
                }
            );
            microserviceSocket.emit("receiveNotification", {
                userId: request.receiverUserId,
                departmentId: request.departmentId,
                userIdReceive: request.createdByUserId,
                content: `La solicitud <strong>#${request.id}</strong> fue finalizada.`,
                type: "redirect",
                urlRedirect: `/panel/tareas/area/${request.departmentId}/empleado/${request.userId}?requestId=${request.id}`,
                isForAdmin: false
            });

            microserviceSocket.emit("updateTable", {});
            res.status(200).send(result);
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    };

    /**
     * Decline a request
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    declineRequest = async (req, res) => {
        try {
            const { requestId } = req.body;

            const request = await Requests.findOne({
                where: { id: requestId }
            });

            if (request.isCompleted) {
                return res.sendStatus(405);
            }

            let timeline;
            try {
                if (Array.isArray(request.timeline)) {
                    timeline = request.timeline;
                } else if (typeof request.timeline === "string") {
                    timeline = JSON.parse(request.timeline);
                } else {
                    timeline = [];
                }
            } catch (err) {
                timeline = [];
            }

            const newId = timeline.length ? Math.max(...timeline.map(e => e.id || 0)) + 1 : 1;

            timeline.unshift({
                id: newId,
                title: "Solicitud rechazada",
                content: "",
                date: new Date()
            });

            await Requests.update(
                {
                    timeline: JSON.stringify(timeline),
                    isCompleted: true,
                    status: "rechazada"
                },
                {
                    where: { id: requestId }
                }
            );
            microserviceSocket.emit("receiveNotification", {
                userId: request.receiverUserId,
                departmentId: request.departmentId,
                userIdReceive: request.createdByUserId,
                content: `La solicitud <strong>#${requestId}</strong> fue rechazada.`,
                type: "redirect",
                urlRedirect: `/panel/tareas/area/${request.departmentId}/empleado/${request.userId}?requestId=${request.id}`,
                isForAdmin: false
            });

            microserviceSocket.emit("updateTable", {});
            res.status(200).send({ success: true });
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    };

    /**
     * Accept a request
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    acceptRequest = async (req, res) => {
        try {
            const { requestId } = req.body;

            const request = await Requests.findOne({
                where: { id: requestId }
            });

            if (!request || request.isCompleted || request.status !== "pendiente") {
                return res.sendStatus(405);
            }

            let timeline = [];

            try {
                timeline = Array.isArray(request.timeline) ? request.timeline : JSON.parse(request.timeline || "[]");
            } catch {
                timeline = [];
            }

            const newId = timeline.length ? Math.max(...timeline.map(e => e.id || 0)) + 1 : 1;

            timeline.unshift({
                id: newId,
                title: "Solicitud aceptada",
                content: "",
                date: new Date()
            });

            await Requests.update(
                {
                    timeline: JSON.stringify(timeline),
                    status: "aceptada"
                },
                {
                    where: { id: requestId }
                }
            );

            microserviceSocket.emit("receiveNotification", {
                userId: request.receiverUserId,
                departmentId: request.departmentId,
                userIdReceive: request.createdByUserId,
                content: `La solicitud <strong>#${requestId}</strong> fue aceptada`,
                type: "redirect",
                urlRedirect: `/panel/tareas/area/${request.departmentId}/empleado/${request.userId}?requestId=${request.id}`,
                isForAdmin: false
            });

            microserviceSocket.emit("updateTable", {});
            res.status(200).send({ success: true });
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    };

    /**
     * Get requests with filter type
     *
     * @param {import("express").Request} req - Express resquest
     * @param {import("express").Response} res - Express response
     */
    getRequestsByType = async (req, res) => {
        try {
            const data = req.query;

            // Validar departmentId requerido
            if (!data.departmentId) {
                return res.status(400).send({ error: "departmentId is required" });
            }

            // Validar parámetros de paginación
            const page = Math.max(1, parseInt(data.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(data.limit) || 10)); // Límite máximo de 100
            const offset = (page - 1) * limit;

            const whereClause = {};

            if (data.type === "sent") {
                whereClause.requestedByDepartmentId = data.departmentId;
            } else {
                whereClause.departmentId = data.departmentId;
            }

            // Opcional: filtrar por status si viene en los query params
            if (data.status) {
                whereClause.status = data.status;
            }

            // Opcional: filtrar por priority si viene en los query params
            if (data.priority) {
                whereClause.priority = data.priority;
            }

            // Obtener el total de registros
            const totalCount = await Requests.count({
                where: whereClause
            });

            // Obtener los registros paginados
            const result = await Requests.findAll({
                where: whereClause,
                attributes: [
                    "id",
                    "title",
                    "priority",
                    "unitId",
                    "status",
                    "createdAt",
                    "isCompleted",
                    "departmentId",
                    "requestedByDepartmentId",
                    "createdByUserId",
                    "branchId"
                ],
                include: [
                    {
                        association: "form",
                        attributes: ["id", "title", "description", "unit"]
                    }
                ],
                order: [["createdAt", "DESC"]],
                limit: limit,
                offset: offset
            });

            // Para cada request, obtener los directores y el unit name
            const requestsWithDirectors = await Promise.all(
                result.map(async request => {
                    let requestDirectorTo = [];
                    let requestDirectorFrom = [];
                    let unitName = null;
                    let branchName = null;

                    try {
                        // Obtener directores del departmentId (destino)
                        if (request.departmentId) {
                            const directorToResponse = await apiAuth.get(
                                `/user/get-all-users?departmentId=${request.departmentId}&role=director`
                            );
                            requestDirectorTo = directorToResponse.data.rows;
                        }

                        // Obtener directores del requestedByDepartmentId (origen)
                        if (request.requestedByDepartmentId) {
                            const directorFromResponse = await apiAuth.get(
                                `/user/get-all-users?departmentId=${request.requestedByDepartmentId}&role=director`
                            );
                            requestDirectorFrom = directorFromResponse.data.rows;
                        }

                        // Obtener el unit name
                        if (request.form && request.form.unit) {
                            const unitResponse = await apiAuth.get("/unit/get-all");
                            const unitFilter = unitResponse.data.find(u => u.id === request.unitId);
                            unitName = unitFilter?.name || null;
                        }

                        // Obtener el branch name
                        if (request.branchId) {
                            const branchs = await apiAuth.get("/branch/get-all");

                            let branchNameFound =
                                branchs?.data?.find(branch => branch.id === request.branchId)?.name || null;

                            branchName = branchNameFound;
                        }
                    } catch (error) {
                        console.log(`Error fetching data for request ${request.id}:`, error);
                    }

                    return {
                        ...request.toJSON(),
                        requestDirectorFrom,
                        requestDirectorTo,
                        unitName,
                        branchName
                    };
                })
            );

            // Calcular metadata
            const totalPages = Math.ceil(totalCount / limit);

            res.status(200).send({
                data: requestsWithDirectors,
                pagination: {
                    totalItems: totalCount,
                    totalPages: totalPages,
                    currentPage: page,
                    pageSize: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    nextPage: page < totalPages ? page + 1 : null,
                    prevPage: page > 1 ? page - 1 : null
                }
            });
        } catch (error) {
            console.error("Error in getRequestsByType:", error);
            res.status(500).send({
                error: "Internal server error",
                message: error.message
            });
        }
    };

    getRequestsById = async (req, res) => {
        try {
            const { id } = req.params;

            // Primero obtener el request para saber el taskId
            const request = await Requests.findByPk(id, {
                include: [
                    {
                        association: "form",
                        attributes: ["id", "title", "description", "unit"]
                    },
                    {
                        model: Tasks,
                        as: "task",
                        attributes: ["id"]
                    }
                ]
            });

            if (!request) {
                return res.status(404).send({ message: "Request no encontrado" });
            }

            const taskId = request.task?.id;

            //============ UNIDAD ============
            if (!taskId) {
                let unitName = null;

                try {
                    const unit = await apiAuth.get("/unit/get-all");
                    const unitFilter = unit.data.find(u => u.id === request.unitId);
                    unitName = unitFilter?.name || null;
                } catch (error) {
                    console.warn("Error al obtener unit:", error);
                    unitName = null;
                }
                request.dataValues.unitName = unitName;

                //========= Director FROM Y TO ========
                let requestDirectorTo = [];
                let requestDirectorFrom = [];
                try {
                    // Obtener directores del departmentId (destino)
                    if (request.departmentId) {
                        const directorToResponse = await apiAuth.get(
                            `/user/get-all-users?departmentId=${request.departmentId}&role=director`
                        );
                        requestDirectorTo = directorToResponse.data.rows;
                    }

                    // Obtener directores del requestedByDepartmentId (origen)
                    if (request.requestedByDepartmentId) {
                        const directorFromResponse = await apiAuth.get(
                            `/user/get-all-users?departmentId=${request.requestedByDepartmentId}&role=director`
                        );
                        requestDirectorFrom = directorFromResponse.data.rows;
                    }
                } catch (error) {
                    console.log(`Error fetching data for request ${request.id}:`, error);
                }

                request.dataValues.requestDirectorFrom = requestDirectorFrom;
                request.dataValues.requestDirectorTo = requestDirectorTo;

                let branchName = null;
                if (request.branchId) {
                    const branchs = await apiAuth.get("/branch/get-all");
                    let branchNameFound = branchs?.data?.find(branch => branch.id === request.branchId)?.name || null;

                    branchName = branchNameFound;
                }
                request.dataValues.branchName = branchName;
                return res.status(200).send(request);
            }

            // Ahora obtener los datos completos con el taskId real
            const result = await Requests.findByPk(id, {
                include: [
                    {
                        association: "form",
                        attributes: ["id", "title", "description", "unit"]
                    },
                    {
                        model: Tasks,
                        as: "task",
                        required: false,
                        include: [
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
                                                        where: { taskId }
                                                    }
                                                ]
                                            },
                                            {
                                                model: Applicant,
                                                as: "applicants",
                                                required: false,
                                                where: { taskId: taskId },
                                                include: [
                                                    {
                                                        model: TaskField,
                                                        as: "taskFields",
                                                        include: [
                                                            {
                                                                model: TaskFieldValue,
                                                                as: "values",
                                                                required: false,
                                                                where: { taskId }
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
                    }
                ],
                order: [["createdAt", "DESC"]]
            });

            // Obtener todos los usuarios
            const responseUsers = await apiAuth.get("/user/get-all-users");
            const allUsers = responseUsers.data.rows;

            // Extraer todos los userIds únicos de las observaciones
            const observationUserIds = new Set();

            // Recorrer toda la estructura para encontrar las observaciones
            if (result.task && result.task.taskTemplate && result.task.taskTemplate.taskSteps) {
                result.task.taskTemplate.taskSteps.forEach(step => {
                    if (step.applicants) {
                        step.applicants.forEach(applicant => {
                            if (applicant.observations) {
                                applicant.observations.forEach(observation => {
                                    if (observation.userId) {
                                        observationUserIds.add(observation.userId);
                                    }
                                });
                            }
                        });
                    }
                });
            }

            // Convertir el Set a array
            const uniqueUserIds = Array.from(observationUserIds);

            // Buscar información de usuarios que crearon observaciones
            const observationUsers = allUsers
                .filter(user => uniqueUserIds.includes(user.id))
                .map(user => ({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    avatarUrl: user.avatarUrl
                }));

            // Agregar la información de usuarios a las observaciones
            if (result.task && result.task.taskTemplate && result.task.taskTemplate.taskSteps) {
                result.task.taskTemplate.taskSteps.forEach(step => {
                    if (step.applicants) {
                        step.applicants.forEach(applicant => {
                            if (applicant.observations) {
                                applicant.observations.forEach(observation => {
                                    // Encontrar el usuario correspondiente a esta observación
                                    const userInfo = observationUsers.find(user => user.id === observation.userId);
                                    //observation.userDetail = userInfo  null;
                                    observation.dataValues.userDetail = userInfo;
                                });
                            }
                        });
                    }
                });
            }

            // Opcional: también mantener la información de usuarios asignados si la necesitas
            let taskUserIds = await parseValueStringToValue(result.task.userIds);
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
            result.userDetail = assignedUsers;

            //============ UNIDAD ============
            let unitName = null;

            try {
                const unit = await apiAuth.get("/unit/get-all");
                const unitFilter = unit.data.find(u => u.id === request.unitId);
                unitName = unitFilter?.name || null;
            } catch (error) {
                console.warn("Error al obtener unit:", error);
                unitName = null;
            }
            result.dataValues.unitName = unitName;

            //========= Director FROM Y TO ========

            let requestDirectorTo = [];
            let requestDirectorFrom = [];
            try {
                // Obtener directores del departmentId (destino)
                if (request.departmentId) {
                    const directorToResponse = await apiAuth.get(
                        `/user/get-all-users?departmentId=${request.departmentId}&role=director`
                    );
                    requestDirectorTo = directorToResponse.data.rows;
                }

                // Obtener directores del requestedByDepartmentId (origen)
                if (request.requestedByDepartmentId) {
                    const directorFromResponse = await apiAuth.get(
                        `/user/get-all-users?departmentId=${request.requestedByDepartmentId}&role=director`
                    );
                    requestDirectorFrom = directorFromResponse.data.rows;
                }
            } catch (error) {
                console.log(`Error fetching data for request ${request.id}:`, error);
            }

            // ========= BRANCHNAME =========
            let branchName = null;
            if (request.branchId) {
                const branchs = await apiAuth.get("/branch/get-all");
                let branchNameFound = branchs?.data?.find(branch => branch.id === request.branchId)?.name || null;

                branchName = branchNameFound;
            }

            result.dataValues.requestDirectorFrom = requestDirectorFrom;
            result.dataValues.requestDirectorTo = requestDirectorTo;
            result.dataValues.branchName = branchName;
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send(error);
            console.log(error);
        }
    };

    /**
     * Upload files to s3 when requesting
     */
    uploadFile = async (req, res) => {
        try {
            const { file, fileName } = req.body;
            if (!file || !fileName) {
                return res.status(400).json({ error: "Falta archivo o nombre" });
            }

            const url = await uploadToS3("RequestFiles", file, fileName);
            return res.status(200).json({ fileUrl: url });
        } catch (error) {
            console.error("❌ Error al subir archivo:", error);
            return res.status(500).json({ error: "Error interno al subir archivo" });
        }
    };
}

module.exports = Request;

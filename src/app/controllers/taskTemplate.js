const { TaskStep, TaskTemplate, TaskField, Applicant, Tasks } = require("@/database/db");
const { sequelize } = require("@/database/models");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

class TasksTemplate {
    constructor() {}

    // ========== CRUD OPERATIONS ==========

    createTemplate = async (req, res) => {
        try {
            const { title = "", taskSteps = [], subarea } = req.body || {};

            if (!title) {
                return res.status(400).json({ error: "Missing required fields", missing: "title" });
            }

            const taskTemplate = await TaskTemplate.create({ title, subarea });

            if (taskSteps.length > 0) {
                for (const [stepIndex, step] of taskSteps.entries()) {
                    const createdStep = await TaskStep.create({
                        title: step.title || `Paso ${stepIndex + 1}`,
                        subTitle: step.subTitle,
                        typeStep: step.type,
                        taskTemplateId: taskTemplate.id,
                        order: stepIndex + 1
                    });

                    // Procesar TaskStep.taskFields
                    if (Array.isArray(step.taskFields) && step.taskFields.length > 0) {
                        const fieldsToCreate = await this.processFields(step.taskFields, createdStep.id);
                        await TaskField.bulkCreate(fieldsToCreate);
                    }

                    // Procesar campos de TaskStep.applicant.taskFields
                    if (Array.isArray(step.applicant) && step.applicant.length > 0) {
                        const createdApplicant = await Applicant.create({
                            id: uuidv4(),
                            status: "pending",
                            taskStepId: createdStep.id
                        });

                        const applicantFieldsToCreate = await this.processFields(
                            step.applicant,
                            createdStep.id,
                            createdApplicant.id
                        );
                        await TaskField.bulkCreate(applicantFieldsToCreate);
                    }
                }
            } else {
                await TaskStep.create({
                    title: "Paso 1",
                    taskTemplateId: taskTemplate.id,
                    order: 1
                });
            }

            res.status(200).json({ message: "Template created successfully", taskTemplate });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error", details: error.message });
        }
    };

    updateTemplate = async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const { id } = req.params;
            const { taskSteps, title, subarea } = req.body;

            const template = await TaskTemplate.findByPk(id, { transaction });
            if (!template) {
                await transaction.rollback();
                return res.status(404).send({ error: "Template not found" });
            }

            if (title) {
                await template.update({ title, subarea }, { transaction });
            }

            if (taskSteps && Array.isArray(taskSteps)) {
                const existingSteps = await TaskStep.findAll({ where: { taskTemplateId: id }, transaction });
                const existingStepsMap = new Map(existingSteps.map(step => [step.id, step]));
                const stepsToKeep = [];

                for (const [stepIndex, step] of taskSteps.entries()) {
                    let currentStep;
                    const stepData = {
                        title: step.title || `Paso ${stepIndex + 1}`,
                        typeStep: step.type,
                        order: step.order || stepIndex + 1
                    };

                    if (step.id && existingStepsMap.has(step.id)) {
                        currentStep = existingStepsMap.get(step.id);
                        await currentStep.update(stepData, { transaction });
                        stepsToKeep.push(step.id);
                    } else {
                        currentStep = await TaskStep.create({ ...stepData, taskTemplateId: id }, { transaction });
                        stepsToKeep.push(currentStep.id);
                    }

                    // Procesar campos normales
                    if (step.taskFields && Array.isArray(step.taskFields) && step.taskFields.length > 0) {
                        try {
                            await this.processFieldsForUpdate(currentStep.id, step.taskFields, false, transaction);
                        } catch (error) {
                            await transaction.rollback();
                            return res.status(400).json({
                                success: false,
                                error: "Error processing taskFields",
                                message: error.message
                            });
                        }
                    }

                    // Procesar applicants y sus campos (DESCOMENTADO Y CORREGIDO)
                    if (step.applicants && Array.isArray(step.applicants) && step.applicants.length > 0) {
                        try {
                            await this.processApplicantsForUpdate(currentStep.id, step.applicants, transaction);
                        } catch (error) {
                            await transaction.rollback();
                            return res.status(400).json({
                                success: false,
                                error: "Error processing applicants",
                                message: error.message
                            });
                        }
                    }
                }

                // Eliminar steps que ya no existen
                await TaskStep.destroy({
                    where: {
                        taskTemplateId: id,
                        id: stepsToKeep.length > 0 ? { [Op.notIn]: stepsToKeep } : {}
                    },
                    transaction
                });
            }

            await transaction.commit();

            const updatedTemplate = await TaskTemplate.findByPk(id, {
                include: [
                    {
                        model: TaskStep,
                        as: "taskSteps",
                        include: [
                            {
                                model: TaskField,
                                as: "taskFields",
                                where: { applicantId: null }
                            },
                            {
                                model: Applicant,
                                as: "applicants",
                                include: [
                                    {
                                        model: TaskField,
                                        as: "taskFields"
                                    }
                                ]
                            }
                        ],
                        order: [["order", "ASC"]]
                    }
                ]
            });

            // Parsear los campos JSON después de obtener los datos

            if (updatedTemplate.taskSteps) {
                updatedTemplate.taskSteps.forEach(step => {
                    if (step.taskFields) {
                        step.taskFields = this.parseFields(step.taskFields);
                    }

                    if (step.applicants) {
                        step.applicants.forEach(applicant => {
                            if (applicant.taskFields) {
                                applicant.taskFields = this.parseFields(applicant.taskFields);
                            }
                        });
                    }
                });
            }

            res.status(200).json({
                success: true,
                message: "Template updated successfully",
                data: updatedTemplate
            });
        } catch (error) {
            await transaction.rollback();
            console.error("Error updating template:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                message: error.message
            });
        }
    };

    getTemplates = async (req, res) => {
        try {
            const templates = await TaskTemplate.findAll({ order: [["title", "ASC"]] });
            res.status(200).json(templates);
        } catch (error) {
            console.error("Error fetching templates:", error);
            res.status(500).send({ error: "Internal server error" });
        }
    };

    getTemplateById = async (req, res) => {
        try {
            const { id } = req.params;

            const template = await TaskTemplate.findOne({
                where: { id },
                include: [
                    {
                        model: TaskStep,
                        as: "taskSteps",
                        include: [
                            {
                                model: TaskField,
                                as: "taskFields"
                            }
                        ]
                    }
                ]
            });

            if (!template) return res.status(404).send({ error: "Template not found" });

            // Parsear los campos de todos los niveles
            if (template.taskSteps) {
                template.taskSteps.forEach(step => {
                    if (step.taskFields) {
                        step.taskFields = this.parseFields(step.taskFields);
                    }

                    if (step.applicants) {
                        step.applicants.forEach(applicant => {
                            if (applicant.taskFields) {
                                applicant.taskFields = this.parseFields(applicant.taskFields);
                            }
                        });
                    }
                });
            }

            res.status(200).json(template);
        } catch (error) {
            console.error("Error fetching template:", error);
            res.status(500).send({ error: "Internal server error" });
        }
    };

    deleteTemplate = async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const { id } = req.params;

            const template = await TaskTemplate.findByPk(id, { transaction });
            if (!template) {
                await transaction.rollback();
                return res.status(404).json({ error: "Template not found" });
            }

            const tasksUsingTemplate = await Tasks.findAll({
                where: { taskTemplateId: id },
                attributes: ["id"],
                transaction
            });

            if (tasksUsingTemplate.length > 0) {
                await transaction.rollback();
                return res.status(400).json({
                    error: "Cannot delete template",
                    message: "No se puede eliminar, plantilla ya usada por una tarea"
                });
            }

            const steps = await TaskStep.findAll({
                where: { taskTemplateId: id },
                attributes: ["id"],
                transaction
            });

            const stepIds = steps.map(step => step.id);

            if (stepIds.length > 0) {
                const applicants = await Applicant.findAll({
                    where: { taskStepId: stepIds },
                    attributes: ["id"],
                    transaction
                });

                const applicantIds = applicants.map(applicant => applicant.id);

                if (applicantIds.length > 0) {
                    await TaskField.destroy({ where: { applicantId: applicantIds }, transaction });
                    await Applicant.destroy({ where: { id: applicantIds }, transaction });
                }

                await TaskField.destroy({
                    where: { taskStepId: stepIds, applicantId: null },
                    transaction
                });

                await TaskStep.destroy({ where: { id: stepIds }, transaction });
            }

            await template.destroy({ transaction });
            await transaction.commit();

            res.status(200).json({ message: "Template deleted successfully" });
        } catch (error) {
            await transaction.rollback();
            console.error("Error deleting template:", error);
            res.status(500).json({ error: "Internal server error", details: error.message });
        }
    };

    // ========== FUNCIONES COMPARTIDAS ==========
    processFields = async (fields, parentStepId = null, applicantId = null) => {
        const fieldsToCreate = [];

        for (const field of fields) {
            const fieldData = {
                label: field.label || null,
                type: field.type,
                placeHolder: field.placeHolder,
                required: field.required || false,
                options: field.options ? JSON.stringify(field.options) : null,
                text: field.text || null,
                order: field.order || 0,
                showRequest: field.showRequest || false,
                taskStepId: applicantId ? null : parentStepId,
                applicantId: applicantId || null,
                value: ""
            };

            // Procesar campos anidados
            if ((field.type === "grupo-texto-corto" || field.type === "grupo") && Array.isArray(field.fields)) {
                const subFields = await this.processFields(field.fields, parentStepId, applicantId);
                fieldData.fields = JSON.stringify(
                    subFields.map(subField => {
                        const { taskStepId, applicantId, ...rest } = subField;
                        return rest;
                    })
                );
            }

            fieldsToCreate.push(fieldData);
        }

        return fieldsToCreate;
    };

    processFieldsForUpdate = async (parentId, fields, isApplicant = false, transaction = null) => {
        try {
            // Validaciones robustas
            if (!parentId) {
                throw new Error("parentId es requerido");
            }

            if (!fields) {
                throw new Error("fields es requerido");
            }

            if (!Array.isArray(fields)) {
                throw new Error("fields debe ser un array");
            }

            const whereCondition = isApplicant
                ? { applicantId: parentId }
                : { taskStepId: parentId, applicantId: null };

            // Usar la transacción existente, no crear una nueva
            const existingFields = await TaskField.findAll({
                where: whereCondition,
                transaction,
                order: [["order", "ASC"]]
            });

            const existingFieldsMap = new Map(
                existingFields.map(field => {
                    const fieldObj = field.dataValues ? field.dataValues : field;
                    return [fieldObj.id, field];
                })
            );

            const fieldsToKeep = [];

            for (const [index, field] of fields.entries()) {
                // Validar campo mínimo
                if (!field || typeof field !== "object") {
                    throw new Error(`Campo en posición ${index} no es un objeto válido`);
                }

                if (!field.label || !field.type) {
                    throw new Error(`Campo en posición ${index} falta label o type`);
                }

                // Validar que field.fields sea array si existe
                if (field.fields && !Array.isArray(field.fields)) {
                    throw new Error(`field.fields en posición ${index} debe ser un array`);
                }

                // Procesar campos anidados recursivamente si existen
                let processedNestedFields = null;

                if (field.fields && Array.isArray(field.fields)) {
                    processedNestedFields = JSON.stringify(field.fields);
                }

                const fieldData = {
                    label: field.label,
                    type: field.type,
                    required: Boolean(field.required),
                    options: field.options ? JSON.stringify(field.options) : null,
                    text: field.text || null,
                    placeHolder: field.placeHolder || null,
                    order: field.order !== undefined ? field.order : index,
                    directionMapOption: field.directionMapOption || null,
                    isMultiple: Boolean(field.isMultiple),
                    showRequest: Boolean(field.showRequest),
                    limitFile: field.limitFile || null,
                    fields: processedNestedFields || null
                };

                if (isApplicant) {
                    fieldData.applicantId = parentId;
                } else {
                    fieldData.taskStepId = parentId;
                }

                if (field.id && existingFieldsMap.has(field.id)) {
                    // Actualizar campo existente
                    const existingField = existingFieldsMap.get(field.id);
                    await existingField.update(fieldData, { transaction });
                    fieldsToKeep.push(field.id);

                    // Remover del mapa para evitar procesamiento duplicado
                    existingFieldsMap.delete(field.id);
                } else {
                    // Crear nuevo campo
                    const newField = await TaskField.create(fieldData, { transaction });
                    fieldsToKeep.push(newField.id);
                }
            }

            // Eliminar campos que ya no existen (los que quedaron en el mapa)
            const fieldsToDelete = Array.from(existingFieldsMap.keys());
            if (fieldsToDelete.length > 0) {
                await TaskField.destroy({
                    where: {
                        id: { [Op.in]: fieldsToDelete }
                    },
                    transaction
                });
            }

            return { success: true, message: "Campos procesados correctamente" };
        } catch (error) {
            console.error("Error en processFieldsForUpdate:", error);
            throw error;
        }
    };

    processApplicantsForUpdate = async (taskStepId, applicants, transaction = null) => {
        try {
            const existingApplicants = await Applicant.findAll({
                where: { taskStepId },
                transaction
            });

            const existingApplicantsMap = new Map(existingApplicants.map(app => [app.id, app]));
            const applicantsToKeep = [];

            for (const [index, applicant] of applicants.entries()) {
                let currentApplicant;
                const applicantData = {
                    status: applicant.status || "pending",
                    order: applicant.order || index + 1
                };

                if (applicant.id && existingApplicantsMap.has(applicant.id)) {
                    currentApplicant = existingApplicantsMap.get(applicant.id);
                    await currentApplicant.update(applicantData, { transaction });
                    applicantsToKeep.push(applicant.id);
                } else {
                    currentApplicant = await Applicant.create(
                        {
                            ...applicantData,
                            taskStepId
                        },
                        { transaction }
                    );
                    applicantsToKeep.push(currentApplicant.id);
                }

                // Procesar campos del applicant
                if (Array.isArray(applicant.taskFields) && applicant.taskFields.length > 0) {
                    await this.processFieldsForUpdate(
                        currentApplicant.id, // ← parentId es el applicantId
                        applicant.taskFields,
                        true, // ← isApplicant = true
                        transaction
                    );
                }
            }

            // Eliminar applicants que ya no existen
            await Applicant.destroy({
                where: {
                    taskStepId,
                    id: { [Op.notIn]: applicantsToKeep }
                },
                transaction
            });
        } catch (error) {
            console.error("Error in processApplicantsForUpdate:", error);
            throw error;
        }
    };

    parseFields = fields => {
        return fields.map(field => {
            if (field.options && typeof field.options === "string") {
                try {
                    field.options = JSON.parse(field.options);
                } catch (error) {
                    console.warn(`Error parsing options for field ${field.id}:`, error);
                    field.options = null;
                }
            }

            if (field.fields && typeof field.fields === "string") {
                try {
                    field.fields = JSON.parse(field.fields);
                    if (Array.isArray(field.fields)) {
                        field.fields = this.parseFields(field.fields);
                    }
                } catch (error) {
                    console.warn(`Error parsing fields for field ${field.id}:`, error);
                    field.fields = null;
                }
            }

            return field;
        });
    };
}

module.exports = TasksTemplate;

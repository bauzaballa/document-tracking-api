"use strict";
const apiAuth = require("../../app/utils/apiAuth");
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Generar UUIDs para el applicant
        const applicantId = uuidv4();

        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 110,
                title: "Abrir Busqueda",
                subarea: "Soft",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 110,
                taskTemplateId: 110,
                title: "Datos",
                typeStep: "director",
                subTitle: "Datos básicos",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            },
            {
                id: 111,
                taskTemplateId: 110,
                title: "Detalle",
                typeStep: "director",
                subTitle: "Detalle de contratación",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 2
            },
            {
                id: 112,
                taskTemplateId: 110,
                title: "Reclutar",
                typeStep: "director",
                subTitle: "Reclutamiento",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 3
            },
            {
                id: 113,
                taskTemplateId: 110,
                title: "Candidatos",
                typeStep: "colaborador",
                subTitle: "Lista de Candidatos",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            }
        ]);

        const dataDepartments = await apiAuth.get("/department/get-all").then(data => data.data.map(el => el.name));
        const dataUnit = await apiAuth.get("/unit/get-all").then(data => data.data.map(el => el.name));

        await queryInterface.bulkInsert("TaskFields", [
            {
                id: 103,
                taskStepId: 110,
                label: "Dirección",
                type: "dropdown",
                options: JSON.stringify(dataDepartments),
                directionMapOption: "row",
                placeHolder: "Seleccionar",
                required: true,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 104,
                taskStepId: 110,
                label: "Unidad de negocio",
                type: "dropdown",
                options: JSON.stringify(dataUnit),
                directionMapOption: "row",
                placeHolder: "Seleccionar",
                showRequest: true,
                required: true,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 105,
                taskStepId: 110,
                label: "Empresa",
                type: "dropdown",
                options: JSON.stringify(["Four Capital","Laniakea"]),
                directionMapOption: "row",
                placeHolder: "Especificar",
                required: true,
                order: 3,
                showRequest: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 106,
                taskStepId: 110,
                label: "Sede",
                type: "dropdown",
                options: JSON.stringify(["La Plata", "Mendoza"]),
                directionMapOption: "row",
                placeHolder: "Seleccionar",
                required: true,
                order: 4,
                showRequest: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 107,
                taskStepId: 110,
                label: "Cantidad de candidatos",
                type: "numero",
                directionMapOption: "row",
                placeHolder: "10",
                showRequest: true,
                required: true,
                order: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            },

            {
                id: 108,
                taskStepId: 110,
                label: "Cantidad de ingresos",
                type: "numero",
                showRequest: true,
                directionMapOption: "row",
                placeHolder: "Escribilo",
                required: true,
                order: 6,
                createdAt: new Date(),
                updatedAt: new Date()
            },

            {
                id: 110,
                taskStepId: 110,
                label: "Fecha de vencimiento de la tarea",
                type: "fecha",
                directionMapOption: "row",
                placeHolder: "Escribir",
                required: true,
                order: 8,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            //segundo paso directivo
            {
                id: 111,
                taskStepId: 111,
                label: "Jornada",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Días y Horario",
                required: true,
                order: 1,
                showRequest: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 112,
                taskStepId: 111,
                label: "Tareas",
                type: "textarea",
                directionMapOption: "row",
                placeHolder: "Indicalas",
                required: true,
                order: 2,
                showRequest: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 113,
                taskStepId: 111,
                label: "Requisitos Deseables",
                type: "textarea",
                directionMapOption: "row",
                placeHolder: "Indicalos",
                required: true,
                order: 3,
                showRequest: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 114,
                taskStepId: 111,
                label: "Requisitos Excluyentes",
                type: "textarea",
                directionMapOption: "row",
                placeHolder: "Indicalos",
                required: true,
                order: 4,
                showRequest: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 115,
                taskStepId: 111,
                label: "Modalidad de contratación",
                type: "dropdown",
                options: JSON.stringify(["Relación de dependencia", "Contrato de servicios"]),
                directionMapOption: "row",
                placeHolder: "Seleccionar",
                required: false,
                order: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 116,
                taskStepId: 111,
                label: "Convenio",
                type: "opcion-multiple",
                directionMapOption: "grid",
                options: JSON.stringify(["Comercio", "Prensa", "Fuera de convenio", "No corresponde"]),
                required: true,
                order: 6,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 117,
                taskStepId: 111,
                label: "Sueldo",
                type: "opcion-multiple",
                directionMapOption: "column",
                options: JSON.stringify(["Sueldo convenio", "Neto acordado", "No corresponde"]),
                required: true,
                order: 7,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 118,
                taskStepId: 111,
                label: "Contrato",
                type: "opcion-multiple",
                directionMapOption: "grid",
                options: JSON.stringify([
                    "Contrato indeterminado",
                    "Contrato por proyecto",
                    "Contrato por cobertura",
                    "No Corresponde"
                ]),
                required: true,
                order: 8,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            //tercer paso administrativo
            {
                id: 119,
                taskStepId: 112,
                label: "",
                type: "checkbox",
                directionMapOption: "column",
                options: JSON.stringify(["Mail", "Hunting", "Campaña de contenido único", "Portal de empleo"]),
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 120,
                taskStepId: 112,
                label: "Campaña de contenido único (de ser necesario)",
                type: "checkbox",
                directionMapOption: "column",
                options: JSON.stringify(["Linkedin", "Meta"]),
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 121,
                taskStepId: 112,
                label: "Meta (de ser necesario)",
                type: "opcion-multiple",
                directionMapOption: "row",
                options: JSON.stringify(["Publicitar", "No publicitar"]),
                required: false,
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 122,
                taskStepId: 112,
                label: "Portal de Empleo (de ser necesario)",
                type: "opcion-multiple",
                directionMapOption: "row",
                options: JSON.stringify(["Computrabajo", "ZonaJobs", "LinkedIn", "Otros"]),
                required: false,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 123,
                taskStepId: 112,
                label: "Otro Portal de Empleo (de ser necesario)",
                type: "texto",
                placeHolder: "Escribilo",
                directionMapOption: "row",
                required: false,
                order: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        // Primero encontrar el UUID del applicant que creamos

        // Eliminar todos los TaskFields asociados a los TaskSteps
        await queryInterface.bulkDelete("TaskFields", {
            id: {
                [Sequelize.Op.in]: [
                    103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122,
                    123
                ]
            }
        });

        // Eliminar los TaskSteps
        await queryInterface.bulkDelete("TaskSteps", {
            id: { [Sequelize.Op.in]: [110, 111, 112, 113] }
        });

        // Finalmente eliminar el TaskTemplate
        await queryInterface.bulkDelete("TaskTemplates", {
            id: 110
        });

        // Resetear las secuencias
        await queryInterface.sequelize.query(`
            SELECT setval('"TaskFields_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "TaskFields"), false);
            SELECT setval('"TaskSteps_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "TaskSteps"), false);
            SELECT setval('"TaskTemplates_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "TaskTemplates"), false);
        `);
    }
};

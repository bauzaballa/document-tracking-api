"use strict";

const apiAuth = require("../../app/utils/apiAuth");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 140,
                title: "Alta de Nuevo Ingreso",
                subarea: "Hard",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 140,
                taskTemplateId: 140,
                title: "Datos",
                typeStep: "director",
                subTitle: "Datos básicos",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            },
            {
                id: 141,
                taskTemplateId: 140,
                title: "Requisitos",
                typeStep: "colaborador",
                subTitle: "Requisitos",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            }
        ]);

        const dataUnit = await apiAuth.get("/unit/get-all").then(data => data.data.map(el => el.name));

        const jobPositions = await queryInterface.sequelize.query('SELECT name FROM "JobPositions"', {
            type: queryInterface.sequelize.QueryTypes.SELECT
        });
        const jobPositionNames = jobPositions.map(jp => jp.name);

        await queryInterface.bulkInsert("TaskFields", [
            {
                id: 152,
                taskStepId: 140,
                label: "Puesto",
                type: "dropdown",
                options: JSON.stringify(jobPositionNames),
                directionMapOption: "row",
                placeHolder: "Especificar",
                required: true,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 153,
                taskStepId: 140,
                label: "Dirección",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Especificar",
                required: true,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 154,
                taskStepId: 140,
                label: "Unidad de negocio",
                type: "dropdown",
                options: JSON.stringify(dataUnit),
                directionMapOption: "row",
                placeHolder: "Seleccionar",
                showRequest: true,
                required: true,
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 155,
                taskStepId: 140,
                label: "Empresa",
                type: "dropdown",
                options: JSON.stringify(["Delsud", "Four Capital"]),
                directionMapOption: "row",
                placeHolder: "Especificar",
                required: true,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 156,
                taskStepId: 140,
                label: "Sede",
                type: "dropdown",
                options: JSON.stringify(["La Plata", "Mendoza"]),
                directionMapOption: "row",
                placeHolder: "Especificar",
                required: true,
                order: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            },

            {
                id: 157,
                taskStepId: 140,
                label: "Jornada",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Especificar",
                required: true,
                order: 6,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 158,
                taskStepId: 140,
                label: "Modalidad de contratación",
                type: "dropdown",
                options: JSON.stringify(["Relación de dependencia", "Contrato de servicios"]),
                placeHolder: "Seleccionar",
                directionMapOption: "column",
                required: true,
                order: 7,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 159,
                taskStepId: 140,
                label: "Convenio",
                type: "dropdown",
                directionMapOption: "column",
                options: JSON.stringify(["Comercio", "Prensa", "Fuera de convenio", "No corresponde"]),
                directionMapOption: "row",
                placeHolder: "Seleccionar",
                required: true,
                order: 8,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 160,
                taskStepId: 140,
                label: "Sueldo",
                type: "opcion-multiple",
                options: JSON.stringify(["Sueldo convenio", "Neto acordado", "No corresponde"]),
                directionMapOption: "row",
                placeHolder: "Seleccionar",
                required: true,
                order: 6,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 161,
                taskStepId: 140,
                label: "Contrato",
                type: "dropdown",
                directionMapOption: "row",
                options: JSON.stringify([
                    "Contrato indeterminado",
                    "Contrato por proyecto",
                    "Contrato por cobertura",
                    "No Corresponde"
                ]),
                placeHolder: "Seleccionar",
                required: true,
                order: 7,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 162,
                taskStepId: 140,
                label: "Nombre y Apellido del Candidato",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Especificar",
                required: true,
                order: 8,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 163,
                taskStepId: 140,
                label: "Email del Candidato",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Especificar",
                required: true,
                order: 9,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 164,
                taskStepId: 140,
                label: "Fecha de ingreso",
                type: "fecha",
                directionMapOption: "row",
                placeHolder: "Escribir",
                required: true,
                order: 10,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 165,
                taskStepId: 140,
                label: "Documento del candidato",
                type: "archivo",
                directionMapOption: "grid",
                placeHolder: "Cargar documento",
                required: true,
                order: 10,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            //colaborador
            {
                id: 166,
                taskStepId: 141,
                label: "Formulario Email",
                type: "archivo",
                directionMapOption: "grid",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 167,
                taskStepId: 141,
                label: "Alta ARCA",
                type: "checkbox",
                options: JSON.stringify([
                    "Crear documento de alta en ARCA.",
                    "Hacer firmar el documento por la persona en el momento de su ingreso."
                ]),
                directionMapOption: "column",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 168,
                taskStepId: 141,
                label: "Documentos Alta ARCA",
                type: "archivo",
                directionMapOption: "grid",
                required: false,
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 169,
                taskStepId: 141,
                label: "Contrato laboral",
                type: "checkbox",
                options: JSON.stringify([
                    "Crear contrato correspondiente.",
                    "Hacer firmar el documento por la persona en el momento de su ingreso."
                ]),
                directionMapOption: "column",
                required: false,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 170,
                taskStepId: 141,
                label: "Documentos Contrato laboral",
                type: "archivo",
                directionMapOption: "grid",
                required: false,
                order: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 171,
                taskStepId: 141,
                label: "DDJJ de domicilio",
                type: "checkbox",
                options: JSON.stringify([
                    "Recibir declaración jurada completa de domicilio.",
                    "Hacer firmar el documento al ingresar."
                ]),
                directionMapOption: "column",
                required: false,
                order: 6,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 172,
                taskStepId: 141,
                label: "Documentos DDJJ de domicilio",
                type: "archivo",
                directionMapOption: "grid",
                required: false,
                order: 7,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 173,
                taskStepId: 141,
                label: "Alta de Obra Social (OS)",
                type: "opcion-multiple",
                options: JSON.stringify([
                    "Se adhiere a nuestro convenio.",
                    "Continúa con su obra social actual (no requiere acción adicional).",
                    "Indefinido (si no hay información al momento del ingreso."
                ]),
                directionMapOption: "column",
                required: false,
                order: 8,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 174,
                taskStepId: 141,
                label: "Fecha estimada",
                type: "dropdown",
                options: JSON.stringify([
                    "Enero",
                    "Febrero",
                    "Marzo",
                    "Abril",
                    "Mayo",
                    "Junio",
                    "Julio",
                    "Agosto",
                    "Septiembre",
                    "Octubre",
                    "Noviembre",
                    "Diciembre"
                ]),
                directionMapOption: "column",
                required: false,
                order: 9,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 175,
                taskStepId: 141,
                label: "",
                type: "checkbox",
                options: JSON.stringify(["Dado de alta"]),
                directionMapOption: "column",
                required: false,
                order: 10,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("TaskFields", {
            id: {
                [Sequelize.Op.in]: [
                    152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171,
                    172, 173, 174,175
                ]
            }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: { [Sequelize.Op.in]: [140, 141] }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 140 });
    }
};

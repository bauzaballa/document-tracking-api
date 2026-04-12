"use strict";

const apiAuth = require("../../app/utils/apiAuth");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 120,
                title: "Capacitaciones",
                subarea: "Soft",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 120,
                taskTemplateId: 120,
                title: "Datos",
                typeStep: "director",
                subTitle: "Capacitaciones",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            },
            {
                id: 121,
                taskTemplateId: 120,
                title: "Detalle",
                typeStep: "colaborador",
                subTitle: "Capacitaciones",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            }
        ]);
       const dataDepartments = await apiAuth.get("/department/get-all").then(data => data.data.map(el => el.name));

        await queryInterface.bulkInsert("TaskFields", [
            {
                id: 130,
                taskStepId: 120,
                label: "Materia de capacitación",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Escribilo",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 131,
                taskStepId: 120,
                label: "Objetivo",
                type: "opcion-multiple",
                directionMapOption: "column",
                options: JSON.stringify(["Pedir Presupuesto", "Detallar Proveedores", "Adjuntar Propuestas"]),
                placeHolder: "Escribir",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },

            {
                id: 132,
                taskStepId: 120,
                label: "Modalidad deseada",
                type: "opcion-multiple",
                directionMapOption: "column",
                options: JSON.stringify(["Presencial", "Virtual", "Hibrido"]),
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 133,
                taskStepId: 120,
                label: "Destinado a",
                type: "dropdown",
                directionMapOption: "column",
                options: JSON.stringify(dataDepartments),
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 134,
                taskStepId: 120,
                label: "Nombre Colaborador (opcional)",
                type: "texto",
                directionMapOption: "column",
                placeHolder: "Escribilo",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 135,
                taskStepId: 120,
                label: "Cantidad de propuestas",
                type: "numero",
                directionMapOption: "column",
                placeHolder: "2",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            //colaborador
            {
                id: 136,
                taskStepId: 121,
                label: "Titulo de la capacitación",
                type: "texto",
                directionMapOption: "column",
                placeHolder: "Detallar",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 137,
                taskStepId: 121,
                label: "Fechas posibles",
                type: "fecha",
                isMultiple: true,
                placeHolder: "Seleccionar fechas",
                directionMapOption: "column",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 138,
                taskStepId: 121,
                label: "Presupuesto",
                type: "texto",
                placeHolder: "Detallar",
                directionMapOption: "column",
                required: false,
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 139,
                taskStepId: 121,
                label: "Propuestas",
                type: "archivo",
                placeHolder: "Cargar documento",
                directionMapOption: "grid",
                isMultiple: true,
                required: true,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("TaskFields", {
            id: {
                [Sequelize.Op.in]: [130, 131, 132, 133, 134, 135, 136, 137, 138, 139]
            }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: { [Sequelize.Op.in]: [120, 121] }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 120 });
    }
};

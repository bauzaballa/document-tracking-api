"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 90,
                title: "Notificaciones Internas",
                subarea: "Hard",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 90,
                taskTemplateId: 90,
                title: "Datos",
                typeStep: "director",
                subTitle: "Datos",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            },
            {
                id: 91,
                taskTemplateId: 90,
                title: "Detalle",
                typeStep: "colaborador",
                subTitle: "Detalle",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 2
            }
        ]);
        await queryInterface.bulkInsert("TaskFields", [
            {
                id: 90,
                taskStepId: 90,
                label: "Motivo",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Escribir",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 91,
                taskStepId: 90,
                label: "Vía de comunicación",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Escribir",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 92,
                taskStepId: 90,
                label: "Asunto",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Nombre",
                required: false,
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 93,
                taskStepId: 90,
                label: "Texto de  notificación",
                type: "textarea",
                directionMapOption: "row",
                placeHolder: "Escribir",
                required: false,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            },

            //colaborador
            {
                id: 94,
                taskStepId: 91,
                label: "Notificación",
                type: "archivo",
                directionMapOption: "row",
                placeHolder: "Cargar Documento",
                required: false,
                order: 1,
                limitFile: 3,
                isMultiple: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("TaskFields", {
            id: {
                [Sequelize.Op.in]: [90, 91, 92, 93, 94]
            }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: { [Sequelize.Op.in]: [90, 91] }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 90 });
    }
};

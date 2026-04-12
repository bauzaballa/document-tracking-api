"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Insertar Template
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 40,
                title: "Mandar mail de bienvenida y formularios",
                subarea: "Soft",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        // Insertar Steps
        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 40,
                taskTemplateId: 40,
                title: "Datos",
                typeStep: "director",
                subTitle: "Mail de bienvenida",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            }
        ]);

        // Insertar Fields
        await queryInterface.bulkInsert("TaskFields", [
            {
                id: 40,
                taskStepId: 40,
                label: "Nombre",
                type: "texto",
                placeHolder: "Nombre",
                directionMapOption: "row",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 41,
                taskStepId: 40,
                label: "Observaciones",
                type: "textarea",
                placeHolder: "Observaciones",
                directionMapOption: "row",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("TaskFields", {
            id: { [Sequelize.Op.in]: [40, 41] }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: { [Sequelize.Op.in]: [40] }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 40 });
    }
};

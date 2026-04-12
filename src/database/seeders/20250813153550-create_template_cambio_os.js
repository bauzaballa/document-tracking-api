"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Insertar Template
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 50,
                title: "Cambio OS",
                subarea: "Hard",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        // Insertar Steps
        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 50,
                taskTemplateId: 50,
                title: "Datos",
                typeStep: "director",
                subTitle: "Cambio Obra Social",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            }
        ]);

        // Insertar Fields
        await queryInterface.bulkInsert("TaskFields", [
            {
                id: 50,
                taskStepId: 50,
                label: "Nombre",
                type: "texto",
                placeHolder: "Nombre",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 51,
                taskStepId: 50,
                label: "Obra Social",
                type: "texto",
                placeHolder: "Nombre",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("TaskFields", {
            id: { [Sequelize.Op.in]: [50, 51] }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: { [Sequelize.Op.in]: [50] }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 50 });
    }
};

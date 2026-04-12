"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Insertar Template
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 30,
                title: "Fotos institucionales",
                subarea: "Soft",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        // Insertar Steps
        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 30,
                taskTemplateId: 30,
                title: "Datos",
                typeStep: "director",
                subTitle: "Comunicar fotos institucionales",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            }
        ]);

        // Insertar Fields
        await queryInterface.bulkInsert("TaskFields", [
            {
                id: 30,
                taskStepId: 30,
                label: "Observaciones",
                type: "textarea",
                placeHolder: "Observaciones",
                directionMapOption: "row",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("TaskFields", {
            id: { [Sequelize.Op.in]: [30] }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: { [Sequelize.Op.in]: [30] }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 30 });
    }
};

"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Insertar Template
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 60,
                title: "Liquidación de sueldos",
                subarea: "Hard",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        // Insertar Steps
        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 60,
                taskTemplateId: 60,
                title: "Datos",
                typeStep: "director",
                subTitle: "Datos",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            },
            {
                id: 61,
                taskTemplateId: 60,
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
                id: 60,
                taskStepId: 60,
                label: "Mes",
                type: "texto",
                placeHolder: "Mes de ejemplo",
                directionMapOption: "row",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 61,
                taskStepId: 60,
                label: "Detalle",
                type: "texto",
                placeHolder: "Descripción",
                directionMapOption: "row",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            // Fiels del step colaborador
            {
                id: 62,
                taskStepId: 61,
                label: "Liquidación",
                type: "archivo",
                placeHolder: "Cargar documento",
                directionMapOption: "grid",
                limitFile: 3,
                isMultiple: true,
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("TaskFields", {
            id: {
                [Sequelize.Op.in]: [60, 61, 62]
            }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: { [Sequelize.Op.in]: [60, 61] }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 60 });
    }
};

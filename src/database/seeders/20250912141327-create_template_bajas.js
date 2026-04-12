"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 70,
                title: "Bajas",
                subarea: "Hard",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 70,
                taskTemplateId: 70,
                title: "Datos",
                typeStep: "director",
                subTitle: "Datos de la baja",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            },

            // Step colaborador
            {
                id: 71,
                taskTemplateId: 70,
                title: "Detalle",
                typeStep: "colaborador",
                subTitle: "Detalle",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            }
        ]);

        await queryInterface.bulkInsert("TaskFields", [
            {
                id: 70,
                taskStepId: 70,
                label: "Nombre del colaborador",
                type: "texto",
                placeHolder: "Nombre",
                directionMapOption: "row",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 71,
                taskStepId: 70,
                label: "Motivo de baja",
                type: "dropdown",
                options: JSON.stringify(["Renuncia", "Despido", "Fin de contrato", "Otros"]),
                directionMapOption: "row",
                placeHolder: "Seleccionar",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },

            // Fields del colaborador
            {
                id: 72,
                taskStepId: 71,
                label: "Bajas",
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
                [Sequelize.Op.in]: [70, 71, 72]
            }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: {
                [Sequelize.Op.in]: [70, 71]
            }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 70 });
    }
};

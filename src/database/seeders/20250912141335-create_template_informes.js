"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 80,
                title: "Informes",
                subarea: "Hard",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 80,
                taskTemplateId: 80,
                title: "Datos",
                typeStep: "director",
                subTitle: "Detalle",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            },

            // Step colaborador
            {
                id: 81,
                taskTemplateId: 80,
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
                id: 80,
                taskStepId: 80,
                label: "Informe",
                type: "checkbox",
                placeHolder: "",
                options: JSON.stringify([
                    "Cargas sociales",
                    "Liquidación final estimada",
                    "Sueldos estimado",
                    "Inasistencias",
                    "Legajos",
                    "Novedades Mensuales"
                ]),
                directionMapOption: "column",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 81,
                taskStepId: 80,
                label: "Detalle (opcional)",
                type: "textarea",
                placeHolder: "Escribir",
                directionMapOption: "row",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },

            // Fiels del colaborador
            {
                id: 82,
                taskStepId: 81,
                label: "Informe",
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
                [Sequelize.Op.in]: [80, 81, 82]
            }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: {
                [Sequelize.Op.in]: [80, 81]
            }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 80 });
    }
};

"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 100,
                title: "Firmar documentación",
                subarea: "Hard",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 100,
                taskTemplateId: 100,
                title: "Datos",
                typeStep: "director",
                subTitle: "Detalle",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            },
            {
                id: 101,
                taskTemplateId: 100,
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
                id: 100,
                taskStepId: 100,
                label: "Nombre del colaborador",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Escribir",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 101,
                taskStepId: 100,
                label: "Especificar documentación",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Detallar motivo",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
          
            {
                id: 102,
                taskStepId: 101,
                label: "Documentación firmada",
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
                [Sequelize.Op.in]: [100, 101, 102]
            }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: { [Sequelize.Op.in]: [100, 101] }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 100 });
    }
};

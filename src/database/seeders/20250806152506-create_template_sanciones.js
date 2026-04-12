"use strict";



/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Insertar Template
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 10,
                title: "Sanciones",
                subarea: "Hard",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        // Insertar Steps
        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 10,
                taskTemplateId: 10,
                title: "Datos",
                typeStep: "director",
                subTitle: "Detalle",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            },
            {
                id: 11,
                taskTemplateId: 10,
                title: "Detalle",
                typeStep: "colaborador",
                subTitle: "Detalle",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            }
        ]);

        // Insertar Fields
        await queryInterface.bulkInsert("TaskFields", [
            {
                id: 10,
                taskStepId: 10,
                label: "Nombre del colaborador afectado",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Nombre",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 11,
                taskStepId: 10,
                label: "Motivo de sanción / Descargo",
                type: "textarea",
                directionMapOption: "row",
                placeHolder: "Observaciones",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 12,
                taskStepId: 10,
                label: "Tipo de sanción solicitada",
                type: "opcion-multiple",
                directionMapOption: "column",
                options: JSON.stringify(["Apercibimiento", "Suspensión"]),
                placeHolder: "",
                required: false,
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 14,
                taskStepId: 10,
                label: "Cantidad de días de la sanción (si corresponde)",
                type: "numero",
                directionMapOption: "row",
                placeHolder: "5",
                required: false,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 15,
                taskStepId: 10,
                label: "Fecha de inicio de la sanción (si corresponde)",
                type: "fecha",
                directionMapOption: "row",
                placeHolder: "dd/mm/aaaa",
                required: false,
                order: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 16,
                taskStepId: 10,
                label: "Fecha de finalización de la sanción (si corresponde)",
                type: "fecha",
                directionMapOption: "row",
                placeHolder: "dd/mm/aaaa",
                required: false,
                order: 6,
                createdAt: new Date(),
                updatedAt: new Date()
            },

            // Fiels del colaborador
            {
                id: 17,
                taskStepId: 11,
                label: "Documento Sanción",
                type: "archivo",
                placeHolder: "Cargar documento",
                directionMapOption: "grid",
                limitFile: 3,
                isMultiple: true,
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
        ]);
    },

    async down(queryInterface, Sequelize) {
        // Eliminar en orden inverso
        await queryInterface.bulkDelete("TaskFields", {
            id: {
                [Sequelize.Op.in]: [10, 11, 12, 14, 15, 16, 17]
            }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: { [Sequelize.Op.in]: [10, 11] }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 10 });
    }
};

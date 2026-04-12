"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Insertar Template
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 20,
                title: "Envío Carta documento",
                subarea: "Hard",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        // Insertar Steps
        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 20,
                taskTemplateId: 20,
                title: "Datos",
                typeStep: "director",
                subTitle: "Datos",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            },
            {
                id: 21,
                taskTemplateId: 20,
                title: "Archivo",
                typeStep: "colaborador",
                subTitle: "Archivo",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            }
        ]);

        // Insertar Fields
        await queryInterface.bulkInsert("TaskFields", [
            {
                id: 20,
                taskStepId: 20,
                label: "Destinatario",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Nombre y apellido",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 21,
                taskStepId: 20,
                label: "Remitente (empresa)",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Nombre de empresa",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 22,
                taskStepId: 20,
                label: "Fecha",
                placeHolder: "DD/MM/AAAA",
                type: "fecha",
                directionMapOption: "row",
                required: false,
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 23,
                taskStepId: 20,
                label: "Cuerpo de Carta Documento",
                placeHolder: "Escribir cuerpo",
                type: "textarea",
                directionMapOption: "row",
                required: false,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 24,
                taskStepId: 20,
                label: "Enviada por",
                directionMapOption: "column",
                options: JSON.stringify(["Web", "En el correo"]),
                type: "checkbox",
                required: false,
                order: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            //colaborador
            {
                id: 25,
                taskStepId: 21,
                label: "Documentación",
                placeHolder: "Cargar CD",
                type: "archivo",
                directionMapOption: "row",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
        await queryInterface.sequelize.query(
            `
            UPDATE "TaskFields" SET "fields" = ? WHERE id = 25
        `,
            {
                replacements: [
                    JSON.stringify([
                        { nestedId: 19, taskFieldId: 76, label: "URL CD", type: "url", value: "", order: 1 }
                    ])
                ]
            }
        );
    },

    async down(queryInterface, Sequelize) {
        // Eliminar en orden inverso
        await queryInterface.bulkDelete("TaskFields", {
            id: { [Sequelize.Op.in]: [20, 21, 22, 23, 24, 25] }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: { [Sequelize.Op.in]: [20, 21] }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 20 });
    }
};

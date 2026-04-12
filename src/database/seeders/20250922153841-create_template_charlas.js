"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert("TaskTemplates", [
            {
                id: 130,
                title: "Charlas",
                subarea: "Soft",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        await queryInterface.bulkInsert("TaskSteps", [
            {
                id: 130,
                taskTemplateId: 130,
                title: "Datos",
                typeStep: "director",
                subTitle: "Charlas",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            },
            {
                id: 131,
                taskTemplateId: 130,
                title: "Detalle",
                typeStep: "colaborador",
                subTitle: "Capacitaciones",
                createdAt: new Date(),
                updatedAt: new Date(),
                order: 1
            }
        ]);
        await queryInterface.bulkInsert("TaskFields", [
            {
                id: 140,
                taskStepId: 130,
                label: "Tema de abordaje",
                type: "texto",
                directionMapOption: "row",
                placeHolder: "Detallar",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 141,
                taskStepId: 130,
                label: "Objetivo",
                type: "texto",
                directionMapOption: "column",
                placeHolder: "Detallar",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },

            {
                id: 142,
                taskStepId: 130,
                label: "Destinado a",
                type: "dropdown",
                directionMapOption: "column",
                options: JSON.stringify(["Presencial", "Virtual", "Hibrido"]),
                required: false,
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 143,
                taskStepId: 130,
                label: "Fecha estimada",
                type: "dropdown",
                placeHolder: "Seleccionar mes",
                directionMapOption: "column",
                options: JSON.stringify([
                    "Enero",
                    "Febrero",
                    "Marzo",
                    "Abril",
                    "Mayo",
                    "Junio",
                    "Julio",
                    "Agosto",
                    "Septiembre",
                    "Octubre",
                    "Noviembre",
                    "Diciembre"
                ]),
                required: false,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 145,
                taskStepId: 130,
                label: "Objetivo",
                type: "opcion-multiple",
                directionMapOption: "column",
                options: JSON.stringify(["Pedir Presupuesto", "Detallar Proveedores", "Adjuntar Propuestas"]),
                placeHolder: "Escribir",
                required: false,
                order: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 146,
                taskStepId: 130,
                label: "Cantidad de propuestas",
                type: "numero",
                directionMapOption: "column",
                placeHolder: "2",
                required: false,
                order: 6,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 147,
                taskStepId: 130,
                label: "Lugar",
                type: "opcion-multiple",
                options: JSON.stringify(["DELSUD La Plata", "DELSUD Mendoza", "Virtual", "Otro"]),
                directionMapOption: "column",
                required: false,
                order: 7,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            //colaborador
            {
                id: 148,
                taskStepId: 131,
                label: "Titulo de la charla",
                type: "texto",
                directionMapOption: "column",
                placeHolder: "Detallar",
                required: false,
                order: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 149,
                taskStepId: 131,
                label: "Fechas posibles",
                type: "fecha",
                isMultiple: true,
                placeHolder: "Seleccionar fechas",
                directionMapOption: "column",
                required: false,
                order: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 150,
                taskStepId: 131,
                label: "Presupuesto",
                type: "texto",
                placeHolder: "Detallar",
                directionMapOption: "column",
                required: false,
                order: 3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 151,
                taskStepId: 131,
                label: "Propuestas",
                type: "archivo",
                placeHolder: "Cargar documento",
                directionMapOption: "grid",
                isMultiple: true,
                required: true,
                order: 4,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("TaskFields", {
            id: {
                [Sequelize.Op.in]: [140, 141, 142, 143, 145, 146, 147, 148, 149, 150, 151]
            }
        });
        await queryInterface.bulkDelete("TaskSteps", {
            id: { [Sequelize.Op.in]: [130, 131] }
        });
        await queryInterface.bulkDelete("TaskTemplates", { id: 130 });
    }
};

"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("observationApplicants", {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            // Nuevo campo
            type: {
                type: Sequelize.ENUM("request", "task"),
                defaultValue: "task"
            },
            applicantId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: "Applicants",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            userId: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            taskStepId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: "TaskSteps",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
            }
        });

        // Agregar índices para mejorar el rendimiento
        await queryInterface.addIndex("observationApplicants", ["applicantId"]);
        await queryInterface.addIndex("observationApplicants", ["taskStepId"]);
        await queryInterface.addIndex("observationApplicants", ["type"]);
        await queryInterface.addIndex("observationApplicants", ["userId"]);
    },

    async down(queryInterface, Sequelize) {
        // Eliminar índices primero
        await queryInterface.removeIndex("observationApplicants", ["applicantId"]);
        await queryInterface.removeIndex("observationApplicants", ["taskStepId"]);
        await queryInterface.removeIndex("observationApplicants", ["type"]);
        await queryInterface.removeIndex("observationApplicants", ["userId"]);

        // Eliminar la tabla
        await queryInterface.dropTable("observationApplicants");

        // Eliminar el tipo ENUM
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_observationapplicants_type";');
    }
};

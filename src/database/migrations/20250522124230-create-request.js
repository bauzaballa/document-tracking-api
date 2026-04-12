"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Requests", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            title: {
                type: Sequelize.STRING
            },
            departmentId: {
                type: Sequelize.INTEGER
            },
            requestedByDepartmentId: {
                type: Sequelize.INTEGER
            },
            unitId: {
                type: Sequelize.INTEGER
            },
            // Nuevos campos
            receiverUserId: {
                type: Sequelize.UUID,
                allowNull: true
            },
            createdByUserId: {
                type: Sequelize.UUID,
                allowNull: false
            },
            formId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: "Forms",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL"
            },
            // ENUM actualizado
            priority: {
                type: Sequelize.ENUM("urgente", "media", "baja"),
                allowNull: true
            },
            content: {
                type: Sequelize.TEXT
            },
            timeline: {
                type: Sequelize.JSON,
                allowNull: true
            },
            // Nuevos campos
            formResponse: {
                type: Sequelize.JSON,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM("pendiente", "aceptada", "finalizada", "rechazada"),
                defaultValue: "pendiente"
            },
            isCompleted: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
            }
        });

        // Crear índice para mejor rendimiento en consultas frecuentes
        await queryInterface.addIndex("Requests", ["formId"]);
        await queryInterface.addIndex("Requests", ["createdByUserId"]);
        await queryInterface.addIndex("Requests", ["receiverUserId"]);
        await queryInterface.addIndex("Requests", ["status"]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("Requests");
        // Los ENUMs se eliminarán automáticamente cuando se dropee la tabla
    }
};

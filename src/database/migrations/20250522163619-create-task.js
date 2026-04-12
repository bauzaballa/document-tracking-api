"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Tasks", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            title: {
                type: Sequelize.STRING
            },
            listId: {
                type: Sequelize.INTEGER
            },
            departmentId: {
                type: Sequelize.INTEGER
            },
            userIds: {
                type: Sequelize.TEXT
            },
            // Nuevos campos
            userIdCreated: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            // ENUM actualizado
            priority: {
                type: Sequelize.ENUM("urgente", "medio", "baja"),
                allowNull: true
            },
            // ENUM actualizado con nuevo valor
            status: {
                type: Sequelize.ENUM("pendiente", "en-proceso", "completada", "vencida", "cancelada"),
                defaultValue: "pendiente"
            },
            description: {
                type: Sequelize.TEXT
            },
            startDate: {
                type: Sequelize.DATEONLY
            },
            dueDate: {
                type: Sequelize.DATEONLY
            },
            isDraft: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            // Nuevos campos
            subareaId: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            category: {
                type: Sequelize.ENUM("Comercial", "No comercial"),
                defaultValue: "No comercial"
            },
            position: {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null
            },
            unitId: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            requestId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: "Requests",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL"
            },
            taskTemplateId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: "TaskTemplates",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL"
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

        // Crear índices para mejor rendimiento
        await queryInterface.addIndex("Tasks", ["listId"]);
        await queryInterface.addIndex("Tasks", ["departmentId"]);
        await queryInterface.addIndex("Tasks", ["requestId"]);
        await queryInterface.addIndex("Tasks", ["taskTemplateId"]);
        await queryInterface.addIndex("Tasks", ["status"]);
        await queryInterface.addIndex("Tasks", ["priority"]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("Tasks");
    }
};

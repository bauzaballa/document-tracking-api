"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Notifications", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.UUID,
                allowNull: true
            },
            departmentId: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            userIdReceive: {
                type: Sequelize.UUID,
                allowNull: true
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            type: {
                type: Sequelize.STRING,
                allowNull: true
            },
            wasReceived: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            urlRedirect: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            isForAdmin: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            // Nuevo campo
            metadata: {
                type: Sequelize.TEXT,
                allowNull: true
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
        await queryInterface.addIndex("Notifications", ["userId"]);
        await queryInterface.addIndex("Notifications", ["userIdReceive"]);
        await queryInterface.addIndex("Notifications", ["departmentId"]);
        await queryInterface.addIndex("Notifications", ["wasReceived"]);
        await queryInterface.addIndex("Notifications", ["isForAdmin"]);
        await queryInterface.addIndex("Notifications", ["createdAt"]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("Notifications");
    }
};

"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("CalendarEvents", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.UUID
            },
            title: {
                type: Sequelize.STRING
            },
            date: {
                type: Sequelize.DATE
            },
            description: {
                type: Sequelize.TEXT
            },
            notification: {
                type: Sequelize.STRING
            },
            wasNotified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            googleEventId: {
                type: Sequelize.STRING,
                allowNull: true
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("CalendarEvents");
    }
};

"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Primero verificar si la columna ya existe
        const tableDescription = await queryInterface.describeTable("Requests");

        if (!tableDescription.branchId) {
            // Solo agregar si no existe
            await queryInterface.addColumn("Requests", "branchId", {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 1
            });

            // Actualizar registros existentes
            await queryInterface.sequelize.query('UPDATE "Requests" SET "branchId" = 1 WHERE "branchId" IS NULL');
        }
    },

    async down(queryInterface, Sequelize) {
        // Verificar si existe antes de eliminar
        const tableDescription = await queryInterface.describeTable("Requests");

        if (tableDescription.branchId) {
            await queryInterface.removeColumn("Requests", "branchId");
        }
    }
};

"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = ["TaskTemplates", "TaskSteps", "TaskFields", "Tasks"];

        for (const table of tables) {
            // Verificar si la tabla tiene registros
            const count = await queryInterface.sequelize.query(
                `SELECT COUNT(*) as count FROM "${table}"`,
                { type: Sequelize.QueryTypes.SELECT }
            );
            
            if (count[0].count > 0) {
                // Solo resetear si hay datos
                const result = await queryInterface.sequelize.query(
                    `SELECT MAX(id) as max_id FROM "${table}"`,
                    { type: Sequelize.QueryTypes.SELECT }
                );
                
                const nextVal = result[0].max_id + 1;
                await queryInterface.sequelize.query(
                    `SELECT setval('"${table}_id_seq"', ${nextVal}, false);`
                );
            }
        }
    },

    async down(queryInterface, Sequelize) {
        const tables = ["TaskTemplates", "TaskSteps", "TaskFields", "Tasks"];

        for (const table of tables) {
            // Reinicia la secuencia a 1 para que no rompa el rollback
            await queryInterface.sequelize.query(`
                SELECT setval('"${table}_id_seq"', 1, false);
            `);
        }
    }
};
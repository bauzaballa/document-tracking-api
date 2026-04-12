/**
 * Resetea la secuencia de una tabla al valor máximo de su ID
 * @param {import('sequelize').QueryInterface} queryInterface
 * @param {string} tableName - Nombre de la tabla
 */
async function resetSequence(queryInterface, tableName) {
    await queryInterface.sequelize.query(`
    SELECT setval('"${tableName}_id_seq"', (SELECT COALESCE(MAX(id), 0) FROM "${tableName}"));
  `);
}

module.exports = { resetSequence };

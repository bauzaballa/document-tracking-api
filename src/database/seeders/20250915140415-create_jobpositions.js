"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert("JobPositions", [
            { name: "Administración y Datos", createdAt: new Date(), updatedAt: new Date() },
            { name: "Analista", createdAt: new Date(), updatedAt: new Date() },
            { name: "Arquitecta", createdAt: new Date(), updatedAt: new Date() },
            { name: "Cafetería", createdAt: new Date(), updatedAt: new Date() },
            { name: "Community Manager", createdAt: new Date(), updatedAt: new Date() },
            { name: "Comercial", createdAt: new Date(), updatedAt: new Date() },
            { name: "Corresponsal", createdAt: new Date(), updatedAt: new Date() },
            { name: "Data Analyst", createdAt: new Date(), updatedAt: new Date() },
            { name: "Desarrollador Frontend", createdAt: new Date(), updatedAt: new Date() },
            { name: "Desarrollador Backend", createdAt: new Date(), updatedAt: new Date() },
            { name: "Desarrollador Fullstack", createdAt: new Date(), updatedAt: new Date() },
            { name: "Director", createdAt: new Date(), updatedAt: new Date() },
            { name: "Diseñador Gráfico", createdAt: new Date(), updatedAt: new Date() },
            { name: "Diseñador UX/UI", createdAt: new Date(), updatedAt: new Date() },
            { name: "Filmmaker", createdAt: new Date(), updatedAt: new Date() },
            { name: "Finanzas y Contable", createdAt: new Date(), updatedAt: new Date() },
            { name: "Fotógrafo", createdAt: new Date(), updatedAt: new Date() },
            { name: "Innovación y Nuevos Negocios", createdAt: new Date(), updatedAt: new Date() },
            { name: "Jefe Redacción", createdAt: new Date(), updatedAt: new Date() },
            { name: "Maestranza", createdAt: new Date(), updatedAt: new Date() },
            { name: "Marketing", createdAt: new Date(), updatedAt: new Date() },
            { name: "Medios La Plata", createdAt: new Date(), updatedAt: new Date() },
            { name: "Medios Mendoza", createdAt: new Date(), updatedAt: new Date() },
            { name: "Operaciones", createdAt: new Date(), updatedAt: new Date() },
            { name: "Periodista", createdAt: new Date(), updatedAt: new Date() },
            { name: "QA Manual", createdAt: new Date(), updatedAt: new Date() },
            { name: "Redactor", createdAt: new Date(), updatedAt: new Date() },
            { name: "RRHH", createdAt: new Date(), updatedAt: new Date() },
            { name: "RRHH Hard", createdAt: new Date(), updatedAt: new Date() },
            { name: "RRHH Soft", createdAt: new Date(), updatedAt: new Date() },
            { name: "Seguridad", createdAt: new Date(), updatedAt: new Date() },
            { name: "Sereno", createdAt: new Date(), updatedAt: new Date() },
            { name: "Coordinador", createdAt: new Date(), updatedAt: new Date() },
            { name: "Supervisor", createdAt: new Date(), updatedAt: new Date() },
            { name: "Supervisor de Cobranzas y Atención Postventa", createdAt: new Date(), updatedAt: new Date() },
            { name: "Team Leader", createdAt: new Date(), updatedAt: new Date() },
            { name: "Tesorero", createdAt: new Date(), updatedAt: new Date() },
            { name: "Vendedor", createdAt: new Date(), updatedAt: new Date() }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("JobPositions", null, {});
    }
};

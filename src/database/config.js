require("dotenv").config();

module.exports = {
    development: {
        logging: false, // Log SQL request
        timezone: "America/Argentina/Buenos_Aires",
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",
        migrationStorage: "sequelize"
        // seederStorage: "sequelize"
    },
    test: {
        logging: false, // Log SQL request
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        timezone: "America/Argentina/Buenos_Aires",
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",
        migrationStorage: "sequelize",
        seederStorage: "sequelize"
    },
    production: {
        logging: false, // Log SQL request
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres",
        timezone: "America/Argentina/Buenos_Aires",
        migrationStorage: "sequelize",
        seederStorage: "sequelize"
    }
};

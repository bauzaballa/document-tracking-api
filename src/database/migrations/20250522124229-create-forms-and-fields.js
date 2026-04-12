"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Crear tipo ENUM actualizado
        const enumExists = await queryInterface.sequelize.query(
            `
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'enum_formfields_type'
      );
    `,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        // Si el ENUM ya existe, droparlo y recrearlo con los nuevos valores
        if (enumExists[0].exists) {
            await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS "enum_formfields_type" CASCADE;
      `);
        }

        // Crear ENUM con todos los valores
        await queryInterface.sequelize.query(`
      CREATE TYPE "enum_formfields_type" AS ENUM (
        'texto',
        'opcion-multiple',
        'checkbox',
        'dropdown',
        'grupo-texto-corto',
        'imagen',
        'fecha',
        'url',
        'nota',
        'archivo',
        'none',
        'textarea',
        'numero'
      );
    `);

        // 2. Crear tabla Forms (sin cambios)
        await queryInterface.createTable("Forms", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            departmentId: {
                type: Sequelize.INTEGER,
                allowNull: true // Cambiado de false a true para coincidir con el modelo
            },
            departmentName: {
                type: Sequelize.STRING,
                allowNull: true
            },
            unit: {
                type: Sequelize.STRING,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM("active", "inactive"),
                defaultValue: "active"
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

        // 3. Crear tabla FormFields actualizada
        await queryInterface.createTable("FormFields", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            formId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Forms",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            label: {
                type: Sequelize.STRING,
                allowNull: false
            },
            type: {
                type: "enum_formfields_type",
                allowNull: false,
                defaultValue: "texto"
            },
            required: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            options: {
                type: Sequelize.JSON,
                allowNull: true
            },
            text: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            order: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            // Nuevos campos
            isMultiple: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            limitFile: {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 1
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
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("FormFields");
        await queryInterface.dropTable("Forms");
        // Eliminar el ENUM
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_formfields_type";');
    }
};

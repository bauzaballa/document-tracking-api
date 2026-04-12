"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async transaction => {
            // 1. Crear ENUMs necesarios (con verificación manual)
            const checkEnum = async (enumName, values) => {
                const result = await queryInterface.sequelize.query(
                    `SELECT EXISTS (
                        SELECT 1 FROM pg_type WHERE typname = '${enumName}'
                    ) as exists;`,
                    { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
                );

                if (!result[0].exists) {
                    await queryInterface.sequelize.query(`CREATE TYPE "${enumName}" AS ENUM (${values});`, {
                        transaction
                    });
                }
            };

            await checkEnum(
                "enum_taskfields_type",
                `'texto', 'opcion-multiple', 'checkbox', 'dropdown', 'grupo-texto-corto', 'imagen', 'fecha', 'url', 'nota', 'archivo', 'none', 'textarea', 'numero'`
            );

            await checkEnum("enum_tasksteps_typestep", `'director', 'colaborador'`);

            await checkEnum("enum_applicants_status", `'cancel', 'pending', 'approved'`);

            // 2. Crear TaskTemplates
            await queryInterface.createTable(
                "TaskTemplates",
                {
                    id: {
                        allowNull: false,
                        autoIncrement: true,
                        primaryKey: true,
                        type: Sequelize.INTEGER
                    },
                    title: {
                        type: Sequelize.STRING
                    },
                    subarea: {
                        type: Sequelize.STRING,
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
                },
                { transaction }
            );

            // 3. Crear TaskSteps
            await queryInterface.createTable(
                "TaskSteps",
                {
                    id: {
                        allowNull: false,
                        autoIncrement: true,
                        primaryKey: true,
                        type: Sequelize.INTEGER
                    },
                    title: {
                        type: Sequelize.STRING
                    },
                    subTitle: {
                        type: Sequelize.STRING,
                        allowNull: true
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
                    typeStep: {
                        type: Sequelize.ENUM("director", "colaborador"),
                        defaultValue: "director"
                    },
                    stepStatus: {
                        type: Sequelize.BOOLEAN,
                        defaultValue: false
                    },
                    order: {
                        type: Sequelize.INTEGER,
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
                },
                { transaction }
            );

            await queryInterface.addIndex("TaskSteps", ["taskTemplateId"], { transaction });

            // 4. Crear Applicants
            await queryInterface.createTable(
                "Applicants",
                {
                    id: {
                        type: Sequelize.UUID,
                        defaultValue: Sequelize.UUIDV4,
                        primaryKey: true,
                        allowNull: false
                    },
                    status: {
                        type: Sequelize.ENUM("cancel", "pending", "approved"),
                        defaultValue: "pending",
                        allowNull: false
                    },
                    statusDirector: {
                        type: Sequelize.BOOLEAN,
                        defaultValue: false
                    },
                    statusColaborador: {
                        type: Sequelize.BOOLEAN,
                        defaultValue: false
                    },
                    statusRequest: {
                        type: Sequelize.BOOLEAN,
                        defaultValue: false
                    },
                    taskStepId: {
                        type: Sequelize.INTEGER,
                        allowNull: true,
                        references: {
                            model: "TaskSteps",
                            key: "id"
                        },
                        onUpdate: "CASCADE",
                        onDelete: "CASCADE"
                    },
                    taskId: {
                        type: Sequelize.INTEGER,
                        allowNull: true
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
                },
                { transaction }
            );

            await queryInterface.addIndex("Applicants", ["taskStepId"], { transaction });
            await queryInterface.addIndex("Applicants", ["status"], { transaction });
            await queryInterface.addIndex("Applicants", ["taskId"], { transaction });

            // 5. Agregar columna taskTemplateId en Tasks (si existe)
            const tableExists = await queryInterface.sequelize.query(
                `SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'Tasks'
                );`,
                { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
            );

            if (tableExists[0].exists) {
                const columnExists = await queryInterface.sequelize.query(
                    `SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_name = 'Tasks' AND column_name = 'taskTemplateId'
                    );`,
                    { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
                );

                if (!columnExists[0].exists) {
                    await queryInterface.addColumn(
                        "Tasks",
                        "taskTemplateId",
                        {
                            type: Sequelize.INTEGER,
                            allowNull: true,
                            references: {
                                model: "TaskTemplates",
                                key: "id"
                            },
                            onUpdate: "CASCADE",
                            onDelete: "SET NULL"
                        },
                        { transaction }
                    );
                }
            }

            // 6. Crear TaskFields
            await queryInterface.createTable(
                "TaskFields",
                {
                    id: {
                        allowNull: false,
                        autoIncrement: true,
                        primaryKey: true,
                        type: Sequelize.INTEGER
                    },
                    applicantId: {
                        type: Sequelize.UUID,
                        allowNull: true,
                        references: {
                            model: "Applicants",
                            key: "id"
                        },
                        onUpdate: "CASCADE",
                        onDelete: "CASCADE"
                    },
                    taskStepId: {
                        type: Sequelize.INTEGER,
                        allowNull: true,
                        references: {
                            model: "TaskSteps",
                            key: "id"
                        },
                        onUpdate: "CASCADE",
                        onDelete: "CASCADE"
                    },
                    label: {
                        type: Sequelize.STRING,
                        allowNull: true
                    },
                    directionMapOption: {
                        type: Sequelize.ENUM("row", "column", "grid"),
                        allowNull: true
                    },
                    showRequest: {
                        type: Sequelize.BOOLEAN,
                        defaultValue: true
                    },
                    type: {
                        type: Sequelize.ENUM(
                            "texto",
                            "opcion-multiple",
                            "checkbox",
                            "dropdown",
                            "grupo-texto-corto",
                            "imagen",
                            "fecha",
                            "url",
                            "nota",
                            "archivo",
                            "none",
                            "textarea",
                            "numero"
                        ),
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
                    isMultiple: {
                        type: Sequelize.BOOLEAN,
                        defaultValue: false
                    },
                    limitFile: {
                        type: Sequelize.INTEGER,
                        allowNull: true
                    },
                    order: {
                        type: Sequelize.INTEGER,
                        allowNull: false
                    },
                    text: {
                        type: Sequelize.TEXT,
                        allowNull: true
                    },
                    placeHolder: {
                        type: Sequelize.TEXT,
                        allowNull: true
                    },
                    fields: {
                        type: Sequelize.JSON,
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
                },
                { transaction }
            );

            await queryInterface.addIndex("TaskFields", ["applicantId"], { transaction });
            await queryInterface.addIndex("TaskFields", ["taskStepId"], { transaction });

            // 7. Constraint exclusivo TaskFields
            await queryInterface.sequelize.query(
                `ALTER TABLE "TaskFields"
                    ADD CONSTRAINT chk_taskfield_exclusive_ownership
                    CHECK (
                        ("taskStepId" IS NOT NULL AND "applicantId" IS NULL) OR
                        ("taskStepId" IS NULL AND "applicantId" IS NOT NULL)
                    );`,
                { transaction }
            );
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async transaction => {
            // 1. Eliminar constraint exclusivo de TaskFields
            await queryInterface.sequelize.query(
                `ALTER TABLE "TaskFields" DROP CONSTRAINT IF EXISTS chk_taskfield_exclusive_ownership;`,
                { transaction }
            );

            // 2. Eliminar índices
            await queryInterface.removeIndex("TaskFields", ["applicantId"], { transaction });
            await queryInterface.removeIndex("TaskFields", ["taskStepId"], { transaction });
            await queryInterface.removeIndex("Applicants", ["taskStepId"], { transaction });
            await queryInterface.removeIndex("Applicants", ["status"], { transaction });
            await queryInterface.removeIndex("Applicants", ["taskId"], { transaction });
            await queryInterface.removeIndex("TaskSteps", ["taskTemplateId"], { transaction });

            // 3. Eliminar tablas (en orden inverso por dependencias)
            await queryInterface.dropTable("TaskFields", { transaction });
            await queryInterface.dropTable("Applicants", { transaction });
            await queryInterface.dropTable("TaskSteps", { transaction });

            // 4. Eliminar FK de Tasks si existe
            const tableExists = await queryInterface.sequelize.query(
                `SELECT EXISTS (
                    SELECT FROM information_schema.columns
                    WHERE table_name='Tasks' AND column_name='taskTemplateId'
                );`,
                { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
            );

            if (tableExists[0].exists) {
                await queryInterface.removeColumn("Tasks", "taskTemplateId", { transaction });
            }

            // 5. Eliminar TaskTemplates
            await queryInterface.dropTable("TaskTemplates", { transaction });

            // 6. Eliminar ENUMs si existen
            const dropEnumIfExists = async enumName => {
                const result = await queryInterface.sequelize.query(
                    `SELECT EXISTS (
                        SELECT 1 FROM pg_type WHERE typname = '${enumName}'
                    ) as exists;`,
                    { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
                );

                if (result[0].exists) {
                    await queryInterface.sequelize.query(`DROP TYPE "${enumName}";`, { transaction });
                }
            };

            await dropEnumIfExists("enum_taskfields_type");
            await dropEnumIfExists("enum_tasksteps_typestep");
            await dropEnumIfExists("enum_applicants_status");
        });
    }
};

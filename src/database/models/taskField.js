"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class TaskField extends Model {
        static associate(models) {
            this.belongsTo(models.TaskStep, {
                foreignKey: "taskStepId",
                as: "taskStep"
            });

            this.belongsTo(models.Applicant, {
                foreignKey: "applicantId",
                as: "applicant"
            });

            this.hasMany(models.TaskFieldValue, {
                foreignKey: "taskFieldId",
                as: "values"
            });
        }
    }

    TaskField.init(
        {
            applicantId: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: "Applicants",
                    key: "id"
                }
            },
            taskStepId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            label: {
                type: DataTypes.STRING,
                allowNull: true
            },
            directionMapOption: {
                type: DataTypes.ENUM("row", "column", "grid")
            },
            showRequest: {
                //se usa en solicitudes
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            type: {
                type: DataTypes.ENUM(
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
                allowNull: false
            },
            required: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            options: {
                type: DataTypes.JSON,
                allowNull: true
            },
            isMultiple: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            limitFile: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            order: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            text: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            placeHolder: {
                type: DataTypes.TEXT
            },
            fields: {
                type: DataTypes.JSON,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: "TaskField"
        }
    );

    return TaskField;
};

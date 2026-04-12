"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class FormField extends Model {
        static associate(models) {
            FormField.belongsTo(models.Form, {
                foreignKey: "formId",
                as: "form"
            });
        }
    }

    FormField.init(
        {
            formId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            label: {
                type: DataTypes.STRING,
                allowNull: false
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
            order: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            text: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            isMultiple: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            limitFile: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 1
            }
        },
        {
            sequelize,
            modelName: "FormField",
            tableName: "FormFields"
        }
    );

    return FormField;
};

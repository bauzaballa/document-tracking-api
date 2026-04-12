"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Request extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Request.belongsTo(models.Form, {
                foreignKey: "formId",
                as: "form"
            });

            Request.hasOne(models.Task, {
                foreignKey: "requestId",
                as: "task"
            });
        }
    }
    Request.init(
        {
            title: DataTypes.STRING,
            departmentId: DataTypes.INTEGER,
            requestedByDepartmentId: DataTypes.INTEGER,
            unitId: DataTypes.INTEGER,
            receiverUserId: {
                type: DataTypes.UUID,
                allowNull: true
            },
            createdByUserId: {
                type: DataTypes.UUID,
                allowNull: false
            },
            formId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "Forms",
                    key: "id"
                }
            },
            priority: {
                type: DataTypes.ENUM,
                values: ["urgente", "media", "baja"]
            },
            content: DataTypes.TEXT,
            timeline: DataTypes.JSON,
            formResponse: DataTypes.JSON,
            status: {
                type: DataTypes.ENUM,
                values: ["pendiente", "aceptada", "finalizada", "rechazada"],
                defaultValue: "pendiente"
            },
            isCompleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            branchId: { type: DataTypes.INTEGER, allowNull: true }
        },
        {
            sequelize,
            modelName: "Request"
        }
    );
    return Request;
};

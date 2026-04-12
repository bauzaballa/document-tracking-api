"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Task extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            this.belongsTo(models.TasksList, {
                foreignKey: "listId",
                as: "tasks"
            });

            this.hasMany(models.TaskChecklist, {
                foreignKey: "taskId",
                as: "checklists"
            });

            this.hasMany(models.TaskFile, {
                foreignKey: "taskId",
                as: "files"
            });

            this.hasMany(models.TaskHistory, {
                foreignKey: "taskId",
                as: "histories"
            });

            this.belongsTo(models.TaskTemplate, {
                foreignKey: "taskTemplateId",
                as: "taskTemplate"
            });

            this.hasMany(models.TaskFieldValue, {
                foreignKey: "taskId",
                as: "fieldValues"
            });

            this.belongsTo(models.Request, {
                foreignKey: "requestId",
                as: "request"
            });
        }
    }
    Task.init(
        {
            title: DataTypes.STRING,
            listId: DataTypes.INTEGER,
            departmentId: DataTypes.INTEGER,
            userIds: DataTypes.TEXT,
            userIdCreated: DataTypes.TEXT,
            priority: {
                type: DataTypes.ENUM,
                values: ["urgente", "medio", "baja"]
            },
            status: {
                type: DataTypes.ENUM,
                values: ["pendiente", "en-proceso", "completada", "vencida", "cancelada"]
            },
            description: DataTypes.TEXT,
            startDate: DataTypes.DATEONLY,
            dueDate: DataTypes.DATEONLY,
            isDraft: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            subareaId: DataTypes.INTEGER,
            category: {
                type: DataTypes.ENUM,
                values: ["Comercial", "No comercial"],
                defaultValue: "No comercial"
            },
            position: { type: DataTypes.TEXT, allowNull: true, defaultValue: null }, //puesto
            unitId: DataTypes.INTEGER,
            requestId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "Requests",
                    key: "id"
                }
            }
        },
        {
            sequelize,
            modelName: "Task"
        }
    );
    return Task;
};

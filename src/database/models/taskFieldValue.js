"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class TaskFieldValue extends Model {
        static associate(models) {
            this.belongsTo(models.TaskField, {
                foreignKey: "taskFieldId",
                as: "taskField"
            });

            this.belongsTo(models.Task, {
                foreignKey: "taskId",
                as: "task"
            });
        }
    }

    TaskFieldValue.init(
        {
            taskFieldId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            taskId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            value: {
                type: DataTypes.TEXT,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: "TaskFieldValue"
        }
    );

    return TaskFieldValue;
};

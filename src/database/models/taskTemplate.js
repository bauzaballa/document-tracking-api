"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class TaskTemplate extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.hasMany(models.Task, {
                foreignKey: "taskTemplateId",
                as: "tasks",
                onDelete: "CASCADE"
            });

            this.hasMany(models.TaskStep, {
                foreignKey: "taskTemplateId",
                as: "taskSteps"
            });
        }
    }
    TaskTemplate.init(
        {
            title: DataTypes.STRING,
            subarea: DataTypes.STRING
        },
        {
            sequelize,
            modelName: "TaskTemplate"
        }
    );
    return TaskTemplate;
};

"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class TaskStep extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.belongsTo(models.TaskTemplate, {
                foreignKey: "taskTemplateId",
                as: "taskTemplate"
            });

            this.hasMany(models.TaskField, {
                foreignKey: "taskStepId",
                as: "taskFields",
                onDelete: "CASCADE"
            });
            this.hasMany(models.Applicant, {
                foreignKey: "taskStepId",
                as: "applicants",
                onDelete: "CASCADE"
            });
        }
    }
    TaskStep.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            title: DataTypes.STRING,
            subTitle: DataTypes.STRING,
            taskTemplateId: DataTypes.INTEGER,
            typeStep: { type: DataTypes.ENUM("director", "colaborador"), defaultValue: "director" },
            stepStatus: { type: DataTypes.BOOLEAN, defaultValue: false },
            order: DataTypes.INTEGER
        },
        {
            sequelize,
            modelName: "TaskStep"
        }
    );
    return TaskStep;
};

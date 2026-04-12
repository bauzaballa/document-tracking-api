"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Applicant extends Model {
        static associate(models) {
            this.hasMany(models.ObservationApplicant, {
                foreignKey: "applicantId",
                as: "observations"
            });

            this.belongsTo(models.TaskStep, {
                foreignKey: "taskStepId",
                as: "taskStep"
            });
            this.hasMany(models.TaskField, {
                foreignKey: "applicantId",
                as: "taskFields"
            });
        }
    }

    Applicant.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            status: {
                type: DataTypes.ENUM("cancel", "pending", "approved"),
                defaultValue: "pending"
            },
            statusDirector: {
                type: DataTypes.BOOLEAN,
                defaultValue: "false"
            },
            statusColaborador: {
                type: DataTypes.BOOLEAN,
                defaultValue: "false"
            },
            statusRequest: {
                type: DataTypes.BOOLEAN,
                defaultValue: "false"
            },
            taskStepId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            taskId: {
                type: DataTypes.INTEGER,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: "Applicant",
            timestamps: true
        }
    );
    return Applicant;
};

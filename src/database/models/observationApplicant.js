"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class ObservationApplicant extends Model {
        static associate(models) {
            // Define association here
            this.belongsTo(models.Applicant, {
                foreignKey: "applicantId",
                as: "applicant"
            });

            this.belongsTo(models.TaskStep, {
                foreignKey: "taskStepId",
                as: "taskStep"
            });
        }
    }
    ObservationApplicant.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            type: {
                type: DataTypes.ENUM,
                values: ["request", "task"],
                defaultValue: "task"
            },
            applicantId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "Applicants",
                    key: "id"
                }
            },
            userId: DataTypes.TEXT,
            taskStepId: {
                type: DataTypes.INTEGER,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: "ObservationApplicant",
            tableName: "observationApplicants",
            timestamps: true
        }
    );
    return ObservationApplicant;
};

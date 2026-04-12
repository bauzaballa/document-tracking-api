"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class JobPosition extends Model {
        static associate(models) {}
    }

    JobPosition.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: "JobPosition",
            timestamps: true
        }
    );
    return JobPosition;
};

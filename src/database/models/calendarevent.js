"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class CalendarEvent extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    CalendarEvent.init(
        {
            userId: DataTypes.UUID,
            title: DataTypes.STRING,
            date: DataTypes.DATE,
            description: DataTypes.TEXT,
            notification: DataTypes.STRING,
            wasNotified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            googleEventId: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: "CalendarEvent"
        }
    );
    return CalendarEvent;
};

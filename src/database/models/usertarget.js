'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserTarget extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UserTarget.init({
    userId: DataTypes.UUID,
    description: DataTypes.TEXT,
    startDate: DataTypes.DATEONLY,
    dueDate: DataTypes.DATEONLY,
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'UserTarget',
  });
  return UserTarget;
};
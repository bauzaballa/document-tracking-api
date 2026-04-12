'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TasksList extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Task, {
        foreignKey: "listId",
        as: "tasks"
      });
    }
  }
  TasksList.init({
    name: DataTypes.STRING,
    departmentId: DataTypes.INTEGER,
    colorHex: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'TasksList',
  });
  return TasksList;
};
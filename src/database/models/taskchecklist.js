'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TaskChecklist extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Task, {
        foreignKey: "taskId",
        as: "checklists"
      });
    }
  }
  TaskChecklist.init({
    title: DataTypes.STRING,
    taskId: DataTypes.INTEGER,
    checks: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'TaskChecklist',
  });
  return TaskChecklist;
};
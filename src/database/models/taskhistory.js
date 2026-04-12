'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TaskHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Task, {
        foreignKey: "taskId",
        as: "histories"
      });
    }
  }
  TaskHistory.init({
    taskId: DataTypes.INTEGER,
    userId: DataTypes.UUID,
    content: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'TaskHistory',
  });
  return TaskHistory;
};
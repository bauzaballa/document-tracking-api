'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TaskFile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Task, {
        foreignKey: "taskId",
        as: "files"
      });
    }
  }
  TaskFile.init({
    taskId: DataTypes.INTEGER,
    fileUrl: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'TaskFile',
  });
  return TaskFile;
};
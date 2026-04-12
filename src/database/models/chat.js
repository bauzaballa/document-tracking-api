'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.ChatMessage, {
        foreignKey: "chatId",
        as: "chatMessages"
      });
    }
  }
  Chat.init({
    user1Id: DataTypes.UUID,
    user2Id: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Chat',
  });
  return Chat;
};
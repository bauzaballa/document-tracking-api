'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Chat, {
        foreignKey: "chatId",
        as: "chatMessages"
      });
    }
  }
  ChatMessage.init({
    chatId: DataTypes.INTEGER,
    userId: DataTypes.UUID,
    message: DataTypes.TEXT,
    wasRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isBuzz: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fileUrl: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'ChatMessage',
  });
  return ChatMessage;
};
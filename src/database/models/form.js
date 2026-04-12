'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Form extends Model {
    static associate(models) {
      Form.hasMany(models.FormField, {
        foreignKey: 'formId',
        as: 'fields'
      });

      Form.hasMany(models.Request, {
        foreignKey: 'formId',
        as: 'requests'
      });

      Form.hasMany(models.FormDepartment, {
        foreignKey: 'formId',
        as: 'formDepartments'
      });
    }
  }

  Form.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    departmentName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Form',
    tableName: 'Forms',
    underscored: false,
    name: {
      singular: 'Form',
      plural: 'Forms'
    }
  });

  return Form;
};
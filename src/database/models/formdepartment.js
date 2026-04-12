'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class FormDepartment extends Model {
    }

    FormDepartment.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        formId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        departmentId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'FormDepartment',
        tableName: 'FormDepartments'
    });

    return FormDepartment;
};

const db = require('../../database/db');
const Form = db.Form;
const FormField = db.FormField;
const FormDepartment = db.FormDepartment;

class FormController {
  async getAll(req, res) {
    try {
      const form = await Form.findAll({
        where: { status: 'active' },
        include: [
          {
            model: FormField,
            as: 'fields',
            order: [['order', 'ASC']]
          },
          {
            model: FormDepartment,
            as: 'formDepartments'
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.json(form);
    } catch (error) {
      console.error('Error al obtener los formularios:', error);
      res.status(500).json({
        message: 'Error al obtener los formularios',
        error: error.message
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;

      const form = await Form.findOne({
        where: {
          id
        },
        include: [
          {
            model: FormField,
            as: 'fields',
            order: [['order', 'ASC']]
          },
          {
            model: FormDepartment,
            as: 'formDepartments'
          }
        ]
      });

      if (!form) {
        return res.status(404).json({ message: 'Formulario no encontrado' });
      }

      res.json(form);
    } catch (error) {
      console.error('Error al obtener el formulario:', error);
      res.status(500).json({ message: 'Error al obtener el formulario' });
    }
  }

  async create(req, res) {
    try {
      const { title, description, unit, departmentIds, departmentNames, fields } = req.body;

      const form = await Form.create({
        title,
        description,
        unit,
        departmentId: departmentIds && departmentIds.length > 0 ? departmentIds[0] : null,
        departmentName: departmentNames && departmentNames.length > 0 ? departmentNames[0] : null
      });

      if (departmentIds && Array.isArray(departmentIds)) {
        const relaciones = departmentIds.map(departmentId => ({
          formId: form.id,
          departmentId
        }));
        await FormDepartment.bulkCreate(relaciones);
      }

      if (fields && Array.isArray(fields)) {
        const formFields = fields.map((field, index) => ({
          ...field,
          formId: form.id,
          order: index
        }));
        await FormField.bulkCreate(formFields);
      }

      const createdForm = await Form.findByPk(form.id, {
        include: [
          {
            model: FormField,
            as: 'fields',
            order: [['order', 'ASC']]
          },
          {
            model: FormDepartment,
            as: 'formDepartments'
          }
        ]
      });

      res.json(createdForm);
    } catch (error) {
      console.error('Error al crear el formulario:', error);
      res.status(500).json({ message: 'Error al crear el formulario' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, description, status, fields, unit, departmentIds, departmentNames } = req.body;

      const form = await Form.findByPk(id);
      if (!form) {
        return res.status(404).json({ message: 'Formulario no encontrado' });
      }

      await form.update({
        title,
        description,
        status,
        unit,
        departmentId: departmentIds && departmentIds.length > 0 ? departmentIds[0] : null,
        departmentName: departmentNames && departmentNames.length > 0 ? departmentNames[0] : null
      });

      if (departmentIds && Array.isArray(departmentIds)) {
        await FormDepartment.destroy({ where: { formId: id } });
        const relaciones = departmentIds.map(departmentId => ({
          formId: id,
          departmentId
        }));
        await FormDepartment.bulkCreate(relaciones);
      }

      if (fields && Array.isArray(fields)) {
        await FormField.destroy({ where: { formId: id } });
        const formFields = fields.map((field, index) => ({
          ...field,
          formId: id,
          order: index
        }));
        await FormField.bulkCreate(formFields);
      }

      const updatedForm = await Form.findByPk(id, {
        include: [
          {
            model: FormField,
            as: 'fields',
            order: [['order', 'ASC']]
          },
          {
            model: FormDepartment,
            as: 'formDepartments'
          }
        ]
      });

      res.json(updatedForm);
    } catch (error) {
      console.error('Error al actualizar el formulario:', error);
      res.status(500).json({ message: 'Error al actualizar el formulario' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      const form = await Form.findByPk(id);
      if (!form) {
        return res.status(404).json({ message: 'Formulario no encontrado' });
      }

      await form.update({ status: 'inactive' });

      res.json({ message: 'Formulario eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar el formulario:', error);
      res.status(500).json({ message: 'Error al eliminar el formulario' });
    }
  }

  async getByDepartment(req, res) {
    try {
      const { departmentId } = req.params;

      // Buscar los formIds asociados a ese departmentId
      const relaciones = await FormDepartment.findAll({
        where: { departmentId },
        attributes: ['formId']
      });

      const formIds = relaciones.map(r => r.formId);

      const forms = await Form.findAll({
        where: {
          id: formIds
        },
        include: [
          {
            model: FormField,
            as: 'fields',
            order: [['order', 'ASC']]
          },
          {
            model: FormDepartment,
            as: 'formDepartments'
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json(forms);
    } catch (error) {
      console.error('Error al obtener formularios por departamento:', error);
      res.status(500).json({ message: 'Error al obtener formularios por departamento' });
    }
  }
}

module.exports = new FormController();

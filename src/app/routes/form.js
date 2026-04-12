const express = require('express');
const router = express.Router();
const formController = require('../controllers/form');

// Obtener todos los formularios
router.get('/', formController.getAll);

// Obtener un formulario por ID
router.get('/:id', formController.getById);

// Crear un nuevo formulario
router.post('/', formController.create);

// Obtener formularios por departamento
router.get('/department/:departmentId', formController.getByDepartment);

// Actualizar un formulario
router.put('/:id', formController.update);

// Eliminar un formulario (soft delete)
router.delete('/:id', formController.delete);

module.exports = router;
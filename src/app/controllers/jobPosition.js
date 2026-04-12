const { JobPosition } = require("@/database/db");

/**
 * Controlador para gestionar las operaciones CRUD de cargos/posiciones laborales
 * @class JobPositionController
 */
class JobPositionController {
    /**
     * Crea una nueva instancia del controlador de cargos
     * @constructor
     */
    constructor() {}

    /**
     * Crear un nuevo cargo/posición laboral
     * @method create
     * @async
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} req.body - Cuerpo de la solicitud
     * @param {string} req.body.name - Nombre del cargo (requerido)
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     * @throws {Error} Error al crear el cargo
     */
    create = async (req, res) => {
        try {
            const data = req.body;
            if (!data.name) {
                return res.status(400).json({ message: "El nombre es requerido" });
            }
            const newData = {
                name: data.name
            };

            const newJob = await JobPosition.create(newData);
            res.status(201).send(newJob);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    };

    /**
     * Actualizar un cargo existente
     * @method update
     * @async
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} req.params - Parámetros de la URL
     * @param {string} req.params.id - ID del cargo a actualizar
     * @param {Object} req.body - Cuerpo de la solicitud
     * @param {string} [req.body.name] - Nuevo nombre del cargo (opcional)
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     * @throws {Error} Error al actualizar el cargo
     */
    update = async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const job = await JobPosition.findByPk(id);
            if (!job) return res.status(404).json({ message: "No encontrado" });

            job.name = name || job.name;
            await job.save();

            res.status(200).json(job);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    };

    /**
     * Obtener todos los cargos ordenados alfabéticamente
     * @method getAll
     * @async
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     * @throws {Error} Error al obtener los cargos
     */
    getAll = async (req, res) => {
        try {
            const jobs = await JobPosition.findAll({
                order: [["name", "ASC"]]
            });
            res.status(200).send(jobs);
        } catch (error) {
            console.error(error);
            res.status(500).send({ error: error.message });
        }
    };

    /**
     * Obtener un cargo específico por su ID
     * @method getById
     * @async
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} req.params - Parámetros de la URL
     * @param {string} req.params.id - ID del cargo a buscar
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     * @throws {Error} Error al obtener el cargo
     */
    getById = async (req, res) => {
        try {
            const { id } = req.params;
            const job = await JobPosition.findByPk(id);
            if (!job) return res.status(404).json({ message: "No encontrado" });
            res.status(200).json(job);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    };

    /**
     * Eliminar un cargo existente
     * @method delete
     * @async
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} req.params - Parámetros de la URL
     * @param {string} req.params.id - ID del cargo a eliminar
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     * @throws {Error} Error al eliminar el cargo
     */
    delete = async (req, res) => {
        try {
            const { id } = req.params;
            const job = await JobPosition.findByPk(id);
            if (!job) return res.status(404).json({ message: "No encontrado" });

            await job.destroy();
            res.status(200).json({ message: "Cargo eliminado correctamente" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    };
}

module.exports = JobPositionController;

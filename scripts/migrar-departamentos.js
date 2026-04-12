const { Sequelize } = require('sequelize');
const db = require('../src/database/db');

/**
 * Script para migrar los datos del campo departmentId de la tabla Forms
 * a la nueva tabla intermedia FormDepartments.
 *
 * Útil para conservar compatibilidad con formularios antiguos
 * al adoptar el nuevo modelo multidepartamental.
 */

const Form = db.Form;
const FormDepartment = db.FormDepartment;

async function migrarDepartamentos() {
    try {
        console.log('🔍 Buscando formularios con departmentId...');
        const formularios = await Form.findAll({
            where: {
                departmentId: {
                    [Sequelize.Op.not]: null
                }
            }
        });

        if (!formularios.length) {
            console.log('✅ No hay formularios con departmentId. Nada que migrar.');
            return;
        }

        const relaciones = formularios.map((form) => ({
            formId: form.id,
            departmentId: form.departmentId
        }));

        console.log(`➡️ Insertando ${relaciones.length} registros en FormDepartments...`);
        await FormDepartment.bulkCreate(relaciones);

        console.log('✅ Migración completada con éxito.');
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        console.log('🔒 Conexión cerrada.');
    }
}

migrarDepartamentos();

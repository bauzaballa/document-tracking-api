// Parsea el value a JSON.stringify
function parserValueToString(value) {
    if (value === null || value === undefined) {
        return null;
    }

    // Si ya es string, devolverlo tal cual
    if (typeof value === "string") {
        return value.trim() === "" ? null : value;
    }

    try {
        return JSON.stringify(value);
    } catch (error) {
        return String(value);
    }
}

// Parsea de JSON.stringify a value
const parseValueStringToValue = value => {
    // Si el valor es null, undefined o vacío, retornar null
    if (value === null || value === undefined || value === "" || value === " ") {
        return null;
    }

    // Si ya es un objeto o array, retornarlo directamente
    if (typeof value === "object" && value !== null) {
        return value;
    }

    // Si es string, intentar parsear como JSON
    if (typeof value === "string") {
        // Limpiar el string de espacios en blanco
        const cleanValue = value.trim();

        // Si está vacío después de limpiar, retornar null
        if (cleanValue === "") {
            return null;
        }

        try {
            const parsed = JSON.parse(cleanValue);
            return parsed;
        } catch (error) {
            // Si no es JSON válido, retornar el string original
            return value;
        }
    }

    // Para cualquier otro tipo (number, boolean, etc.), retornar tal cual
    return value;
};

function isValidStringValue(value) {
    return value !== null && value !== "" && value !== "null";
}

module.exports = { parserValueToString, parseValueStringToValue, isValidStringValue };

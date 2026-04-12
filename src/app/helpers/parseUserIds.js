const parseUserIds = (raw) => {
    if (!raw) return [];

    // Quitar triples comillas """ al principio y final si existen
    raw = raw.trim();
    if (raw.startsWith('"""') && raw.endsWith('"""')) {
        raw = raw.slice(3, -3);
    } else if (raw.startsWith('"') && raw.endsWith('"')) {
        raw = raw.slice(1, -1);
    }

    // Ahora, intentar parsear JSON si empieza con [
    if (raw.startsWith("[")) {
        try {
            // Algunos strings tienen dobles comillas escapadas, limpiar
            const cleaned = raw.replace(/""/g, '"').replace(/\\"/g, '"');
            const parsed = JSON.parse(cleaned);

            if (Array.isArray(parsed)) {
                // parsed puede ser ["id1","id2"] o ["id1,id2"]
                // Si algún elemento tiene comas, hacer split
                const result = [];
                for (const item of parsed) {
                    if (typeof item === "string" && item.includes(",")) {
                        result.push(...item.split(",").map(i => i.trim()));
                    } else if (typeof item === "string") {
                        result.push(item.trim());
                    }
                }
                return result;
            }
        } catch {
            // si falla JSON.parse, seguir con el siguiente paso
        }
    }

    // Si no es JSON, o falló el parseo: puede ser coma separado simple
    // Separar por coma y limpiar espacios
    return raw.split(",").map(i => i.trim());
}

module.exports = parseUserIds;
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload to AWS S3 Middleware
 *
 * @param {string} subFolderName - Name of subfolder where the file will be upload
 * @param {string} base64File - Base64 format of the file 
 * @param {string} name - Name of the file
 */
const uploadToS3 = async (subFolderName, base64File, name) => {
  try {
    // Convertir Base64 en Buffer
    const base64Data = base64File.replace(/^data:.+;base64,/, ""); // Elimina el prefijo
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Importación dinámica de `file-type`
    const { fileTypeFromBuffer } = await import('file-type');

    // Detectar tipo de archivo y extensión
    const type = await fileTypeFromBuffer(fileBuffer);
    if (!type) throw new Error("No se pudo determinar el tipo de archivo.");

    const { mime: contentType, ext: extension } = type; // Obtiene MIME y extensión

    // Parámetros para S3
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `Direcciones/${subFolderName}/${name}-${Date.now()}.${extension}`, // Nombre en S3
      Body: fileBuffer,
      // ACL: 'public-read',
      ContentType: contentType,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const fileUrl = `https://${params.Bucket}.s3.us-east-1.amazonaws.com/${params.Key}`

    return fileUrl; // Retorna la clave del archivo en S3
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error; // Lanza el error para manejo externo
  }
};

module.exports = uploadToS3;

// ===== EJEMPLO USO =====
// uploadFile('Mailing', base64Image, 'imageName');
// uploadFile('Comprobantes', base64PDF, 'documentName');
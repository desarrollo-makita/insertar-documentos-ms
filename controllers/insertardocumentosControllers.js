const sql = require("mssql");
const logger = require("../config/logger.js");
const {
  connectToDatabase,
  closeDatabaseConnection,
} = require("../config/database.js");
const moment = require("moment");
const axios = require("axios");

/**
 * Insertamos pedidos en tabla pedidos
 * @param {*} data
 * @returns
 */
async function insertarDocumentos(req, res) {
  let data = req.body;
  logger.info(
    `Iniciamos la función insertarDocumentos ${JSON.stringify(data)}`
  );
  let result;
  let responseDataList;
  let response = [];

  try {
    // Conectarse a la base de datos 'Telecontrol'
    await connectToDatabase("Telecontrol");

    // Preparar datos
    responseDataList = await prepareData(data); // Asegúrate de usar await aquí

    console.log(responseDataList);

    // Insertar datos
    for (const documento of responseDataList) {
      const request = new sql.Request(); // Nueva instancia de request en cada iteración

      const {
        idPedido: ID_Pedido,
        tabla: Tabla,
        subtabla: Subtabla,
        archivo: Archivo,
        fecha: Fecha,
        usuario: Usuario,
        descripcion: Descripcion,
        os: ID_OS,
        nombreArchivo: NombreArchivo,
        imagenBinario: ImagenBinario,
      } = documento;

      // Ejecutar el procedimiento almacenado con los parámetros
      result = await request
        .input(
          "ID_Pedido",
          sql.VarChar(40),
          ID_Pedido !== undefined ? ID_Pedido.toString() : null
        )
        .input("Empresa", sql.VarChar(40), "Makita")
        .input("Tabla", sql.VarChar(40), Tabla)
        .input("Subtabla", sql.VarChar(40), Subtabla)
        .input("Archivo", sql.VarChar(200), Archivo)
        .input("Fecha", sql.VarChar, formatDate(Fecha))
        .input("Usuario", sql.VarChar(40), Usuario)
        .input("Descripcion", sql.VarChar(40), Descripcion)
        .input("NombreArchivo", sql.VarChar(255), NombreArchivo)
        .input(
          "ID_OS",
          sql.VarChar(20),
          ID_OS !== undefined ? ID_OS.toString() : null
        )
        .input("ImagenBinario", sql.Image, ImagenBinario) // Usar sql.Image para SQL Server 2010
        .output("Insertado", sql.Int)
        .output("ResultadoID", sql.VarChar)
        .execute("insertaDocumentosSP");

      result.data = documento;
      let resultSP = {
        data: documento,
        output: result.output,
      };

      response.push(resultSP);
    }

    logger.info(
      `Fin de la función insertarDocumentos ${JSON.stringify(response)}`
    );
    res.status(200).json(response);
  } catch (error) {
    // Manejamos cualquier error ocurrido durante el proceso
    logger.error(`Error en insertarDocumentos: ${error.message}`);
    res.status(500).json({
      error: `Error en el servidor [insertar-documentos-ms]: ${error.message}`,
    });
  } finally {
    await closeDatabaseConnection();
  }
}

/**
 * Formateamos Fecha
 * @param {*} date
 * @returns
 */
function formatDate(date) {
  if (date != null) {
    const fechaMoment = moment(date, "DD-MM-YYYY");
    const fechaFormateada = fechaMoment.format("YYYY-MM-DD");
    return fechaFormateada;
  }
}
function generateRandomSpecialChars(length = 3) {
  const specialChars = "!@#$%^&*()_+[]{}|;:,.<>?";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * specialChars.length);
    result += specialChars[randomIndex];
  }
  return result;
}

async function prepareData(data) {
  let request = [];
  for (const element of data) {
    for (const archivo of element.arregloLink) {
      const imagenBinario = await convertImageToBinary(archivo.link); // Asegúrate de usar await aquí
      // Generar sufijo de 3 caracteres especiales
      const specialSuffix = generateRandomSpecialChars();

      // Crear el nombre de archivo con el sufijo añadido
      const fileNameParts = archivo.filename.split(".");
      const baseName = fileNameParts.slice(0, -1).join("."); // Nombre sin extensión
      const extension =
        fileNameParts.length > 1 ? `.${fileNameParts.pop()}` : ""; // Extensión del archivo
      const nombreArchivoUnico = `${baseName}${specialSuffix}${extension}`;

      request.push({
        tabla: "DOCUMENTO",
        subtabla: "NOTA DE VTA INTERNA",
        archivo: archivo.link,
        fecha: archivo.data,
        usuario: element.cnpj,
        descripcion: `Documento de la orden ${element.os}`,
        idPedido: element.idPedido,
        os: element.os,
        nombreArchivo: nombreArchivoUnico,
        imagenBinario: imagenBinario, // Buffer directamente
      });
    }
  }
  return request;
}

async function convertImageToBinary(url) {
  try {
    // Descargar la imagen
    const response = await axios.get(url, { responseType: "arraybuffer" });

    // Obtener el buffer de la imagen
    const imageBuffer = Buffer.from(response.data);

    if (!Buffer.isBuffer(imageBuffer)) {
      throw new Error("El buffer de imagen no es válido.");
    }

    console.log("Buffer de imagen:", imageBuffer);

    // Devolver el buffer directamente
    return imageBuffer;
  } catch (error) {
    console.error("Error al convertir la imagen:", error.message);
    throw error;
  }
}

module.exports = {
  insertarDocumentos,
};

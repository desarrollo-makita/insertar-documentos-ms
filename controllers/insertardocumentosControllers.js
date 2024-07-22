const sql = require('mssql');
const logger = require('../config/logger.js');
const { connectToDatabase, closeDatabaseConnection } = require('../config/database.js');
const moment = require('moment');




/**
 * Insertamos pedidos en tabla pedidos
 * @param {*} data 
 * @returns 
 */
async function insertarDocumentos(req , res) {
    let data = req.body
    logger.info(`Iniciamos la funcion insertarDocumentos ${JSON.stringify(data)}`);
    let result;
    let responseData = [];
    
    try {
        // Conectarse a la base de datos 'telecontrol'
        await connectToDatabase('Telecontrol');
      
        // Armamos data que vamos a mandar al procedimiento almacenado
        for (const documento of data) {
           
            const request = new sql.Request(); // Nueva instancia de request en caditeracióna 
           
            const {
                idPedido:  ID_Pedido,
                tabla: Tabla,
                subtabla: Subtabla,
                archivo: Archivo,
                fecha: Fecha,
                usuario: Usuario,
                descripcion : Descripcion,
                ordenID  : ID_OS
            
            } = documento;
           
            // Ejecutar el procedimiento almacenado con los parámetros
             result = await request
                .input('ID_Pedido', sql.VarChar(40), ID_Pedido)
                .input('Empresa', sql.VarChar(40), "Makita")
                .input('Tabla', sql.VarChar(40), Tabla)
                .input('Subtabla', sql.VarChar(40), Subtabla)
                .input('Archivo', sql.VarChar(200), Archivo.trim())
                .input('Fecha', sql.VarChar, formatDate(Fecha))
                .input('Usuario', sql.VarChar(40), Usuario)
                .input('Descripcion', sql.VarChar(40), Descripcion)
                input('ID_OS', sql.VarChar(20), ID_OS)
            2  .output('Insertado', sql.Int)
                .output('ResultadoID', sql.VarChar)
      
                .execute('insertaDocumentosSP');
                
                result.data = documento;
                responseData.push(result);
               
               
        }
        
        await closeDatabaseConnection();
        logger.info(`Fin de la funcion insertarDocumentos ${JSON.stringify(responseData)}`);
        res.status(200).json(responseData);
    
    } catch (error) {
        // Manejamos cualquier error ocurrido durante el proceso
        logger.error(`Error en insertarDocumentos: ${error.message}`);
        res.status(500).json({ error: `Error en el servidor [insertar-documentos-ms] :  ${error.message}`  });
    }
}

/**
 * Formateamos Fecha
 * @param {*} date 
 * @returns 
 */
function formatDate(date) {
    console.log("fechaFormated : " , date); 
    if(date != null){
        const fechaMoment = moment(date, "DD-MM-YYYY");
        const fechaFormateada = fechaMoment.format("YYYY-MM-DD");
        console.log("fechaFormated : " , fechaFormateada); 
        return fechaFormateada;
    }
}

module.exports = {
    insertarDocumentos
};

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
  
    let responseDataList;
    let response = [];
    
    try {
        // Conectarse a la base de datos 'telecontrol'
        await connectToDatabase('Telecontrol');

        responseDataList =  prepareData(data);
      

        console.log("****VAMOS A ITERAR SOBRE ESTE ARREGLO DE DATOS" , responseDataList);
        // Armamos data que vamos a mandar al procedimiento almacenado
        for (const documento of responseDataList) {
           
            const request = new sql.Request(); // Nueva instancia de request en caditeracióna 
           
            const {
                idPedido:  ID_Pedido,
                tabla: Tabla,
                subtabla: Subtabla,
                archivo: Archivo,
                fecha: Fecha,
                usuario: Usuario,
                descripcion : Descripcion,
                os  : ID_OS
            
            } = documento;
           
            // Ejecutar el procedimiento almacenado con los parámetros
             result = await request
                .input('ID_Pedido', sql.VarChar(40), ID_Pedido !== undefined ? ID_Pedido.toString() : null)
                .input('Empresa', sql.VarChar(40), "Makita")
                .input('Tabla', sql.VarChar(40), Tabla)
                .input('Subtabla', sql.VarChar(40), Subtabla)
                .input('Archivo', sql.VarChar(200), Archivo)
                .input('Fecha', sql.VarChar, formatDate(Fecha))
                .input('Usuario', sql.VarChar(40), Usuario)
                .input('Descripcion', sql.VarChar(40), Descripcion)
                .input('ID_OS', sql.VarChar(20),  ID_OS !== undefined ? ID_OS.toString() : null)
                .output('Insertado', sql.Int)
                .output('ResultadoID', sql.VarChar)
      
                .execute('insertaDocumentosSP');
                
                result.data = documento;
                let resultSP = {
                    data : documento,
                    output : result.output
                }
                
                
                response.push(resultSP);
               
               
        }
        
        logger.info(`Fin de la funcion insertarDocumentos ${JSON.stringify(response)}`);
        res.status(200).json(response);
    
    } catch (error) {
        // Manejamos cualquier error ocurrido durante el proceso
        logger.error(`Error en insertarDocumentos: ${error.message}`);
        res.status(500).json({ error: `Error en el servidor [insertar-documentos-ms] :  ${error.message}`  });
    }
    finally{
        await closeDatabaseConnection();
    }
}

/**
 * Formateamos Fecha
 * @param {*} date 
 * @returns 
 */
function formatDate(date) {
    if(date != null){
        const fechaMoment = moment(date, "DD-MM-YYYY");
        const fechaFormateada = fechaMoment.format("YYYY-MM-DD");
        return fechaFormateada;
    }
}


function prepareData(data) {
    let request = [];
    let req = {};
    for(element of data){
        for(archivo of element.arregloLink){
            req = {
                tabla: "DOCUMENTO",
                subtabla : "NOTA DE VTA INTERNA",
                archivo :archivo.link,
                fecha: archivo.data,
                usuario : element.cnpj ,
                descripcion: `Documento de la orden ${element.os}`,
                idPedido : element.idPedido,
                os: element.os
            }

            request.push(req);

        }
    }

    return request;
  
}
module.exports = {
    insertarDocumentos
};

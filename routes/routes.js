const express = require('express');
const router = express.Router();
const { insertarDocumentos } = require('../controllers/insertardocumentosControllers');

router.post('/insertar-documentos', insertarDocumentos);

module.exports = router;
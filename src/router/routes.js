const mongoose = require("mongoose");

const express = require("express");
const router = express.Router();



//importer les fichier contenant les routes de game,editor et genre

const api = require("./api");

//relier les fichier importer au routes principaux

router.use("/api/tasks",api.router);


//Exporte les objets vers les fichier qui en ont besoin
module.exports = {
    router,
}

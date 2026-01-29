const express = require("express");

const mongoose = require("mongoose");

const cors = require('cors');
const path = require("path");
require('dotenv').config();


const app = express();
const PORT = 3000;

//test connection a la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

app.set("view engine","hbs");
app.set('views', path.join(__dirname, 'src/views'));


// Configuration CORS
app.use(cors()); // Autorise toutes les origines
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

//connection avec la base de données
connectDB();

// Définir le modèle Tache
const tacheSchema = new mongoose.Schema({}, { strict: false }); // accepte tous les champs
const Tache = mongoose.model("Tache", tacheSchema, "tasks");

// Exporter Tache pour que les handlers y accèdent
global.Tache = Tache;

//initialise les routes
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Connecté à l'API"});
});

//inclure les routes
const router = require("./src/router/routes");
app.use("/",router.router);






//lance le serveur web
app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on http://localhost:"+ PORT);
    else 
        console.log("Error occurred, server can't start", error);
    } 
);



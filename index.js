const express = require('express');
const mongoose = require('mongoose');
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

app.use(express.json());

//connection avec la base de données
connectDB();
const tacheSchema = new mongoose.Schema({}, { strict: false }); // accepte tous les champs
const Tache = mongoose.model("Tache", tacheSchema, "tasks"); // "taches" = nom de ta collection

//initialise les routes
app.get("/", (req, res) => {
  res.redirect("/task");
});


app.get("/task", async (req,res)=>{
  try {
    const titres = await Tache.find({}, { titre: 1, _id: 0 }); // récupère uniquement le champ titre
    // Concatène les titres dans une chaîne
    const listeTitres = titres.map(t => t.titre).join(", ");
    res.send("Pas de page mais titres des tâches : " + listeTitres);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

app.get("/taches/:id", (req, res) => {
  const id = req.params.id; // Récupéré depuis l'URL
  res.send(`Pas de page mais tu as demander l'id: ${id}`);
});

//lance le serveur web
app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on http://localhost:"+ PORT);
    else 
        console.log("Error occurred, server can't start", error);
    } 
);



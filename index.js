const express = require("express");
const mongoose = require("mongoose");
const hbs = require("hbs");
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
app.set('views', path.join(__dirname, 'views'));

hbs.registerPartials(path.join(__dirname, "/views/partials"))


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//connection avec la base de données
connectDB();
const tacheSchema = new mongoose.Schema({}, { strict: false }); // accepte tous les champs
const Tache = mongoose.model("Tache", tacheSchema, "tasks"); // "taches" = nom de ta collection

//initialise les routes
app.get("/", (req, res) => {
  res.render("index");
});


app.get("/taches", async (req,res)=>{
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


app.get("/taches/create", async(req,res) =>{
  res.render("post/create");
})

app.get("/taches/:id", async (req, res) => {
  const idReq = req.params.id; // Récupéré depuis l'URL
  const task = await Tache.find({id:idReq},{ titre: 1, _id: 0 })
  res.send(`Pas de page mais tu as demander la tache d'id: ${task.id}, nommée ${task.titre}`);
});





app.post("/taches/create",async(req,res) =>{
  try {
    const data = req.body; 
    console.log(data);
    // Si dateCreation est vide → mettre la date actuelle
    
    if (!data.dateCreation || data.dateCreation.trim() === "") {
      data.dateCreation = new Date();
    }

    // Création de la tâche
    const nouvelleTache = new Tache({
      titre: data.titre,
      description: data.description || "",
      dateCreation: data.dateCreation,
      echeance: data.echeance ? new Date(data.echeance) : null,
      statut: data.statut,
      priorite: data.priorite,
      auteur: {
        nom: data.auteurNom,
        prenom: data.auteurPrenom,
        email: data.auteurEmail
      },
      categorie: data.categorie || "",
      sousTaches: [],
      commentaires: [],
      historiqueModifications: []
    });

    await nouvelleTache.save();

    // Redirection ou confirmation
    res.redirect("/taches");

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la création de la tâche");
  }
})

app.post("/taches/:id", async(req,res) =>{
  const idCurrent = req.params.id;
  Tache.deleteOne({id:idCurrent});
})


//lance le serveur web
app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on http://localhost:"+ PORT);
    else 
        console.log("Error occurred, server can't start", error);
    } 
);



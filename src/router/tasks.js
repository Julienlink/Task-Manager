const mongoose = require("mongoose");
const tacheSchema = new mongoose.Schema({}, { strict: false }); // accepte tous les champs
const Tache = mongoose.models.Tache

const express = require("express");
const router = express.Router();

router.get("/", async (req,res)=>{
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


router.get("/create", async(req,res) =>{
  res.render("post/create");
})

router.get("/:id", async (req, res) => {
  const idReq = req.params.id; // Récupéré depuis l'URL
  const task = await Tache.find({id:idReq},{ titre: 1, _id: 0 })
  res.send(`Pas de page mais tu as demander la tache d'id: ${task.id}, nommée ${task.titre}`);
});





router.post("/create",async(req,res) =>{
  try {
    const data = req.body; 
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
    res.redirect("/");

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la création de la tâche");
  }
})

router.post("/:id", async(req,res) =>{
  const idCurrent = req.params.id;
  Tache.deleteOne({id:idCurrent});
})

module.exports = {
    router,
}
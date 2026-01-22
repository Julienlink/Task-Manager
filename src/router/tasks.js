const mongoose = require("mongoose");
const tacheSchema = new mongoose.Schema({}, { strict: false }); // accepte tous les champs
const Tache = mongoose.models.Tache

const express = require("express");
const router = express.Router();

// Show All
/*router.get("/", async (req,res)=>{
  try {
    const tasks = await Tache.find({});
    res.render("tasks/index", { tasks: tasks });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});*/

// Show All avec filtrage et tri
router.get("/", async (req, res) => {
  try {
    const { statut, priorite, categorie, etiquette, triPar, ordre } = req.query;
    
    // Construire le filtre
    const filtre = {};
    
    if (statut && statut !== "tous") {
      filtre.statut = statut;
    }
    
    if (priorite && priorite !== "tous") {
      filtre.priorite = priorite;
    }
    
    if (categorie && categorie !== "toutes") {
      filtre.categorie = categorie;
    }
    
    if (etiquette) {
      filtre.etiquettes = { $in: [etiquette] };
    }
    
    // Gestion de l'échéance (tâches en retard, aujourd'hui, à venir)
    if (req.query.echeanceFiltre) {
      const aujourdHui = new Date();
      aujourdHui.setHours(0, 0, 0, 0);
      
      switch(req.query.echeanceFiltre) {
        case "retard":
          filtre.echeance = { $lt: aujourdHui };
          filtre.statut = { $ne: "terminé" };
          break;
        case "aujourdhui":
          const demain = new Date(aujourdHui);
          demain.setDate(demain.getDate() + 1);
          filtre.echeance = { $gte: aujourdHui, $lt: demain };
          break;
        case "semaine":
          const dansUneSemaine = new Date(aujourdHui);
          dansUneSemaine.setDate(dansUneSemaine.getDate() + 7);
          filtre.echeance = { $gte: aujourdHui, $lt: dansUneSemaine };
          break;
      }
    }
    
    // Construire le tri
    const tri = {};
    const triSelectionne = triPar || "dateCreation";
    const ordreTri = ordre === "asc" ? 1 : -1;
    
    switch(triSelectionne) {
      case "dateCreation":
        tri.dateCreation = ordreTri;
        break;
      case "echeance":
        tri.echeance = ordreTri;
        break;
      case "priorite":
        // Si vous stockez la priorité comme numérique (1: haute, 2: moyenne, 3: basse)
        tri.priorite = ordreTri;
        break;
      case "titre":
        tri.titre = ordreTri === 1 ? 1 : -1;
        break;
      default:
        tri.dateCreation = -1;
    }
    
    const tasks = await Tache.find(filtre).sort(tri);
    
    // Pour afficher les options de filtres dans la vue
    const stats = {
      total: await Tache.countDocuments({}),
      enCours: await Tache.countDocuments({ statut: "en cours" }),
      termine: await Tache.countDocuments({ statut: "terminé" }),
      enRetard: await Tache.countDocuments({ 
        echeance: { $lt: new Date() },
        statut: { $ne: "terminé" }
      })
    };
    
    res.render("tasks/index", { 
      tasks: tasks,
      filtres: req.query,
      stats: stats
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});




// Create
router.get("/create", async(req,res) =>{
  res.render("tasks/create");
})

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
    res.redirect("/tasks");

  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la création de la tâche");
  }
})



// Delete
router.post("/:id/delete", async(req,res) =>{
  try{
    const idCurrent = req.params.id;
    const result = await Tache.findByIdAndDelete(idCurrent);
     res.status(201).redirect("/tasks");
  }
  catch(err){
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
})

// Edit 
router.get("/:id/edit", async (req, res) => {
  try {
    const id = req.params.id;
    const task = await Tache.findOne({ _id: id });
    if (!task) return res.status(404).send("Tâche non trouvée");
    res.render("tasks/edit", { task:task });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

// Edit - submit changes
router.post("/:id/edit", async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    const update = {
      titre: data.titre,
      description: data.description || "",
      dateCreation: data.dateCreation ? new Date(data.dateCreation) : undefined,
      echeance: data.echeance ? new Date(data.echeance) : null,
      statut: data.statut,
      priorite: data.priorite,
      auteur: {
        nom: data.auteurNom,
        prenom: data.auteurPrenom,
        email: data.auteurEmail
      },
      categorie: data.categorie || ""
    };

    // Remove undefined keys so they don't overwrite existing values
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

    const task = await Tache.findByIdAndUpdate(id, update, { new: true });
    if (!task) return res.status(404).send("Tâche non trouvée");

    res.redirect(`/tasks/${task._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la modification de la tâche");
  }
});

// Show individual
router.get("/:id", async (req, res) => {
  try {
    const idReq = req.params.id; // Récupéré depuis l'URL
    const task = await Tache.findOne({ _id: idReq });

    if (!task) {
      return res.status(404).send("Tâche non trouvée");
    }

    res.render("tasks/detail", { task: task });
    
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

module.exports = {
    router,
}
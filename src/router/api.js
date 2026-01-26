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
    
     res.json({ 
      success: true,
      tasks: tasks,
      filtres: req.query,
      stats: stats
    });

    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
  }
});




// Create
router.post("/",async(req,res) =>{
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

    res.status(201).json({ 
      success: true,
      message: "Tâche créée avec succès",
      task: nouvelleTache
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors de la création de la tâche", error: err.message });
  }
})



// Delete
router.delete("/:id", async(req,res) =>{
  try{
    const idCurrent = req.params.id;
    const result = await Tache.findByIdAndDelete(idCurrent);
    if (!result) return res.status(404).json({ success: false, message: "Tâche non trouvée" });
    res.json({ success: true, message: "Tâche supprimée avec succès", task: result });
  }
  catch(err){
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
  }
})


// Edit - submit changes
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validation stricte de l'ID
    if (!id || id === 'null' || id === 'undefined') {
      return res.status(400).json({ success: false, message: "ID de tâche invalide" });
    }
    
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
    if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée" });

    res.json({ success: true, message: "Tâche modifiée avec succès", task: task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors de la modification de la tâche", error: err.message });
  }
});

// Show individual
router.get("/:id", async (req, res) => {
  try {
    const idReq = req.params.id; // Récupéré depuis l'URL
    const task = await Tache.findOne({ _id: idReq });

    if (!task) {
      return res.status(404).json({ success: false, message: "Tâche non trouvée" });
    }

    res.json({ success: true, task: task });
    
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
  }
});

// Ajouter une sous-tâche
router.post("/:id/sous-taches", async (req, res) => {
  try {
    const idTache = req.params.id;
    const { titre, description, statut } = req.body;
    
    const nouvelleSousTache = {
      _id: new mongoose.Types.ObjectId(),
      titre: titre,
      description: description || "",
      statut: statut || "à faire",
      dateCreation: new Date(),
      dateModification: new Date()
    };
    
    const task = await Tache.findByIdAndUpdate(
      idTache,
      { $push: { sousTaches: nouvelleSousTache } },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée" });
    
    res.status(201).json({ success: true, message: "Sous-tâche ajoutée avec succès", task: task });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors de l'ajout de la sous-tâche", error: err.message });
  }
});

// Modifier une sous-tâche
router.put("/:id/sous-taches/:sousTacheId", async (req, res) => {
  try {
    const { id, sousTacheId } = req.params;
    const { titre, description, statut } = req.body;
    
    const task = await Tache.findOneAndUpdate(
      { _id: id, "sousTaches._id": sousTacheId },
      {
        $set: {
          "sousTaches.$.titre": titre,
          "sousTaches.$.description": description,
          "sousTaches.$.statut": statut,
          "sousTaches.$.dateModification": new Date()
        }
      },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ success: false, message: "Sous-tâche non trouvée" });
    
    res.json({ success: true, message: "Sous-tâche modifiée avec succès", task: task });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors de la modification de la sous-tâche", error: err.message });
  }
});

// Supprimer une sous-tâche
router.delete("/:id/sous-taches/:sousTacheId", async (req, res) => {
  try {
    const { id, sousTacheId } = req.params;
    
    const task = await Tache.findByIdAndUpdate(
      id,
      { $pull: { sousTaches: { _id: sousTacheId } } },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée" });
    
    res.json({ success: true, message: "Sous-tâche supprimée avec succès", task: task });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression de la sous-tâche", error: err.message });
  }
});

// Ajouter un commentaire
router.post("/:id/commentaires", async (req, res) => {
  try {
    const idTache = req.params.id;
    const { texte, auteur } = req.body;
    
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      texte: texte,
      auteur: auteur || "Anonyme",
      dateCreation: new Date(),
      dateModification: new Date()
    };
    
    const task = await Tache.findByIdAndUpdate(
      idTache,
      { $push: { commentaires: newComment } },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée" });
    
    res.status(201).json({ success: true, message: "Commentaire ajouté avec succès", task: task });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors de l'ajout du commentaire", error: err.message });
  }
});

// Modifier un commentaire
router.put("/:id/commentaires/:commentaireId", async (req, res) => {
  try {
    const { id, commentaireId } = req.params;
    const { texte } = req.body;
    
    const task = await Tache.findOneAndUpdate(
      { _id: id, "commentaires._id": commentaireId },
      {
        $set: {
          "commentaires.$.texte": texte,
          "commentaires.$.dateModification": new Date()
        }
      },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ success: false, message: "Commentaire non trouvé" });
    
    res.json({ success: true, message: "Commentaire modifié avec succès", task: task });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors de la modification du commentaire", error: err.message });
  }
});

// Supprimer un commentaire
router.delete("/:id/commentaires/:commentaireId", async (req, res) => {
  try {
    const { id, commentaireId } = req.params;
    
    const task = await Tache.findByIdAndUpdate(
      id,
      { $pull: { commentaires: { _id: commentaireId } } },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée" });
    
    res.json({ success: true, message: "Commentaire supprimé avec succès", task: task });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression du commentaire", error: err.message });
  }
});

module.exports = {
    router,
}
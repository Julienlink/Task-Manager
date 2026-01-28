const mongoose = require("mongoose");

// Récupérer le modèle depuis global ou créer une référence
const getTache = () => {
  if (global.Tache) {
    return global.Tache;
  }
  const tacheSchema = new mongoose.Schema({}, { strict: false });
  return mongoose.models.Tache || mongoose.model("Tache", tacheSchema, "tasks");
};

// Show All avec filtrage et tri
const getAllTasks = async (req, res) => {
  try {
    const Tache = getTache();
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
};

// Show individual task
const getTaskById = async (req, res) => {
  try {
    const Tache = getTache();
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
};

module.exports = {
  getAllTasks,
  getTaskById
};

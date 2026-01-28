const mongoose = require("mongoose");

// Récupérer le modèle depuis global ou créer une référence
const getTache = () => {
  if (global.Tache) {
    return global.Tache;
  }
  const tacheSchema = new mongoose.Schema({}, { strict: false });
  return mongoose.models.Tache || mongoose.model("Tache", tacheSchema, "tasks");
};

// Create task
const createTask = async (req, res) => {
  try {
    const Tache = getTache();
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
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : []),
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
};

// Add subtask
const addSubtask = async (req, res) => {
  try {
    const Tache = getTache();
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
};

// Add comment
const addComment = async (req, res) => {
  try {
    const Tache = getTache();
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
};

module.exports = {
  createTask,
  addSubtask,
  addComment
};

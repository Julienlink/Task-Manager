const mongoose = require("mongoose");

// Récupérer le modèle depuis global ou créer une référence
const getTache = () => {
  if (global.Tache) {
    return global.Tache;
  }
  const tacheSchema = new mongoose.Schema({}, { strict: false });
  return mongoose.models.Tache || mongoose.model("Tache", tacheSchema, "tasks");
};

// Edit task - submit changes
const updateTask = async (req, res) => {
  try {
    const Tache = getTache();
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
};

// Modify subtask
const updateSubtask = async (req, res) => {
  try {
    const Tache = getTache();
    const { id, sousTacheId } = req.params;
    const { titre, description, statut } = req.body;
    
    console.log(`Modification sous-tâche: taskId=${id}, sousTacheId=${sousTacheId}`);
    
    // Convertir en ObjectId si nécessaire
    const objectId = mongoose.Types.ObjectId.isValid(sousTacheId) 
      ? new mongoose.Types.ObjectId(sousTacheId) 
      : sousTacheId;
    
    const task = await Tache.findOneAndUpdate(
      { _id: id, "sousTaches._id": objectId },
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
    
    console.log("Sous-tâche modifiée avec succès");
    res.json({ success: true, message: "Sous-tâche modifiée avec succès", task: task });
    
  } catch (err) {
    console.error("Erreur modification sous-tâche:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la modification de la sous-tâche", error: err.message });
  }
};

// Modify comment
const updateComment = async (req, res) => {
  try {
    const Tache = getTache();
    const { id, commentaireId } = req.params;
    const { texte } = req.body;
    
    console.log(`Modification commentaire: taskId=${id}, commentaireId=${commentaireId}`);
    
    // Convertir en ObjectId si nécessaire
    const objectId = mongoose.Types.ObjectId.isValid(commentaireId) 
      ? new mongoose.Types.ObjectId(commentaireId) 
      : commentaireId;
    
    const task = await Tache.findOneAndUpdate(
      { _id: id, "commentaires._id": objectId },
      {
        $set: {
          "commentaires.$.texte": texte,
          "commentaires.$.dateModification": new Date()
        }
      },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ success: false, message: "Commentaire non trouvé" });
    
    console.log("Commentaire modifié avec succès");
    res.json({ success: true, message: "Commentaire modifié avec succès", task: task });
    
  } catch (err) {
    console.error("Erreur modification commentaire:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la modification du commentaire", error: err.message });
  }
};

module.exports = {
  updateTask,
  updateSubtask,
  updateComment
};

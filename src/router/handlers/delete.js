const mongoose = require("mongoose");

// Récupérer le modèle depuis global ou créer une référence
const getTache = () => {
  if (global.Tache) {
    return global.Tache;
  }
  const tacheSchema = new mongoose.Schema({}, { strict: false });
  return mongoose.models.Tache || mongoose.model("Tache", tacheSchema, "tasks");
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const Tache = getTache();
    const idCurrent = req.params.id;
    const result = await Tache.findByIdAndDelete(idCurrent);
    if (!result) return res.status(404).json({ success: false, message: "Tâche non trouvée" });
    res.json({ success: true, message: "Tâche supprimée avec succès", task: result });
  }
  catch(err){
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

// Delete subtask
const deleteSubtask = async (req, res) => {
  try {
    const Tache = getTache();
    const { id, sousTacheId } = req.params;
    
    console.log(`Suppression sous-tâche: taskId=${id}, sousTacheId=${sousTacheId}`);
    
    // Convertir en ObjectId si nécessaire
    const objectId = mongoose.Types.ObjectId.isValid(sousTacheId) 
      ? new mongoose.Types.ObjectId(sousTacheId) 
      : sousTacheId;
    
    const task = await Tache.findByIdAndUpdate(
      id,
      { $pull: { sousTaches: { _id: objectId } } },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée" });
    
    console.log("Sous-tâche supprimée avec succès");
    res.json({ success: true, message: "Sous-tâche supprimée avec succès", task: task });
    
  } catch (err) {
    console.error("Erreur suppression sous-tâche:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression de la sous-tâche", error: err.message });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const Tache = getTache();
    const { id, commentaireId } = req.params;
    
    console.log(`Suppression commentaire: taskId=${id}, commentaireId=${commentaireId}`);
    
    // Convertir en ObjectId si nécessaire
    const objectId = mongoose.Types.ObjectId.isValid(commentaireId) 
      ? new mongoose.Types.ObjectId(commentaireId) 
      : commentaireId;
    
    const task = await Tache.findByIdAndUpdate(
      id,
      { $pull: { commentaires: { _id: objectId } } },
      { new: true }
    );
    
    if (!task) return res.status(404).json({ success: false, message: "Tâche non trouvée" });
    
    console.log("Commentaire supprimé avec succès");
    res.json({ success: true, message: "Commentaire supprimé avec succès", task: task });
    
  } catch (err) {
    console.error("Erreur suppression commentaire:", err);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression du commentaire", error: err.message });
  }
};

module.exports = {
  deleteTask,
  deleteSubtask,
  deleteComment
};

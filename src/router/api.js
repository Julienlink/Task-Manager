const express = require("express");
const router = express.Router();

// Import handlers
const { getAllTasks, getTaskById } = require("./handlers/get");
const { createTask, addSubtask, addComment } = require("./handlers/post");
const { updateTask, updateSubtask, updateComment } = require("./handlers/put");
const { deleteTask, deleteSubtask, deleteComment } = require("./handlers/delete");

// GET routes
router.get("/", getAllTasks);
router.get("/:id", getTaskById);

// POST routes
router.post("/", createTask);
router.post("/:id/sous-taches", addSubtask);
router.post("/:id/commentaires", addComment);

// PUT routes
router.put("/:id", updateTask);
router.put("/:id/sous-taches/:sousTacheId", updateSubtask);
router.put("/:id/commentaires/:commentaireId", updateComment);

// DELETE routes
router.delete("/:id", deleteTask);
router.delete("/:id/sous-taches/:sousTacheId", deleteSubtask);
router.delete("/:id/commentaires/:commentaireId", deleteComment);

module.exports = {
    router,
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    
    // Permettre d'ajouter une tâche simple avec Enter
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTaskQuick();
    });
});

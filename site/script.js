// Configuration de l'API - À MODIFIER avec votre URL d'API
const API_URL = 'http://localhost:3000/api/tasks'; // Changez cette URL
let tasks = [];
// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    
    // Permettre d'ajouter une tâche avec Enter
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    // Afficher les instructions dans la console
    console.log('%c📋 Instructions de configuration API', 'font-size: 16px; font-weight: bold; color: #667eea;');
    console.log('1. Modifiez la constante API_URL avec l\'URL de votre API');
    console.log('2. Votre API doit exposer ces endpoints:');
    console.log('   GET    /api/tasks          - Récupérer toutes les tâches');
    console.log('   POST   /api/tasks          - Créer une tâche');
    console.log('   PUT    /api/tasks/:id      - Modifier une tâche');
    console.log('   DELETE /api/tasks/:id      - Supprimer une tâche');
    console.log('\n3. Format attendu des données:');
    console.log('   { _id: string, text: string, completed: boolean }');
});
// Charger toutes les tâches
async function loadTasks() {
    showLoading(true);
    clearError();
    
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Erreur lors du chargement');
        
        const data = await response.json();
        
        // S'assurer que tasks est toujours un tableau
        if (Array.isArray(data)) {
            tasks = data;
        } else if (data.tasks && Array.isArray(data.tasks)) {
            tasks = data.tasks;
        } else if (data.data && Array.isArray(data.data)) {
            tasks = data.data;
        } else {
            tasks = [];
            console.warn('Format de réponse inattendu:', data);
        }
        
        renderTasks();
        updateApiStatus('✅ Connecté à l\'API');
    } catch (error) {
        showError('Impossible de charger les tâches. Vérifiez que l\'API est accessible.');
        console.error('Erreur:', error);
        tasks = [];
    } finally {
        showLoading(false);
    }
}
// Ajouter une tâche
async function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    
    if (!text) return;
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, completed: false })
        });
        if (!response.ok) throw new Error('Erreur lors de l\'ajout');
        const data = await response.json();
        const newTask = data.task || data.data || data;
        
        tasks.push(newTask);
        renderTasks();
        input.value = '';
        clearError();
    } catch (error) {
        showError('Impossible d\'ajouter la tâche.');
        console.error('Erreur:', error);
    }
}
// Basculer l'état d'une tâche
async function toggleTask(id) {
    const task = tasks.find(t => t._id === id);
    if (!task) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, completed: !task.completed })
        });
        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
        const data = await response.json();
        const updatedTask = data.task || data.data || data;
        
        const index = tasks.findIndex(t => t._id === id);
        tasks[index] = updatedTask;
        renderTasks();
        clearError();
    } catch (error) {
        showError('Impossible de mettre à jour la tâche.');
        console.error('Erreur:', error);
    }
}
// Activer le mode édition
function editTask(id) {
    const task = tasks.find(t => t._id === id);
    if (!task) return;
    const listItem = document.querySelector(`[data-id="${id}"]`);
    listItem.classList.add('edit-mode');
    listItem.innerHTML = `
        <div class="task-content">
            <input type="text" class="edit-input" value="${task.text}" id="edit-${id}">
        </div>
        <div class="task-actions">
            <button class="btn btn-edit" onclick="saveTask('${id}')">Sauver</button>
            <button class="btn btn-cancel" onclick="renderTasks()">Annuler</button>
        </div>
    `;
    document.getElementById(`edit-${id}`).focus();
}
// Sauvegarder la modification
async function saveTask(id) {
    const newText = document.getElementById(`edit-${id}`).value.trim();
    if (!newText) return;
    const task = tasks.find(t => t._id === id);
    if (!task) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, text: newText })
        });
        if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
        const data = await response.json();
        const updatedTask = data.task || data.data || data;
        
        const index = tasks.findIndex(t => t._id === id);
        tasks[index] = updatedTask;
        renderTasks();
        clearError();
    } catch (error) {
        showError('Impossible de sauvegarder la tâche.');
        console.error('Erreur:', error);
    }
}
// Supprimer une tâche
async function deleteTask(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        tasks = tasks.filter(t => t._id !== id);
        renderTasks();
        clearError();
    } catch (error) {
        showError('Impossible de supprimer la tâche.');
        console.error('Erreur:', error);
    }
}
// Afficher les tâches
function renderTasks() {
    const taskList = document.getElementById('taskList');
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state">Aucune tâche. Commencez par en ajouter une ! 🎯</div>';
        return;
    }
    taskList.innerHTML = tasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task._id}">
            <div class="task-content">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="toggleTask('${task._id}')"
                >
                <span class="task-text">${task.text}</span>
            </div>
            <div class="task-actions">
                <button class="btn btn-edit" onclick="editTask('${task._id}')">✏️</button>
                <button class="btn btn-delete" onclick="deleteTask('${task._id}')">🗑️</button>
            </div>
        </li>
    `).join('');
}
// Fonctions utilitaires
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.innerHTML = `<div class="error">${message}</div>`;
}
function clearError() {
    document.getElementById('errorMessage').innerHTML = '';
}
function updateApiStatus(message) {
    document.getElementById('apiStatus').textContent = message;
}

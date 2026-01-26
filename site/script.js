// Configuration de l'API
const API_URL = 'http://localhost:3000/api/tasks';
let tasks = [];
let currentTaskId = null;
let isEditMode = false;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    
    // Permettre d'ajouter une tâche simple avec Enter
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTaskQuick();
    });
});

// Basculer le formulaire avancé
function toggleAdvancedForm() {
    const form = document.getElementById('advancedForm');
    if (form.style.display === 'none') {
        form.style.display = 'block';
        isEditMode = false;
        currentTaskId = null;
        document.querySelector('.advanced-form h3').textContent = 'Ajouter une tâche complète';
        document.getElementById('submitBtn').textContent = '✅ Ajouter la tâche';
        document.getElementById('taskInput').value = '';
    } else {
        form.style.display = 'none';
        resetAdvancedForm();
    }
}

// Annuler la modification/ajout
function cancelForm() {
    document.getElementById('advancedForm').style.display = 'none';
    resetAdvancedForm();
    isEditMode = false;
    currentTaskId = null;
}
// Charger toutes les tâches
async function loadTasks() {
    showLoading(true);
    clearError();
    
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Erreur lors du chargement');
        
        const data = await response.json();
        
        // Extraire les tâches de la réponse API
        if (data.success && data.tasks && Array.isArray(data.tasks)) {
            tasks = data.tasks;
        } else if (Array.isArray(data)) {
            tasks = data;
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
// Ajouter une tâche simple (mode rapide)
async function addTaskQuick() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    
    if (!text) return;
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                titre: text,
                description: "",
                statut: "à faire",
                priorite: "moyen",
                auteurNom: "Utilisateur",
                auteurPrenom: "",
                auteurEmail: ""
            })
        });
        if (!response.ok) throw new Error('Erreur lors de l\'ajout');
        const data = await response.json();
        
        if (data.success && data.task) {
            tasks.push(data.task);
            renderTasks();
            input.value = '';
            clearError();
        }
    } catch (error) {
        showError('Impossible d\'ajouter la tâche.');
        console.error('Erreur:', error);
    }
}

// Ajouter une tâche avec tous les paramètres (formulaire avancé)
async function addTaskAdvanced(event) {
    event.preventDefault();
    
    const titre = document.getElementById('formTitre').value.trim();
    if (!titre) {
        showError('Le titre est obligatoire');
        return;
    }

    console.log('addTaskAdvanced: isEditMode=' + isEditMode + ', currentTaskId=' + currentTaskId);

    // Vérifier si c'est une modification ou une création
    if (isEditMode && currentTaskId) {
        console.log('Mode MODIFICATION - appel updateTask');
        await updateTask(currentTaskId);
    } else {
        console.log('Mode CRÉATION - appel createTask');
        await createTask(titre);
    }
}

// Créer une nouvelle tâche
async function createTask(titre) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titre: titre,
                description: document.getElementById('formDescription').value.trim(),
                statut: document.getElementById('formStatut').value,
                priorite: document.getElementById('formPriorite').value,
                categorie: document.getElementById('formCategorie').value.trim(),
                echeance: document.getElementById('formEcheance').value || null,
                auteurNom: document.getElementById('formAuteurNom').value.trim(),
                auteurPrenom: document.getElementById('formAuteurPrenom').value.trim(),
                auteurEmail: document.getElementById('formAuteurEmail').value.trim()
            })
        });
        
        if (!response.ok) throw new Error('Erreur lors de l\'ajout');
        const data = await response.json();
        
        if (data.success && data.task) {
            tasks.push(data.task);
            renderTasks();
            resetAdvancedForm();
            document.getElementById('advancedForm').style.display = 'none';
            document.querySelector('.advanced-form h3').textContent = 'Ajouter une tâche complète';
            document.getElementById('submitBtn').textContent = '✅ Ajouter la tâche';
            clearError();
            showSuccess('Tâche ajoutée avec succès!');
        }
    } catch (error) {
        showError('Impossible d\'ajouter la tâche.');
        console.error('Erreur:', error);
    }
}

// Réinitialiser le formulaire avancé
function resetAdvancedForm() {
    document.getElementById('formTitre').value = '';
    document.getElementById('formDescription').value = '';
    document.getElementById('formStatut').value = 'à faire';
    document.getElementById('formPriorite').value = 'moyen';
    document.getElementById('formCategorie').value = '';
    document.getElementById('formEcheance').value = '';
    document.getElementById('formAuteurNom').value = '';
    document.getElementById('formAuteurPrenom').value = '';
    document.getElementById('formAuteurEmail').value = '';
}
// Basculer l'état d'une tâche
async function toggleTask(id) {
    const task = tasks.find(t => t._id === id);
    if (!task) return;
    try {
        const newStatut = task.statut === "terminé" ? "à faire" : "terminé";
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, statut: newStatut })
        });
        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
        const data = await response.json();
        
        if (data.success && data.task) {
            const index = tasks.findIndex(t => t._id === id);
            tasks[index] = data.task;
            renderTasks();
            clearError();
        }
    } catch (error) {
        showError('Impossible de mettre à jour la tâche.');
        console.error('Erreur:', error);
    }
}

// Activer le mode édition
function editTask(id) {
    const task = tasks.find(t => t._id === id);
    if (!task) {
        showError('Tâche non trouvée');
        return;
    }
    
    // Marquer en mode édition
    isEditMode = true;
    currentTaskId = id;
    
    // Remplir le formulaire avancé
    document.getElementById('formTitre').value = task.titre;
    document.getElementById('formDescription').value = task.description || '';
    document.getElementById('formStatut').value = task.statut;
    document.getElementById('formPriorite').value = task.priorite;
    document.getElementById('formCategorie').value = task.categorie || '';
    if (task.echeance) {
        const date = new Date(task.echeance);
        const dateStr = date.toISOString().split('T')[0];
        document.getElementById('formEcheance').value = dateStr;
    }
    document.getElementById('formAuteurNom').value = task.auteur?.nom || '';
    document.getElementById('formAuteurPrenom').value = task.auteur?.prenom || '';
    document.getElementById('formAuteurEmail').value = task.auteur?.email || '';
    
    // Afficher formulaire et changer le titre et bouton
    document.getElementById('advancedForm').style.display = 'block';
    document.querySelector('.advanced-form h3').textContent = '✏️ Modifier la tâche';
    document.getElementById('submitBtn').textContent = '💾 Modifier la tâche';
    document.getElementById('taskInput').value = '';
}

// Sauvegarder la modification
async function saveTask(id) {
    // Cette fonction est maintenant gérée par addTaskAdvanced
    if (!id) return;
    await updateTask(id);
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
        showSuccess('Tâche supprimée!');
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
    
    taskList.innerHTML = tasks.map(task => {
        const isCompleted = task.statut === "terminé";
        const priorityEmoji = task.priorite === "haute" ? "🔴" : task.priorite === "moyen" ? "🟡" : "🟢";
        const statusEmoji = isCompleted ? "✅" : "⏳";
        
        return `
            <li class="task-item ${isCompleted ? 'completed' : ''}" data-id="${task._id}" onclick="openTaskModal('${task._id}')">
                <div class="task-header">
                    <input 
                        type="checkbox" 
                        class="task-checkbox" 
                        ${isCompleted ? 'checked' : ''}
                        onchange="toggleTask('${task._id}')"
                    >
                    <span class="task-title">${task.titre}</span>
                    <span class="task-priority">${priorityEmoji}</span>
                    <span class="task-status">${statusEmoji}</span>
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-meta">
                    <span class="task-category">${task.categorie || 'Sans catégorie'}</span>
                    ${task.echeance ? `<span class="task-deadline">📅 ${new Date(task.echeance).toLocaleDateString('fr-FR')}</span>` : ''}
                </div>
                <div class="task-actions">
                    <button class="btn btn-edit" onclick="editTask('${task._id}')">✏️</button>
                    <button class="btn btn-delete" onclick="deleteTask('${task._id}')">🗑️</button>
                </div>
            </li>
        `;
    }).join('');
}
// Fonctions utilitaires
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.innerHTML = `<div class="error">❌ ${message}</div>`;
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.innerHTML = `<div class="success">✅ ${message}</div>`;
    setTimeout(() => {
        errorDiv.innerHTML = '';
    }, 3000);
}

function clearError() {
    document.getElementById('errorMessage').innerHTML = '';
}

function updateApiStatus(message) {
    document.getElementById('apiStatus').textContent = message;
}

// ===== MODAL FUNCTIONS =====

// Ouvrir la modale de détails
function openTaskModal(taskId) {
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;
    
    currentTaskId = taskId;
    
    // Remplir les informations
    document.getElementById('modalTitle').textContent = task.titre;
    document.getElementById('modalDescription').textContent = task.description || '—';
    
    // Statut
    const statutClass = `status-${task.statut.toLowerCase().replace(' ', '')}`;
    const statutEmoji = task.statut === "terminé" ? "✅" : task.statut === "en cours" ? "⏳" : "📝";
    document.getElementById('modalStatut').textContent = `${statutEmoji} ${task.statut}`;
    document.getElementById('modalStatut').className = `detail-badge ${statutClass}`;
    
    // Priorité
    const priorityClass = `priority-${task.priorite}`;
    const priorityEmoji = task.priorite === "haute" ? "🔴" : task.priorite === "moyen" ? "🟡" : "🟢";
    document.getElementById('modalPriorite').textContent = `${priorityEmoji} ${task.priorite}`;
    document.getElementById('modalPriorite').className = `detail-badge ${priorityClass}`;
    
    // Catégorie
    document.getElementById('modalCategorie').textContent = task.categorie || '—';
    
    // Échéance
    if (task.echeance) {
        const date = new Date(task.echeance);
        document.getElementById('modalEcheance').textContent = `📅 ${date.toLocaleDateString('fr-FR')}`;
    } else {
        document.getElementById('modalEcheance').textContent = '—';
    }
    
    // Auteur
    const auteurDiv = document.getElementById('modalAuteur');
    if (task.auteur && (task.auteur.nom || task.auteur.prenom || task.auteur.email)) {
        const nom = task.auteur.nom || '';
        const prenom = task.auteur.prenom || '';
        const email = task.auteur.email || '';
        const nomComplet = `${prenom} ${nom}`.trim();
        
        auteurDiv.innerHTML = `
            <div>👤 ${nomComplet || 'Inconnu'}</div>
            ${email ? `<div>✉️ ${email}</div>` : ''}
        `;
    } else {
        auteurDiv.textContent = '—';
    }
    
    // Dates de création/modification
    if (task.dateCreation) {
        const dateC = new Date(task.dateCreation);
        document.getElementById('modalDateCreation').textContent = dateC.toLocaleDateString('fr-FR');
    } else {
        document.getElementById('modalDateCreation').textContent = '—';
    }
    
    if (task.dateModification) {
        const dateM = new Date(task.dateModification);
        document.getElementById('modalDateModification').textContent = dateM.toLocaleDateString('fr-FR');
    } else {
        document.getElementById('modalDateModification').textContent = '—';
    }
    
    // Sous-tâches
    const sousTachesSection = document.getElementById('sousTaskesSection');
    const sousTachesList = document.getElementById('modalSousTaches');
    
    if (task.sousTaches && task.sousTaches.length > 0) {
        sousTachesSection.style.display = 'block';
        sousTachesList.innerHTML = task.sousTaches.map(st => `
            <li class="sous-tache-item ${st.statut === 'terminé' ? 'completed' : ''}">
                <input type="checkbox" ${st.statut === 'terminé' ? 'checked' : ''} disabled>
                <span class="sous-tache-titre">${st.titre}</span>
                <span style="color: var(--text-light); font-size: 0.85rem;">${st.statut}</span>
            </li>
        `).join('');
    } else {
        sousTachesSection.style.display = 'none';
    }
    
    // Afficher la modale
    document.getElementById('taskModal').style.display = 'flex';
}

// Fermer la modale
function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    currentTaskId = null;
}

// Éditer la tâche depuis la modale
function editCurrentTask() {
    editTask(currentTaskId);
    closeTaskModal();
}

// Mettre à jour une tâche
async function updateTask(taskId) {
    // Validation stricte
    if (!taskId || taskId === 'null' || taskId === null) {
        showError('Erreur: ID de tâche invalide');
        return;
    }
    
    const titre = document.getElementById('formTitre').value.trim();
    if (!titre) {
        showError('Le titre est obligatoire');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titre: titre,
                description: document.getElementById('formDescription').value.trim(),
                statut: document.getElementById('formStatut').value,
                priorite: document.getElementById('formPriorite').value,
                categorie: document.getElementById('formCategorie').value.trim(),
                echeance: document.getElementById('formEcheance').value || null,
                auteurNom: document.getElementById('formAuteurNom').value.trim(),
                auteurPrenom: document.getElementById('formAuteurPrenom').value.trim(),
                auteurEmail: document.getElementById('formAuteurEmail').value.trim()
            })
        });
        
        if (!response.ok) throw new Error('Erreur lors de la modification');
        const data = await response.json();
        
        if (data.success && data.task) {
            const index = tasks.findIndex(t => t._id === taskId);
            if (index !== -1) {
                tasks[index] = data.task;
            }
            renderTasks();
            resetAdvancedForm();
            document.getElementById('advancedForm').style.display = 'none';
            document.querySelector('.advanced-form h3').textContent = 'Ajouter une tâche complète';
            document.getElementById('submitBtn').textContent = '✅ Ajouter la tâche';
            isEditMode = false;
            currentTaskId = null;
            clearError();
            showSuccess('Tâche modifiée avec succès!');
        }
    } catch (error) {
        showError('Impossible de modifier la tâche.');
        console.error('Erreur:', error);
    }
}

// Supprimer la tâche actuelle (depuis la modale)
async function deleteCurrentTask() {
    if (!currentTaskId) return;
    deleteTask(currentTaskId);
}

// Fermer la modale au clic en dehors
window.onclick = function(event) {
    const modal = document.getElementById('taskModal');
    if (event.target === modal) {
        closeTaskModal();
    }
}

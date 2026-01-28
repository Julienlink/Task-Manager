// Ajouter une sous-tâche
async function addSubtask() {
    if (!currentTaskId) {
        showError('Aucune tâche sélectionnée');
        return;
    }
    
    const titre = document.getElementById('newSubtaskInput').value.trim();
    if (!titre) {
        showError('Veuillez entrer un titre pour la sous-tâche');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${currentTaskId}/sous-taches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titre: titre,
                description: '',
                statut: 'à faire'
            })
        });
        
        if (!response.ok) throw new Error('Erreur lors de l\'ajout');
        const data = await response.json();
        
        if (data.success && data.task) {
            const index = tasks.findIndex(t => t._id === currentTaskId);
            if (index !== -1) {
                tasks[index] = data.task;
            }
            document.getElementById('newSubtaskInput').value = '';
            renderSubtasks(data.task);
            showSuccess('Sous-tâche ajoutée!');
        }
    } catch (error) {
        showError('Impossible d\'ajouter la sous-tâche');
        console.error('Erreur:', error);
    }
}

// Basculer l'état d'une sous-tâche
async function toggleSubtask(subtaskId) {
    if (!currentTaskId) return;
    
    const task = tasks.find(t => t._id === currentTaskId);
    if (!task) return;
    
    const subtask = task.sousTaches?.find(st => st._id === subtaskId);
    if (!subtask) return;
    
    const newStatus = subtask.statut === 'à faire' ? 'terminé' : 'à faire';
    
    try {
        const response = await fetch(`${API_URL}/${currentTaskId}/sous-taches/${subtaskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titre: subtask.titre,
                description: subtask.description || '',
                statut: newStatus
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de la modification');
        }
        
        const data = await response.json();
        
        if (data.success && data.task) {
            const index = tasks.findIndex(t => t._id === currentTaskId);
            if (index !== -1) {
                tasks[index] = data.task;
            }
            renderSubtasks(data.task);
        } else {
            throw new Error(data.message || 'Réponse invalide du serveur');
        }
    } catch (error) {
        showError('Erreur lors du changement de statut: ' + error.message);
        console.error('Erreur complète:', error);
    }
}

// Supprimer une sous-tâche
async function deleteSubtask(subtaskId) {
    if (!currentTaskId) {
        showError('Aucune tâche sélectionnée');
        return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette sous-tâche ?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${currentTaskId}/sous-taches/${subtaskId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de la suppression');
        }
        
        const data = await response.json();
        
        if (data.success && data.task) {
            const index = tasks.findIndex(t => t._id === currentTaskId);
            if (index !== -1) {
                tasks[index] = data.task;
            }
            renderSubtasks(data.task);
            showSuccess('Sous-tâche supprimée!');
        } else {
            showError(data.message || 'Erreur lors de la suppression');
        }
    } catch (error) {
        showError('Impossible de supprimer la sous-tâche: ' + error.message);
        console.error('Erreur:', error);
    }
}

// Afficher les sous-tâches
function renderSubtasks(task) {
    const section = document.getElementById('sousTaskesSection');
    const list = document.getElementById('modalSousTaches');
    
    // Toujours afficher la section
    section.style.display = 'block';
    
    if (task.sousTaches && task.sousTaches.length > 0) {
        list.innerHTML = task.sousTaches.map(st => `
            <li class="sous-tache-item ${st.statut === 'terminé' ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="subtask-checkbox"
                    ${st.statut === 'terminé' ? 'checked' : ''}
                    onchange="toggleSubtask('${st._id}')"
                >
                <span class="sous-tache-titre">${st.titre}</span>
                <button class="btn-small btn-delete" onclick="deleteSubtask('${st._id}')">🗑️</button>
            </li>
        `).join('');
    } else {
        list.innerHTML = '<li class="empty-subtasks">📋 Aucune sous-tâche pour le moment</li>';
    }
}

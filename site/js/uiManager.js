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
                        onclick="event.stopPropagation()"
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
    renderSubtasks(task);
    
    // Commentaires
    renderComments(task);
    
    // Afficher la modale
    document.getElementById('taskModal').style.display = 'flex';
}

// Fermer la modale
function closeTaskModal() {
    document.getElementById('taskModal').style.display = 'none';
    document.getElementById('advancedForm').style.display = 'none';
    resetAdvancedForm();
    isEditMode = false;
    currentTaskId = null;
}

// Éditer la tâche depuis la modale
function editCurrentTask() {
    if (!currentTaskId) {
        showError('Aucune tâche sélectionnée');
        return;
    }
    // Juste fermer la modale sans réinitialiser les variables
    document.getElementById('taskModal').style.display = 'none';
    // Afficher le formulaire d'édition APRÈS
    editTask(currentTaskId);
}

// Fermer la modale au clic en dehors
window.onclick = function(event) {
    const modal = document.getElementById('taskModal');
    if (event.target === modal) {
        closeTaskModal();
    }
}

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
        updateStats(data.stats || {});
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

// Supprimer une tâche
async function deleteTask(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        
        tasks = tasks.filter(t => t._id !== id);
        
        // Fermer la modale et réinitialiser
        if (currentTaskId === id) {
            closeTaskModal();
            isEditMode = false;
            currentTaskId = null;
        }
        
        renderTasks();
        clearError();
        showSuccess('Tâche supprimée!');
    } catch (error) {
        showError('Impossible de supprimer la tâche.');
        console.error('Erreur:', error);
    }
}

// Supprimer la tâche actuelle (depuis la modale)
async function deleteCurrentTask() {
    if (!currentTaskId) return;
    await deleteTask(currentTaskId);
}

// Récupérer les valeurs actuelles des filtres
function getFilterValues() {
    return {
        search: document.getElementById('searchInput').value.trim(),
        statut: document.getElementById('filterStatut').value,
        priorite: document.getElementById('filterPriorite').value,
        categorie: document.getElementById('filterCategorie').value.trim(),
        echeanceFiltre: document.getElementById('filterEcheance').value,
        triPar: document.getElementById('sortBy').value,
        ordre: document.getElementById('sortOrder').value
    };
}

// Appliquer les filtres
async function applyFilters() {
    showLoading(true);
    clearError();
    
    try {
        const filters = getFilterValues();
        
        // Construire l'URL avec les paramètres de filtre
        const params = new URLSearchParams();
        
        if (filters.statut) params.append('statut', filters.statut);
        if (filters.priorite) params.append('priorite', filters.priorite);
        if (filters.categorie) params.append('categorie', filters.categorie);
        if (filters.echeanceFiltre) params.append('echeanceFiltre', filters.echeanceFiltre);
        params.append('triPar', filters.triPar);
        params.append('ordre', filters.ordre);
        
        const url = `${API_URL}?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Erreur lors du chargement');
        
        const data = await response.json();
        
        // Extraire les tâches de la réponse API
        if (data.success && data.tasks && Array.isArray(data.tasks)) {
            tasks = data.tasks;
        } else if (Array.isArray(data)) {
            tasks = data;
        } else {
            tasks = [];
        }
        
        // Appliquer la recherche locale (sur le titre et description)
        if (filters.search) {
            tasks = tasks.filter(task => {
                const searchLower = filters.search.toLowerCase();
                return task.titre.toLowerCase().includes(searchLower) ||
                       (task.description && task.description.toLowerCase().includes(searchLower));
            });
        }
        
        renderTasks();
        updateStats(data.stats || {});
        updateApiStatus('✅ Filtres appliqués');
        
    } catch (error) {
        showError('Erreur lors de l\'application des filtres');
        console.error('Erreur:', error);
        tasks = [];
    } finally {
        showLoading(false);
    }
}

// Réinitialiser tous les filtres
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterStatut').value = '';
    document.getElementById('filterPriorite').value = '';
    document.getElementById('filterCategorie').value = '';
    document.getElementById('filterEcheance').value = '';
    document.getElementById('sortBy').value = 'dateCreation';
    document.getElementById('sortOrder').value = 'desc';
    
    loadTasks();
}

// Mettre à jour les statistiques
function updateStats(stats) {
    const statsSection = document.getElementById('statsSection');
    
    if (!stats || Object.keys(stats).length === 0) {
        statsSection.innerHTML = '';
        return;
    }
    
    statsSection.innerHTML = `
        <div class="stats-display">
            <span class="stat-item">📊 Total: <strong>${stats.total || 0}</strong></span>
            <span class="stat-item">⏳ En cours: <strong>${stats.enCours || 0}</strong></span>
            <span class="stat-item">✅ Terminé: <strong>${stats.termine || 0}</strong></span>
            <span class="stat-item">🔴 En retard: <strong>${stats.enRetard || 0}</strong></span>
        </div>
    `;
}

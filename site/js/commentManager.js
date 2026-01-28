// Ajouter un commentaire
async function addComment() {
    if (!currentTaskId) {
        showError('Aucune tâche sélectionnée');
        return;
    }
    
    const texte = document.getElementById('newCommentInput').value.trim();
    if (!texte) {
        showError('Veuillez entrer un commentaire');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${currentTaskId}/commentaires`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                texte: texte,
                auteur: 'Utilisateur'
            })
        });
        
        if (!response.ok) throw new Error('Erreur lors de l\'ajout');
        const data = await response.json();
        
        if (data.success && data.task) {
            const index = tasks.findIndex(t => t._id === currentTaskId);
            if (index !== -1) {
                tasks[index] = data.task;
            }
            document.getElementById('newCommentInput').value = '';
            renderComments(data.task);
            showSuccess('Commentaire ajouté!');
        }
    } catch (error) {
        showError('Impossible d\'ajouter le commentaire');
        console.error('Erreur:', error);
    }
}

// Supprimer un commentaire
async function deleteComment(commentId) {
    if (!currentTaskId) {
        showError('Aucune tâche sélectionnée');
        return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${currentTaskId}/commentaires/${commentId}`, {
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
            renderComments(data.task);
            showSuccess('Commentaire supprimé!');
        } else {
            showError(data.message || 'Erreur lors de la suppression');
        }
    } catch (error) {
        showError('Impossible de supprimer le commentaire: ' + error.message);
        console.error('Erreur:', error);
    }
}

// Afficher les commentaires
function renderComments(task) {
    const list = document.getElementById('modalCommentaires');
    
    if (task.commentaires && task.commentaires.length > 0) {
        list.innerHTML = task.commentaires.map(comment => {
            const date = new Date(comment.dateCreation);
            const dateStr = date.toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <li class="comment-item">
                    <div class="comment-header">
                        <div>
                            <span class="comment-author">${comment.auteur || 'Anonyme'}</span>
                            <span class="comment-date">${dateStr}</span>
                        </div>
                        <button class="btn-small btn-delete" onclick="deleteComment('${comment._id}')">🗑️</button>
                    </div>
                    <div class="comment-text">${comment.texte}</div>
                </li>
            `;
        }).join('');
    } else {
        list.innerHTML = '<p style="color: var(--text-light); font-size: 0.9rem;">Aucun commentaire pour le moment.</p>';
    }
}

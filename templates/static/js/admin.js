// templates/static/js/admin.js
// Logique pour la page admin.html

// Stocker les projets chargés pour les menus déroulants
let allProjects = [];

/**
 * Attache les événements de clic pour révéler la clé API
 */
function attachApiKeyRevealEvents() {
    const adminKey = window.VOCALYX_CONFIG?.DEFAULT_PROJECT_KEY;
    
    document.querySelectorAll(".api-key-reveal").forEach(input => {
        input.addEventListener("click", async (e) => {
            const targetInput = e.target;
            const projectName = targetInput.dataset.project;
            
            if (targetInput.value !== "NON_VISIBLE") {
                targetInput.type = (targetInput.type === 'password' ? 'text' : 'password');
                return;
            }

            targetInput.value = "Chargement...";
            
            try {
                // Utilise l'API client JS
                const projectDetails = await api.getProjectDetails(projectName, adminKey);
                targetInput.value = projectDetails.api_key;
                targetInput.type = "text";
            } catch(err) {
                targetInput.value = "Erreur";
                showToast(`Erreur: ${err.message}`, "error");
            }
        });
    });
}

/**
 * Charge les projets dans le tableau
 */
async function loadProjectsTable() {
    const tableBody = document.getElementById("projects-table-body");
    const adminKey = window.VOCALYX_CONFIG?.DEFAULT_PROJECT_KEY;
    
    if (!adminKey) {
        tableBody.innerHTML = `<tr><td colspan="3" style="color:red; text-align: center;">Erreur: Clé Admin non chargée.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Chargement...</td></tr>';
    
    try {
        // Utilise l'API client JS
        const projects = await api.listProjects(adminKey);

        allProjects = projects;
        
        tableBody.innerHTML = "";
        
        if (projects.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Aucun projet créé.</td></tr>';
            return;
        }

        projects.forEach(p => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td>
                    <input type="password" value="NON_VISIBLE" 
                           title="Cliquez pour récupérer la clé" 
                           data-project="${p.name}" 
                           class="api-key-reveal" 
                           readonly>
                </td>
                <td>${formatHumanDate(p.created_at)}</td>
            `;
            tableBody.appendChild(row);
        });

        attachApiKeyRevealEvents();

    } catch (err) {
        tableBody.innerHTML = `
            <tr><td colspan="3" style="color:red; text-align: center;">
                Erreur: ${err.message}
            </td></tr>
        `;
    }
}

/**
 * Logique de création de projet
 */
document.getElementById("create-project-btn").addEventListener("click", async () => {
    const input = document.getElementById("new-project-name-input");
    const projectName = input.value;
    const adminKey = window.VOCALYX_CONFIG?.DEFAULT_PROJECT_KEY;
    
    if (!projectName) {
        showToast("Le nom du projet est requis", "warning");
        return;
    }
    
    try {
        // Utilise l'API client JS
        const newProject = await api.createProject(projectName, adminKey);
        showToast(`Projet '${newProject.name}' créé !`, "success");
        input.value = "";
        await loadProjectsTable();
        await loadUsersList();
        
    } catch (err) {
        showToast(`Erreur: ${err.message}`, "error");
    }
});

// ========================================================================
// GESTION DES UTILISATEURS (NOUVEAU)
// ========================================================================

/**
 * Crée le HTML pour le menu déroulant d'assignation de projet
 */
function createProjectSelector(user) {
    // Projets que l'utilisateur n'a PAS ENCORE
    const userProjectIds = new Set(user.projects.map(p => p.id));
    const availableProjects = allProjects.filter(p => !userProjectIds.has(p.id));

    if (availableProjects.length === 0) {
        return `<small>Tous les projets sont assignés.</small>`;
    }

    const options = availableProjects.map(p => 
        `<option value="${p.id}">${escapeHtml(p.name)}</option>`
    ).join('');

    return `
        <div class="form-group-inline">
            <select class="project-assign-select" data-user-id="${user.id}">
                ${options}
            </select>
            <button class="btn btn-small btn-success btn-assign-project" data-user-id="${user.id}">Assigner</button>
        </div>
    `;
}

/**
 * Affiche la liste des utilisateurs dans des "cartes"
 */
async function loadUsersList() {
    const container = document.getElementById("users-list-container");
    container.innerHTML = "<p>Chargement des utilisateurs...</p>";
    
    try {
        const users = await api.listUsers();
        container.innerHTML = "";
        
        if (users.length === 0) {
            container.innerHTML = "<p>Aucun utilisateur créé.</p>";
            return;
        }
        
        users.forEach(user => {
            const card = document.createElement("div");
            card.className = "user-card";
            
            const projectsList = user.projects.map(p => `
                <li>
                    <span>${escapeHtml(p.name)}</span>
                    <button class="btn btn-small btn-danger btn-remove-project" 
                            data-user-id="${user.id}" 
                            data-project-id="${p.id}">Retirer</button>
                </li>
            `).join('');
            
            card.innerHTML = `
                <div class="user-header">
                    <div>
                        <strong>${escapeHtml(user.username)}</strong>
                        ${user.is_admin ? '<span style="color:var(--danger);font-weight:600;margin-left:1rem;">(Admin)</span>' : ''}
                    </div>
                    ${user.username !== 'admin' ? 
                        `<button class="btn btn-danger btn-delete-user" data-user-id="${user.id}">Supprimer</button>` : 
                        ''}
                </div>
                <hr>
                <strong>Projets Assignés:</strong>
                <ul class="user-projects-list">
                    ${projectsList || '<li><small>Aucun projet assigné.</small></li>'}
                </ul>
                ${!user.is_admin ? createProjectSelector(user) : ''}
            `;
            container.appendChild(card);
        });
        
        // Attacher les événements pour les nouveaux boutons
        attachUserCardEvents();

    } catch (err) {
        container.innerHTML = `<p style="color:red;">Erreur: ${err.message}</p>`;
    }
}

/**
 * Attache les événements aux boutons sur les cartes utilisateur
 */
function attachUserCardEvents() {
    // Bouton "Supprimer Utilisateur"
    document.querySelectorAll(".btn-delete-user").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const userId = e.target.dataset.userId;
            if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
                try {
                    await api.deleteUser(userId);
                    showToast("Utilisateur supprimé", "success");
                    await loadUsersList();
                } catch (err) {
                    showToast(`Erreur: ${err.message}`, "error");
                }
            }
        });
    });

    // Bouton "Assigner Projet"
    document.querySelectorAll(".btn-assign-project").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const userId = e.target.dataset.userId;
            const select = document.querySelector(`.project-assign-select[data-user-id="${userId}"]`);
            const projectId = select.value;
            
            if (!projectId) return;
            
            try {
                await api.assignProjectToUser(userId, projectId);
                showToast("Projet assigné", "success");
                await loadUsersList(); // Recharger la carte
            } catch (err) {
                showToast(`Erreur: ${err.message}`, "error");
            }
        });
    });
    
    // Bouton "Retirer Projet"
    document.querySelectorAll(".btn-remove-project").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const userId = e.target.dataset.userId;
            const projectId = e.target.dataset.projectId;
            
            try {
                await api.removeProjectFromUser(userId, projectId);
                showToast("Projet retiré", "success");
                await loadUsersList(); // Recharger la carte
            } catch (err) {
                showToast(`Erreur: ${err.message}`, "error");
            }
        });
    });
}

/**
 * Logique de création d'utilisateur
 */
document.getElementById("create-user-btn").addEventListener("click", async () => {
    const usernameInput = document.getElementById("new-user-username");
    const passwordInput = document.getElementById("new-user-password");
    const isAdminInput = document.getElementById("new-user-is-admin");

    const username = usernameInput.value;
    const password = passwordInput.value;
    const isAdmin = isAdminInput.checked;

    if (!username || !password) {
        showToast("Nom d'utilisateur et mot de passe requis", "warning");
        return;
    }
    
    try {
        await api.createUser(username, password, isAdmin);
        showToast(`Utilisateur '${username}' créé !`, "success");
        usernameInput.value = "";
        passwordInput.value = "";
        isAdminInput.checked = false;
        await loadUsersList();
    } catch (err) {
        showToast(`Erreur: ${err.message}`, "error");
    }
});

// Point d'entrée
document.addEventListener('DOMContentLoaded', async () => {
    await loadProjectsTable();
    await loadUsersList();
});
// templates/static/js/events.js
// Gestion des événements utilisateur (adapté pour l'architecture API)

// --- Gestion Modale Upload ---
const uploadModal = document.getElementById("upload-modal");
const uploadModalClose = document.getElementById("upload-modal-close");

document.getElementById("open-upload-modal-btn").addEventListener("click", () => {
    uploadModal.style.display = "block";
    document.getElementById("upload-project-select").dispatchEvent(new Event('change'));
});

uploadModalClose.onclick = () => uploadModal.style.display = "none";

// Auto-remplir la clé API si on choisit le projet par défaut
document.getElementById("upload-project-select").addEventListener("change", (e) => {
    const apiKeyInput = document.getElementById("upload-api-key-input");
    const defaultProjectName = window.VOCALYX_CONFIG?.DEFAULT_PROJECT_NAME;
    const defaultProjectKey = window.VOCALYX_CONFIG?.DEFAULT_PROJECT_KEY;
    
    if (e.target.value === defaultProjectName && defaultProjectKey) {
        apiKeyInput.value = defaultProjectKey;
        apiKeyInput.disabled = true;
    } else {
        apiKeyInput.value = "";
        apiKeyInput.disabled = false;
        apiKeyInput.placeholder = "Collez la clé API (vk_...) du projet";
    }
});

// Logique d'upload (bouton "Soumettre" de la modale)
document.getElementById("upload-submit-btn").addEventListener("click", async () => {
    const fileInput = document.getElementById("upload-file-input");
    const file = fileInput.files[0];
    
    if (!file) {
        showToast("Veuillez sélectionner un fichier.", "warning");
        return;
    }

    const projectName = document.getElementById("upload-project-select").value;
    const apiKey = document.getElementById("upload-api-key-input").value;
    const useVad = document.getElementById("upload-use-vad").checked;

    if (!projectName || !apiKey) {
        showToast("Projet ou Clé API manquant.", "warning");
        return;
    }

    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.style.display = "flex";
    
    try {
        const result = await api.uploadAudio(file, projectName, apiKey, useVad);
        
        showToast(`✅ Upload (Projet: ${projectName}) réussi !`, "success");
        
        await refreshTranscriptions(1, currentLimit);
        uploadModal.style.display = "none";
        
    } catch (err) {
        showToast(`❌ Erreur: ${err.message}`, "error");
    } finally {
        loadingOverlay.style.display = "none";
        fileInput.value = "";
    }
});

// --- Gestion Modale Projets (SUPPRIMÉ) ---
// La logique de gestion des projets est maintenant dans /admin et admin.js


// --- Filtres du Header ---

document.getElementById("status-filter").addEventListener("change", () => {
    refreshTranscriptions(1, currentLimit);
});

document.getElementById("project-filter").addEventListener("change", () => {
    refreshTranscriptions(1, currentLimit);
});

document.getElementById("search-input").addEventListener("input", () => {
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        refreshTranscriptions(1, currentLimit);
    }, 300);
});

// --- Bouton Export ---
document.getElementById("export-btn").addEventListener("click", async () => {
    showToast("La fonction 'Exporter' n'est pas encore implémentée.", "info");
});
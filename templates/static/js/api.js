// templates/static/js/api.js
// Client JavaScript pour communiquer avec le dashboard (qui proxie vers l'API)

/**
 * Client API pour le Dashboard Vocalyx
 * Tous les appels passent par le backend du dashboard
 */
class VocalyxDashboardAPI {
    constructor() {
        this.baseURL = window.location.origin;
        console.log("🔧 API Client initialized, baseURL:", this.baseURL);
    }
    
    /**
     * Gère les erreurs HTTP
     */
    async _handleResponse(response) {
        console.log("📡 Response received:", response.status, response.url);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Response error:", errorText);
            let errorMessage = errorText;
            
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.detail || errorJson.message || errorText;
            } catch (e) {
                // Pas JSON, garder le texte brut
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log("✅ Response data:", data);
        return data;
    }
    
    // ========================================================================
    // PROJETS
    // ========================================================================
    
    async listProjects(adminKey) {
        const params = new URLSearchParams({ admin_key: adminKey });
        
        const response = await fetch(`${this.baseURL}/api/projects?${params}`, {
            method: 'GET'
            // Pas de body !
        });
        return this._handleResponse(response);
    }
    
    async createProject(projectName, adminKey) {
        // POST est correct, il garde le body
        const formData = new FormData();
        formData.append('project_name', projectName);
        formData.append('admin_key', adminKey);
        
        const response = await fetch(`${this.baseURL}/api/projects`, {
            method: 'POST',
            body: formData
        });
        return this._handleResponse(response);
    }
    
    async getProjectDetails(projectName, adminKey) {
        const params = new URLSearchParams({ admin_key: adminKey });
        
        const response = await fetch(`${this.baseURL}/api/projects/${projectName}?${params}`, {
            method: 'GET'
            // Pas de body !
        });
        return this._handleResponse(response);
    }
    
    // ========================================================================
    // TRANSCRIPTIONS
    // ========================================================================
    
    async uploadAudio(file, projectName, apiKey, useVad = true) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_name', projectName);
        formData.append('api_key', apiKey);
        formData.append('use_vad', useVad);
        
        const response = await fetch(`${this.baseURL}/api/upload`, {
            method: 'POST',
            body: formData
        });
        return this._handleResponse(response);
    }
    
    async getTranscriptions(page = 1, limit = 25, filters = {}) {
        console.log("📞 Calling getTranscriptions:", { page, limit, filters });
        
        const params = new URLSearchParams({
            page: page,
            limit: limit
        });
        
        if (filters.status) params.append('status', filters.status);
        if (filters.project) params.append('project', filters.project);
        if (filters.search) params.append('search', filters.search);
        
        const url = `${this.baseURL}/api/transcriptions/recent?${params}`;
        console.log("🌐 Fetching URL:", url);
        
        const response = await fetch(url, {
            credentials: 'include'
        });
        
        return this._handleResponse(response);
    }
    
    async getTranscription(transcriptionId) {
        const response = await fetch(`${this.baseURL}/api/transcriptions/${transcriptionId}`, {
            credentials: 'include'  // ✅ AJOUT
        });
        return this._handleResponse(response);
    }

    async deleteTranscription(transcriptionId) {
        const response = await fetch(`${this.baseURL}/api/transcriptions/${transcriptionId}`, {
            method: 'DELETE',
            credentials: 'include'  // ✅ AJOUT
        });
        return this._handleResponse(response);
    }
    
    async countTranscriptions(filters = {}) {
        console.log("📞 Calling countTranscriptions:", filters);
        
        const params = new URLSearchParams();
        
        if (filters.status) params.append('status', filters.status);
        if (filters.project) params.append('project', filters.project);
        if (filters.search) params.append('search', filters.search);
        
        const url = `${this.baseURL}/api/transcriptions/count?${params}`;
        console.log("🌐 Fetching URL:", url);
        
        const response = await fetch(url, {
            credentials: 'include'
        });
        
        return this._handleResponse(response);
    }
    
    // ========================================================================
    // WORKERS
    // ========================================================================
    
    async getWorkersStatus() {
        const response = await fetch(`${this.baseURL}/api/workers/status`, {
            credentials: 'include'  // ✅ AJOUT
        });
        return this._handleResponse(response);
    }

    // ========================================================================
    // GESTION DES UTILISATEURS (NOUVEAU)
    // ========================================================================
    
    async listUsers() {
        const response = await fetch(`${this.baseURL}/api/admin/users`, {
            method: 'GET'
        });
        return this._handleResponse(response);
    }
    
    async createUser(username, password, isAdmin) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('is_admin', isAdmin);
        
        const response = await fetch(`${this.baseURL}/api/admin/users`, {
            method: 'POST',
            body: formData
        });
        return this._handleResponse(response);
    }
    
    async assignProjectToUser(userId, projectId) {
        const response = await fetch(`${this.baseURL}/api/admin/users/assign-project`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId, project_id: projectId })
        });
        return this._handleResponse(response);
    }
    
    async removeProjectFromUser(userId, projectId) {
        const response = await fetch(`${this.baseURL}/api/admin/users/remove-project`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId, project_id: projectId })
        });
        return this._handleResponse(response);
    }
    
    async deleteUser(userId) {
        const response = await fetch(`${this.baseURL}/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        return this._handleResponse(response);
    }
}

// Exporter l'instance globale
const api = new VocalyxDashboardAPI();
console.log("✅ Global API instance created");
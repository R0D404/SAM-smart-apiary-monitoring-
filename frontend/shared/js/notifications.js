/**
 * Helper to show dynamic toast notifications (Success or Error)
 */

function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function showToast(title, message, type = 'success') {
    const container = ensureToastContainer();
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type} hidden`;
    
    // Select icon based on type
    const svgIcon = type === 'success' 
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        
    toast.innerHTML = `
        <div class="toast-icon-wrapper">
            ${svgIcon}
        </div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Reflow to trigger CSS transition
    toast.offsetHeight;
    
    // Show toast
    toast.classList.remove('hidden');
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
        // Remove from DOM after fade-out transition completes (400ms)
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 4000);
}

// Global helpers
window.showSuccessToast = (title, message) => showToast(title, message, 'success');
window.showErrorToast = (title, message) => showToast(title, message, 'error');

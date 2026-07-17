/**
 * chartModals.js
 * Shared modal open/close + ESC/backdrop for all dashboards
 */

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        // Resize charts inside modal after it becomes visible
        setTimeout(() => {
            const canvases = modal.querySelectorAll('canvas');
            canvases.forEach(c => {
                const chartInstance = Chart.getChart(c);
                if (chartInstance) chartInstance.resize();
            });
        }, 50);
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// Close on backdrop click or ESC
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => {
            m.classList.remove('active');
        });
    }
});

// Utility for algorithm delay
window.isPaused = false;
window.isStopped = false;

async function sleep(ms) {
    if (window.isStopped) throw new Error('STOPPED');
    while (window.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (window.isStopped) throw new Error('STOPPED');
    }
    await new Promise(resolve => setTimeout(resolve, ms));
    if (window.isStopped) throw new Error('STOPPED');
}

// Global metrics state
const metrics = {
    timeComplexity: '-',
    spaceComplexity: '-',
    execSteps: 0,
    nodesVisited: 0,
    pathLength: 0
};

function updateMetrics(updates = {}) {
    Object.assign(metrics, updates);
    document.getElementById('time-complexity').innerText = metrics.timeComplexity;
    document.getElementById('space-complexity').innerText = metrics.spaceComplexity;
    document.getElementById('exec-steps').innerText = metrics.execSteps;
    document.getElementById('nodes-visited').innerText = metrics.nodesVisited;
    document.getElementById('path-length').innerText = metrics.pathLength;
}

function resetMetrics() {
    updateMetrics({
        timeComplexity: '-',
        spaceComplexity: '-',
        execSteps: 0,
        nodesVisited: 0,
        pathLength: 0
    });
}

// Tab Switching
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('section').forEach(s => s.classList.remove('active-section'));
        
        btn.classList.add('active');
        const target = btn.dataset.target;
        document.getElementById(target).classList.add('active-section');
        
        const nodesVisitedContainer = document.getElementById('nodes-visited-container');
        const pathLengthContainer = document.getElementById('path-length-container');
        if (target === 'sorting-section' || target === 'searching-section') {
            if (nodesVisitedContainer) nodesVisitedContainer.style.display = 'none';
            if (pathLengthContainer) pathLengthContainer.style.display = 'none';
        } else {
            if (nodesVisitedContainer) nodesVisitedContainer.style.display = '';
            if (pathLengthContainer) pathLengthContainer.style.display = '';
        }

        resetMetrics();
    });
});

// About Dropdown Toggle
const aboutBtn = document.getElementById('about-btn');
const aboutDropdown = document.getElementById('about-dropdown');
const backdrop = document.getElementById('backdrop');

if (aboutBtn && aboutDropdown) {
    aboutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = aboutDropdown.classList.contains('hidden');
        if (isHidden) {
            aboutDropdown.classList.remove('hidden');
            if (backdrop) backdrop.classList.remove('hidden');
        } else {
            aboutDropdown.classList.add('hidden');
            if (backdrop) backdrop.classList.add('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!aboutDropdown.contains(e.target) && !aboutBtn.contains(e.target)) {
            aboutDropdown.classList.add('hidden');
            if (backdrop) backdrop.classList.add('hidden');
        }
    });
}

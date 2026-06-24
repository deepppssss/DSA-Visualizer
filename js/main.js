// Utility for algorithm delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
        document.getElementById(btn.dataset.target).classList.add('active-section');
        resetMetrics();
    });
});

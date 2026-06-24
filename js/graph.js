// Graph State
let nodes = [];
let edges = [];
let graphMode = 'add-node'; // 'add-node', 'add-edge', 'set-start', 'set-end'
let startNodeId = null;
let endNodeId = null;
let nextNodeId = 0;
let isGraphRunning = false;
let selectedNodeForEdge = null; // Used when adding an edge

const graphContainer = document.getElementById('graph-container');
const nodesContainer = document.getElementById('graph-nodes');
const edgesSvg = document.getElementById('graph-edges');
let edgeWeightModal = document.getElementById('edge-weight-modal');
let pendingEdgeTarget = null;

// Controls
document.getElementById('btn-add-node').addEventListener('click', () => setGraphMode('add-node'));
document.getElementById('btn-add-edge').addEventListener('click', () => setGraphMode('add-edge'));
document.getElementById('btn-set-start').addEventListener('click', () => setGraphMode('set-start'));
document.getElementById('btn-set-end').addEventListener('click', () => setGraphMode('set-end'));
document.getElementById('btn-clear-graph').addEventListener('click', clearGraph);
document.getElementById('btn-run-graph').addEventListener('click', runGraphAlgorithm);

document.getElementById('graph-type-directed').addEventListener('change', clearGraph);
document.getElementById('graph-type-weight').addEventListener('change', clearGraph);

function setGraphMode(mode) {
    if (isGraphRunning) return;
    graphMode = mode;
    document.querySelectorAll('#graph-section .mode-btn').forEach(btn => btn.classList.remove('active-mode'));
    document.getElementById(`btn-${mode}`).classList.add('active-mode');
    if (selectedNodeForEdge !== null) {
        const n = nodes.find(n => n.id === selectedNodeForEdge);
        if (n) n.el.classList.remove('active');
    }
    selectedNodeForEdge = null;
}

graphContainer.addEventListener('click', (e) => {
    if (isGraphRunning) return;
    if (graphMode === 'add-node' && e.target === nodesContainer) {
        const rect = nodesContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addNode(x, y);
    }
});

function addNode(x, y) {
    const id = nextNodeId++;
    const nodeEl = document.createElement('div');
    nodeEl.className = 'node';
    nodeEl.innerText = id;
    nodeEl.style.left = `${x}px`;
    nodeEl.style.top = `${y}px`;
    nodeEl.dataset.id = id;
    
    nodeEl.addEventListener('click', (e) => handleNodeClick(id, e));
    
    nodes.push({ id, x, y, el: nodeEl });
    nodesContainer.appendChild(nodeEl);
}

function handleNodeClick(id, e) {
    if (isGraphRunning) return;
    e.stopPropagation();
    
    if (graphMode === 'add-edge') {
        if (selectedNodeForEdge === null) {
            selectedNodeForEdge = id;
            nodes.find(n => n.id === id).el.classList.add('active');
        } else if (selectedNodeForEdge !== id) {
            // Open modal to get weight
            pendingEdgeTarget = id;
            const isWeighted = document.getElementById('graph-type-weight').value === 'weighted';
            if (isWeighted) {
                edgeWeightModal.classList.add('show');
            } else {
                addEdge(selectedNodeForEdge, pendingEdgeTarget, 1);
                nodes.find(n => n.id === selectedNodeForEdge).el.classList.remove('active');
                selectedNodeForEdge = null;
                pendingEdgeTarget = null;
            }
        } else {
            selectedNodeForEdge = null;
            nodes.find(n => n.id === id).el.classList.remove('active');
        }
    } else if (graphMode === 'set-start') {
        if (startNodeId !== null) {
            const old = nodes.find(n => n.id === startNodeId);
            if(old) old.el.classList.remove('start-node');
        }
        startNodeId = id;
        nodes.find(n => n.id === id).el.classList.add('start-node');
    } else if (graphMode === 'set-end') {
        if (endNodeId !== null) {
            const old = nodes.find(n => n.id === endNodeId);
            if(old) old.el.classList.remove('end-node');
        }
        endNodeId = id;
        nodes.find(n => n.id === id).el.classList.add('end-node');
    }
}

// Edge weight modal handling
document.getElementById('btn-confirm-weight').addEventListener('click', () => {
    const weight = parseInt(document.getElementById('edge-weight-input').value) || 1;
    addEdge(selectedNodeForEdge, pendingEdgeTarget, weight);
    const sn = nodes.find(n => n.id === selectedNodeForEdge);
    if(sn) sn.el.classList.remove('active');
    selectedNodeForEdge = null;
    pendingEdgeTarget = null;
    edgeWeightModal.classList.remove('show');
});

document.getElementById('btn-cancel-weight').addEventListener('click', () => {
    const sn = nodes.find(n => n.id === selectedNodeForEdge);
    if(sn) sn.el.classList.remove('active');
    selectedNodeForEdge = null;
    pendingEdgeTarget = null;
    edgeWeightModal.classList.remove('show');
});

function addEdge(sourceId, targetId, weight) {
    const isDirected = document.getElementById('graph-type-directed').value === 'directed';
    const isWeighted = document.getElementById('graph-type-weight').value === 'weighted';

    if (edges.find(e => {
        if (isDirected) return e.source === sourceId && e.target === targetId;
        return (e.source === sourceId && e.target === targetId) || (e.source === targetId && e.target === sourceId);
    })) {
        return; // Edge already exists
    }
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'edge');
    line.setAttribute('x1', sourceNode.x);
    line.setAttribute('y1', sourceNode.y);
    line.setAttribute('x2', targetNode.x);
    line.setAttribute('y2', targetNode.y);
    line.dataset.source = sourceId;
    line.dataset.target = targetId;

    if (isDirected) {
        line.setAttribute('marker-end', 'url(#arrowhead)');
    }
    
    edgesSvg.appendChild(line);

    let textGroup = null;
    if (isWeighted) {
        // Add weight text
        textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        
        const textBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        textBg.setAttribute('x', midX - 10);
        textBg.setAttribute('y', midY - 10);
        textBg.setAttribute('width', 20);
        textBg.setAttribute('height', 20);
        textBg.setAttribute('class', 'edge-weight-bg');
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', midX);
        text.setAttribute('y', midY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('class', 'edge-weight');
        text.textContent = weight;
        
        textGroup.appendChild(textBg);
        textGroup.appendChild(text);
        
        edgesSvg.appendChild(textGroup);
    }
    
    edges.push({ source: sourceId, target: targetId, weight, lineEl: line, textGroupEl: textGroup });
}

function clearGraph() {
    if (isGraphRunning) return;
    nodes = [];
    edges = [];
    nextNodeId = 0;
    startNodeId = null;
    endNodeId = null;
    nodesContainer.innerHTML = '';
    Array.from(edgesSvg.children).forEach(child => {
        if (child.tagName.toLowerCase() !== 'defs') {
            child.remove();
        }
    });
    resetMetrics();
}

function resetGraphVisuals() {
    const isDirected = document.getElementById('graph-type-directed').value === 'directed';
    nodes.forEach(n => {
        n.el.classList.remove('visited', 'path', 'active');
        if (n.id === startNodeId) n.el.classList.add('start-node');
        if (n.id === endNodeId) n.el.classList.add('end-node');
    });
    edges.forEach(e => {
        e.lineEl.classList.remove('active', 'path');
        if (isDirected) {
            e.lineEl.setAttribute('marker-end', 'url(#arrowhead)');
        }
    });
    resetMetrics();
}

async function runGraphAlgorithm() {
    if (isGraphRunning || startNodeId === null || endNodeId === null) {
        if (startNodeId === null || endNodeId === null) {
            alert('Please set a start and end node.');
        }
        return;
    }
    const algo = document.getElementById('graph-algo').value;
    const speed = 1010 - parseInt(document.getElementById('graph-speed').value);
    
    isGraphRunning = true;
    resetGraphVisuals();
    
    const adjList = buildAdjacencyList();
    
    if (algo === 'bfs') await bfs(adjList, speed);
    else if (algo === 'dfs') await dfs(adjList, speed);
    else if (algo === 'dijkstra') await dijkstra(adjList, speed);
    
    isGraphRunning = false;
}

function buildAdjacencyList() {
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    const isDirected = document.getElementById('graph-type-directed').value === 'directed';
    edges.forEach(e => {
        adj[e.source].push({ target: e.target, weight: e.weight });
        if (!isDirected) {
            adj[e.target].push({ target: e.source, weight: e.weight }); // Undirected
        }
    });
    return adj;
}

function highlightEdge(u, v, className) {
    const isDirected = document.getElementById('graph-type-directed').value === 'directed';
    const edge = edges.find(e => {
        if (isDirected) return e.source === u && e.target === v;
        return (e.source === u && e.target === v) || (e.source === v && e.target === u);
    });
    if (edge) {
        edge.lineEl.classList.add(className);
        if (isDirected) {
            if (className === 'active') edge.lineEl.setAttribute('marker-end', 'url(#arrowhead-active)');
            else if (className === 'path') edge.lineEl.setAttribute('marker-end', 'url(#arrowhead-path)');
        }
    }
}

// Graph Algorithms
async function bfs(adjList, speed) {
    updateMetrics({ timeComplexity: 'O(V + E)', spaceComplexity: 'O(V)' });
    
    let queue = [startNodeId];
    let visited = new Set([startNodeId]);
    let parent = {};
    let steps = 0;
    
    nodes.find(n => n.id === startNodeId).el.classList.add('visited');
    
    while (queue.length > 0) {
        let current = queue.shift();
        steps++;
        updateMetrics({ execSteps: steps, nodesVisited: visited.size });
        
        if (current === endNodeId) {
            await drawPath(parent, speed);
            return;
        }
        
        for (let neighborInfo of adjList[current]) {
            let neighbor = neighborInfo.target;
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                parent[neighbor] = current;
                queue.push(neighbor);
                
                highlightEdge(current, neighbor, 'active');
                nodes.find(n => n.id === neighbor).el.classList.add('active');
                await sleep(speed);
                nodes.find(n => n.id === neighbor).el.classList.remove('active');
                nodes.find(n => n.id === neighbor).el.classList.add('visited');
            }
        }
    }
}

async function dfs(adjList, speed) {
    updateMetrics({ timeComplexity: 'O(V + E)', spaceComplexity: 'O(V)' });
    
    let stack = [startNodeId];
    let visited = new Set();
    let parent = {};
    let steps = 0;
    
    while (stack.length > 0) {
        let current = stack.pop();
        
        if (!visited.has(current)) {
            visited.add(current);
            steps++;
            updateMetrics({ execSteps: steps, nodesVisited: visited.size });
            nodes.find(n => n.id === current).el.classList.add('visited');
            await sleep(speed);
            
            if (current === endNodeId) {
                await drawPath(parent, speed);
                return;
            }
            
            for (let neighborInfo of adjList[current]) {
                let neighbor = neighborInfo.target;
                if (!visited.has(neighbor)) {
                    parent[neighbor] = current; // Might overwrite, DFS path isn't shortest
                    stack.push(neighbor);
                    highlightEdge(current, neighbor, 'active');
                }
            }
        }
    }
}

async function dijkstra(adjList, speed) {
    updateMetrics({ timeComplexity: 'O((V + E) log V)', spaceComplexity: 'O(V)' });
    
    let dist = {};
    let parent = {};
    let visited = new Set();
    nodes.forEach(n => dist[n.id] = Infinity);
    dist[startNodeId] = 0;
    let steps = 0;
    
    while (visited.size < nodes.length) {
        // Find min dist unvisited
        let u = null;
        let minDist = Infinity;
        for (let id in dist) {
            if (!visited.has(parseInt(id)) && dist[id] < minDist) {
                minDist = dist[id];
                u = parseInt(id);
            }
        }
        
        if (u === null || u === endNodeId) break;
        
        visited.add(u);
        steps++;
        updateMetrics({ execSteps: steps, nodesVisited: visited.size });
        nodes.find(n => n.id === u).el.classList.add('visited');
        await sleep(speed);
        
        for (let neighborInfo of adjList[u]) {
            let v = neighborInfo.target;
            let weight = neighborInfo.weight;
            
            if (!visited.has(v) && dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                parent[v] = u;
                highlightEdge(u, v, 'active');
                nodes.find(n => n.id === v).el.classList.add('active');
                await sleep(speed);
                nodes.find(n => n.id === v).el.classList.remove('active');
            }
        }
    }
    
    if (parent[endNodeId] !== undefined) {
        nodes.find(n => n.id === endNodeId).el.classList.add('visited');
        await drawPath(parent, speed);
    }
}

async function drawPath(parentMap, speed) {
    let curr = endNodeId;
    let pathLen = 0;
    while (curr !== startNodeId) {
        let p = parentMap[curr];
        if (p === undefined) break; // no path
        
        nodes.find(n => n.id === curr).el.classList.add('path');
        highlightEdge(p, curr, 'path');
        
        // Find weight for path length
        let edge = edges.find(e => (e.source === p && e.target === curr) || (e.source === curr && e.target === p));
        pathLen += edge ? edge.weight : 1;
        updateMetrics({ pathLength: pathLen });
        
        curr = p;
        await sleep(speed);
    }
    nodes.find(n => n.id === startNodeId).el.classList.add('path');
}

// Initial setup
setTimeout(() => {
    addNode(150, 150);
    addNode(350, 150);
    addNode(250, 300);
    addNode(450, 300);
    addNode(250, 50);
    addEdge(4, 0, 4);
    addEdge(4, 1, 2);
    addEdge(0, 2, 5);
    addEdge(1, 2, 1);
    addEdge(1, 3, 7);
    addEdge(2, 3, 3);
    
    startNodeId = 4;
    endNodeId = 3;
    nodes.find(n => n.id === startNodeId).el.classList.add('start-node');
    nodes.find(n => n.id === endNodeId).el.classList.add('end-node');
}, 500); // slight delay to allow dom render

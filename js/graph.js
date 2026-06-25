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

document.getElementById('graph-algo').addEventListener('change', (e) => {
    const algo = e.target.value;
    const requiresStartEnd = ['bfs', 'dfs', 'dijkstra', 'bellman-ford'];
    const startBtn = document.getElementById('btn-set-start');
    const endBtn = document.getElementById('btn-set-end');
    const infoPanel = document.getElementById('algo-info');
    const typeDirected = document.getElementById('graph-type-directed');
    const edgeWeightInput = document.getElementById('edge-weight-input');

    if (requiresStartEnd.includes(algo)) {
        startBtn.style.display = 'inline-block';
        endBtn.style.display = 'inline-block';
    } else {
        startBtn.style.display = 'none';
        endBtn.style.display = 'none';
        if (graphMode === 'set-start' || graphMode === 'set-end') setGraphMode('add-node');
    }

    // UI Constraints
    const optionUndirected = typeDirected.querySelector('option[value="undirected"]');
    optionUndirected.disabled = false;
    optionUndirected.classList.remove('disabled-option');
    typeDirected.disabled = false;

    if (algo === 'topo-sort' || algo === 'bellman-ford') {
        typeDirected.value = 'directed';
        optionUndirected.disabled = true;
        optionUndirected.classList.add('disabled-option');
    }
    
    if (algo === 'dijkstra') {
        edgeWeightInput.min = "0";
    } else {
        edgeWeightInput.removeAttribute('min');
    }

    // Set info text
    let infoHtml = "";
    if (algo === 'bfs') infoHtml = "<b>Breadth-First Search:</b> Requires Start and End nodes. Works on directed or undirected graphs.";
    else if (algo === 'dfs') infoHtml = "<b>Depth-First Search:</b> Requires Start and End nodes. Works on directed or undirected graphs.";
    else if (algo === 'dijkstra') infoHtml = "<b>Dijkstra's Algorithm:</b> Requires Start and End nodes. Fails on negative edge weights.";
    else if (algo === 'bellman-ford') infoHtml = "<b>Bellman-Ford:</b> Requires Start and End nodes. For Directed Graphs. Detects negative cycles.";
    else if (algo === 'cycle-detection') infoHtml = "<b>Cycle Detection:</b> No Start/End nodes required. Works on any graph.";
    else if (algo === 'topo-sort') infoHtml = "<b>Topological Labeling:</b> Requires Directed Acyclic Graph (DAG). No Start/End nodes required.";
    else if (algo === 'floyd-warshall') infoHtml = "<b>Floyd-Warshall:</b> No Start/End nodes required. Generates All-Pairs Shortest Path Matrix.";

    infoPanel.innerHTML = infoHtml;
});

// Trigger change event to set initial button visibility
document.getElementById('graph-algo').dispatchEvent(new Event('change'));

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
            if (old) old.el.classList.remove('start-node');
        }
        startNodeId = id;
        nodes.find(n => n.id === id).el.classList.add('start-node');
    } else if (graphMode === 'set-end') {
        if (endNodeId !== null) {
            const old = nodes.find(n => n.id === endNodeId);
            if (old) old.el.classList.remove('end-node');
        }
        endNodeId = id;
        nodes.find(n => n.id === id).el.classList.add('end-node');
    }
}

// Edge weight modal handling
document.getElementById('btn-confirm-weight').addEventListener('click', () => {
    const weight = parseInt(document.getElementById('edge-weight-input').value) || 1;
    const algo = document.getElementById('graph-algo').value;
    
    if (algo === 'dijkstra' && weight < 0) {
        alert("Dijkstra's algorithm requires positive edge weights.");
        return;
    }
    
    addEdge(selectedNodeForEdge, pendingEdgeTarget, weight);
    const sn = nodes.find(n => n.id === selectedNodeForEdge);
    if (sn) sn.el.classList.remove('active');
    selectedNodeForEdge = null;
    pendingEdgeTarget = null;
    edgeWeightModal.classList.remove('show');
});

document.getElementById('btn-cancel-weight').addEventListener('click', () => {
    const sn = nodes.find(n => n.id === selectedNodeForEdge);
    if (sn) sn.el.classList.remove('active');
    selectedNodeForEdge = null;
    pendingEdgeTarget = null;
    edgeWeightModal.classList.remove('show');
});

// Draw edge function
redrawEdges();


function redrawEdges() {
    const isDirected = document.getElementById('graph-type-directed').value === 'directed';

    // To handle curves for bidirectional edges
    let edgePairCounts = {};

    edges.forEach(e => {
        let pairKey = e.source < e.target ? `${e.source}-${e.target}` : `${e.target}-${e.source}`;
        if (!edgePairCounts[pairKey]) edgePairCounts[pairKey] = 0;
        edgePairCounts[pairKey]++;
    });

    edges.forEach(e => {
        const sourceNode = nodes.find(n => n.id === e.source);
        const targetNode = nodes.find(n => n.id === e.target);
        if (!sourceNode || !targetNode) return;

        let sx = sourceNode.x, sy = sourceNode.y;
        let tx = targetNode.x, ty = targetNode.y;

        let pairKey = e.source < e.target ? `${e.source}-${e.target}` : `${e.target}-${e.source}`;
        let isBidirectional = isDirected && edgePairCounts[pairKey] > 1;

        let pathStr = "";
        let midX = (sx + tx) / 2;
        let midY = (sy + ty) / 2;

        if (isBidirectional) {
            // Curve the path
            let dx = tx - sx;
            let dy = ty - sy;
            let len = Math.sqrt(dx * dx + dy * dy);
            // normal vector
            let nx = -dy / len;
            let ny = dx / len;

            // offset distance
            let offset = 40;

            let cx = midX + nx * offset;
            let cy = midY + ny * offset;

            pathStr = `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`;

            // Midpoint of quadratic curve for text
            midX = 0.25 * sx + 0.5 * cx + 0.25 * tx;
            midY = 0.25 * sy + 0.5 * cy + 0.25 * ty;
        } else {
            pathStr = `M ${sx},${sy} L ${tx},${ty}`;
        }

        e.lineEl.setAttribute('d', pathStr);
        if (isDirected) {
            e.lineEl.setAttribute('marker-end', 'url(#arrowhead)');
        } else {
            e.lineEl.removeAttribute('marker-end');
        }

        if (e.textGroupEl) {
            const textBg = e.textGroupEl.children[0];
            const textEl = e.textGroupEl.children[1];
            textBg.setAttribute('x', midX - 10);
            textBg.setAttribute('y', midY - 10);
            textEl.setAttribute('x', midX);
            textEl.setAttribute('y', midY);
        }
    });
}

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

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'edge');
    path.dataset.source = sourceId;
    path.dataset.target = targetId;

    edgesSvg.appendChild(path);

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

    edges.push({ source: sourceId, target: targetId, weight, lineEl: path, textGroupEl: textGroup });
    redrawEdges();
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

const graphResults = document.getElementById('graph-results');

function showGraphResults(html) {
    if (graphResults) {
        graphResults.innerHTML = html;
        graphResults.classList.remove('hidden');
    }
}

function hideGraphResults() {
    if (graphResults) {
        graphResults.classList.add('hidden');
        graphResults.innerHTML = '';
    }
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
    hideGraphResults();
}

async function runGraphAlgorithm() {
    if (isGraphRunning) return;

    const algo = document.getElementById('graph-algo').value;
    const isDirected = document.getElementById('graph-type-directed').value === 'directed';
    const requiresStartEnd = ['bfs', 'dfs', 'dijkstra', 'bellman-ford'];

    if (requiresStartEnd.includes(algo) && (startNodeId === null || endNodeId === null)) {
        alert('Please set a start and end node.');
        return;
    }

    // Validations (handled dynamically by UI constraints)
    
    const speed = 1010 - parseInt(document.getElementById('graph-speed').value);

    isGraphRunning = true;
    resetGraphVisuals();

    const adjList = buildAdjacencyList();

    try {
        if (algo === 'bfs') await bfs(adjList, speed);
        else if (algo === 'dfs') await dfs(adjList, speed);
        else if (algo === 'dijkstra') await dijkstra(adjList, speed);
        else if (algo === 'bellman-ford') await bellmanFord(adjList, speed);
        else if (algo === 'cycle-detection') await cycleDetection(adjList, speed);
        else if (algo === 'topo-sort') await topologicalSort(adjList, speed);
        else if (algo === 'floyd-warshall') await floydWarshall(adjList, speed);
    } finally {
        isGraphRunning = false;
    }
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
            let result = await drawPath(parent, speed);
            showGraphResults(`<h4>Success</h4><p>Path found: <strong>${result.pathStr}</strong> with length/weight: <strong>${result.weight}</strong></p>`);
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
    showGraphResults(`<h4>No Path</h4><p>End node is unreachable from Start node.</p>`);
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
                let result = await drawPath(parent, speed);
                showGraphResults(`<h4>Success</h4><p>Path found: <strong>${result.pathStr}</strong> with length/weight: <strong>${result.weight}</strong></p>`);
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
    showGraphResults(`<h4>No Path</h4><p>End node is unreachable from Start node.</p>`);
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
                nodes.find(n => n.id === v).el.classList.add('visited');
            }
        }
    }

    if (parent[endNodeId] !== undefined) {
        nodes.find(n => n.id === endNodeId).el.classList.add('visited');
        let result = await drawPath(parent, speed);
        showGraphResults(`<h4>Success</h4><p>Path found: <strong>${result.pathStr}</strong> with length/weight: <strong>${result.weight}</strong></p>`);
    } else {
        showGraphResults(`<h4>No Path</h4><p>End node is unreachable from Start node.</p>`);
    }
}

async function drawPath(parentMap, speed) {
    let curr = endNodeId;
    let pathLen = 0;
    let pathArr = [curr];

    while (curr !== startNodeId) {
        let p = parentMap[curr];
        if (p === undefined) break; // no path

        nodes.find(n => n.id === curr).el.classList.add('path');
        highlightEdge(p, curr, 'path');

        // Find weight for path length
        let edge = edges.find(e => (e.source === p && e.target === curr) || (e.source === curr && e.target === p));
        pathLen += edge ? edge.weight : 1;
        updateMetrics({ pathLength: pathLen });

        pathArr.push(p);
        curr = p;
        await sleep(speed);
    }
    nodes.find(n => n.id === startNodeId).el.classList.add('path');

    return {
        pathStr: pathArr.reverse().join(' &rarr; '),
        weight: pathLen
    };
}

// New Graph Algorithms
async function bellmanFord(adjList, speed) {
    updateMetrics({ timeComplexity: 'O(V * E)', spaceComplexity: 'O(V)' });

    let dist = {};
    let parent = {};
    nodes.forEach(n => dist[n.id] = Infinity);
    dist[startNodeId] = 0;

    let steps = 0;
    let V = nodes.length;

    for (let i = 1; i <= V - 1; i++) {
        let changed = false;
        for (let u of nodes) {
            for (let neighborInfo of adjList[u.id]) {
                let v = neighborInfo.target;
                let weight = neighborInfo.weight;

                steps++;
                updateMetrics({ execSteps: steps, nodesVisited: Object.keys(parent).length + 1 });

                if (dist[u.id] !== Infinity && dist[u.id] + weight < dist[v]) {
                    dist[v] = dist[u.id] + weight;
                    parent[v] = u.id;
                    changed = true;

                    highlightEdge(u.id, v, 'active');
                    nodes.find(n => n.id === v).el.classList.add('active');
                    await sleep(speed);
                    nodes.find(n => n.id === v).el.classList.remove('active');
                }
            }
        }
        if (!changed) break;
    }

    // Check for negative cycle
    for (let u of nodes) {
        for (let neighborInfo of adjList[u.id]) {
            let v = neighborInfo.target;
            let weight = neighborInfo.weight;
            if (dist[u.id] !== Infinity && dist[u.id] + weight < dist[v]) {
                showGraphResults("<h4>Error</h4><p>Graph contains a negative weight cycle!</p>");
                return;
            }
        }
    }

    if (parent[endNodeId] !== undefined) {
        nodes.find(n => n.id === endNodeId).el.classList.add('visited');
        let result = await drawPath(parent, speed);
        showGraphResults(`<h4>Success</h4><p>Path found: <strong>${result.pathStr}</strong> with length/weight: <strong>${result.weight}</strong></p>`);
    } else {
        showGraphResults("<h4>No Path</h4><p>End node is unreachable from Start node.</p>");
    }
}

async function cycleDetection(adjList, speed) {
    const isDirected = document.getElementById('graph-type-directed').value === 'directed';
    updateMetrics({ timeComplexity: 'O(V + E)', spaceComplexity: 'O(V)' });

    let visited = new Set();
    let recursionStack = new Set();
    let steps = 0;
    let cycleFound = false;

    async function dfsDirected(u) {
        visited.add(u);
        recursionStack.add(u);
        nodes.find(n => n.id === u).el.classList.add('visited');
        steps++;
        updateMetrics({ execSteps: steps, nodesVisited: visited.size });
        await sleep(speed);

        for (let neighborInfo of adjList[u]) {
            let v = neighborInfo.target;
            highlightEdge(u, v, 'active');
            await sleep(speed);

            if (!visited.has(v)) {
                if (await dfsDirected(v)) return true;
            } else if (recursionStack.has(v)) {
                highlightEdge(u, v, 'path');
                return true;
            }
        }
        recursionStack.delete(u);
        return false;
    }

    async function dfsUndirected(u, parent) {
        visited.add(u);
        nodes.find(n => n.id === u).el.classList.add('visited');
        steps++;
        updateMetrics({ execSteps: steps, nodesVisited: visited.size });
        await sleep(speed);

        for (let neighborInfo of adjList[u]) {
            let v = neighborInfo.target;
            if (v === parent) continue;

            highlightEdge(u, v, 'active');
            await sleep(speed);

            if (!visited.has(v)) {
                if (await dfsUndirected(v, u)) return true;
            } else {
                highlightEdge(u, v, 'path');
                return true;
            }
        }
        return false;
    }

    for (let n of nodes) {
        if (!visited.has(n.id)) {
            if (isDirected) {
                cycleFound = await dfsDirected(n.id);
            } else {
                cycleFound = await dfsUndirected(n.id, -1);
            }
            if (cycleFound) break;
        }
    }

    if (cycleFound) {
        showGraphResults(`<h4>Result</h4><p style="color: #ff6b6b; font-weight: bold;">Cycle is present!</p>`);
    } else {
        showGraphResults(`<h4>Result</h4><p style="color: #28a745; font-weight: bold;">No cycle detected.</p>`);
    }
}

async function topologicalSort(adjList, speed) {
    updateMetrics({ timeComplexity: 'O(V + E)', spaceComplexity: 'O(V)' });

    let inDegree = {};
    nodes.forEach(n => inDegree[n.id] = 0);

    for (let u of nodes) {
        for (let neighborInfo of adjList[u.id]) {
            inDegree[neighborInfo.target]++;
        }
    }

    let queue = [];
    nodes.forEach(n => {
        if (inDegree[n.id] === 0) queue.push(n.id);
    });

    let order = [];
    let steps = 0;

    while (queue.length > 0) {
        let u = queue.shift();
        order.push(u);
        nodes.find(n => n.id === u).el.classList.add('visited');

        steps++;
        updateMetrics({ execSteps: steps, nodesVisited: order.length });
        await sleep(speed);

        for (let neighborInfo of adjList[u]) {
            let v = neighborInfo.target;
            highlightEdge(u, v, 'active');
            await sleep(speed);
            inDegree[v]--;
            if (inDegree[v] === 0) {
                queue.push(v);
                nodes.find(n => n.id === v).el.classList.add('active');
            }
        }
    }

    if (order.length !== nodes.length) {
        showGraphResults(`<h4>Error</h4><p>Graph contains a cycle! Topological sort is not possible.</p>`);
    } else {
        showGraphResults(`<h4>Topological Order</h4><p style="font-size: 1.1em; letter-spacing: 2px;">${order.join(' &rarr; ')}</p>`);
    }
}

async function floydWarshall(adjList, speed) {
    updateMetrics({ timeComplexity: 'O(V^3)', spaceComplexity: 'O(V^2)' });

    const V = nodes.length;
    let dist = Array(V).fill().map(() => Array(V).fill(Infinity));
    let nodeMap = {};
    let reverseNodeMap = {};

    nodes.forEach((n, i) => {
        nodeMap[n.id] = i;
        reverseNodeMap[i] = n.id;
        dist[i][i] = 0;
    });

    for (let u of nodes) {
        for (let neighborInfo of adjList[u.id]) {
            let uIdx = nodeMap[u.id];
            let vIdx = nodeMap[neighborInfo.target];
            dist[uIdx][vIdx] = Math.min(dist[uIdx][vIdx], neighborInfo.weight);
        }
    }

    let steps = 0;

    for (let k = 0; k < V; k++) {
        let kId = reverseNodeMap[k];
        nodes.find(n => n.id === kId).el.classList.add('visited');

        for (let i = 0; i < V; i++) {
            for (let j = 0; j < V; j++) {
                steps++;
                if (steps % 10 === 0) {
                    updateMetrics({ execSteps: steps });
                    await sleep(Math.max(1, speed / 5));
                }

                if (dist[i][k] !== Infinity && dist[k][j] !== Infinity && dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
        nodes.find(n => n.id === kId).el.classList.remove('visited');
    }

    let tableHtml = '<table class="distance-matrix"><tr><th>D</th>';
    for (let i = 0; i < V; i++) tableHtml += `<th>${reverseNodeMap[i]}</th>`;
    tableHtml += '</tr>';

    for (let i = 0; i < V; i++) {
        tableHtml += `<tr><th>${reverseNodeMap[i]}</th>`;
        for (let j = 0; j < V; j++) {
            let val = dist[i][j] === Infinity ? '&infin;' : dist[i][j];
            tableHtml += `<td>${val}</td>`;
        }
        tableHtml += '</tr>';
    }
    tableHtml += '</table>';

    showGraphResults(`<h4>All-Pairs Shortest Path Matrix</h4>${tableHtml}`);
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

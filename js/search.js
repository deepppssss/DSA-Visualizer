let searchArray = [];
let searchTarget = null;
let searchBlocks = [];
let isSearching = false;
const searchContainer = document.getElementById('search-container');

document.getElementById('btn-set-search-array').addEventListener('click', () => {
    if (isSearching) return;
    const arrayInput = document.getElementById('search-array-input').value;
    const targetInput = document.getElementById('search-target-input').value;
    
    if (arrayInput) {
        searchArray = arrayInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        searchArray.sort((a,b) => a - b); // Ensure sorted for binary search
        document.getElementById('search-array-input').value = searchArray.join(',');
        renderSearchBlocks();
    }
    if (targetInput !== '') {
        searchTarget = parseInt(targetInput);
    }
});

document.getElementById('btn-random-search-array').addEventListener('click', () => {
    if (isSearching) return;
    searchArray = Array.from({length: 15}, () => Math.floor(Math.random() * 100) + 1);
    searchArray.sort((a,b) => a - b);
    searchTarget = searchArray[Math.floor(Math.random() * searchArray.length)];
    
    document.getElementById('search-array-input').value = searchArray.join(',');
    document.getElementById('search-target-input').value = searchTarget;
    renderSearchBlocks();
});

document.getElementById('btn-run-search').addEventListener('click', async () => {
    if (isSearching || searchArray.length === 0 || searchTarget === null) return;
    const speed = 1010 - parseInt(document.getElementById('search-speed').value);
    
    isSearching = true;
    resetMetrics();
    resetSearchVisuals();
    
    await binarySearch(speed);
    
    isSearching = false;
});

function renderSearchBlocks() {
    searchContainer.innerHTML = '';
    searchBlocks = [];
    searchArray.forEach(val => {
        const block = document.createElement('div');
        block.className = 'search-block';
        block.innerText = val;
        searchContainer.appendChild(block);
        searchBlocks.push(block);
    });
}

function resetSearchVisuals() {
    searchBlocks.forEach(block => {
        block.classList.remove('active', 'visited', 'found');
        block.style.opacity = '1';
        block.style.filter = 'none';
    });
}

async function binarySearch(speed) {
    updateMetrics({ timeComplexity: 'O(log N)', spaceComplexity: 'O(1)' });
    let left = 0;
    let right = searchArray.length - 1;
    let steps = 0;
    
    // Ensure all blocks are visible initially
    for(let i=0; i<searchArray.length; i++) {
        searchBlocks[i].style.opacity = '1';
        searchBlocks[i].style.filter = 'none';
    }

    while (left <= right) {
        steps++;
        updateMetrics({ execSteps: steps, nodesVisited: steps });
        
        let mid = Math.floor((left + right) / 2);
        searchBlocks[mid].classList.add('active');
        
        // Wait to show current mid
        await sleep(speed);
        
        if (searchArray[mid] === searchTarget) {
            searchBlocks[mid].classList.remove('active');
            searchBlocks[mid].classList.add('found');
            
            // Dim and blur all other elements to highlight the found item
            for(let i=0; i<searchArray.length; i++) {
                if (i !== mid) {
                    searchBlocks[i].style.opacity = '0.3';
                    searchBlocks[i].style.filter = 'blur(2px)';
                }
            }
            return;
        } else if (searchArray[mid] < searchTarget) {
            searchBlocks[mid].classList.remove('active');
            searchBlocks[mid].classList.add('visited');
            
            // Blur and dim the eliminated left half (from left up to and including mid)
            for(let i=left; i<=mid; i++) {
                searchBlocks[i].style.opacity = '0.3';
                searchBlocks[i].style.filter = 'blur(2px)';
                searchBlocks[i].classList.remove('active', 'visited');
            }
            left = mid + 1;
        } else {
            searchBlocks[mid].classList.remove('active');
            searchBlocks[mid].classList.add('visited');
            
            // Blur and dim the eliminated right half (from mid up to and including right)
            for(let i=mid; i<=right; i++) {
                searchBlocks[i].style.opacity = '0.3';
                searchBlocks[i].style.filter = 'blur(2px)';
                searchBlocks[i].classList.remove('active', 'visited');
            }
            right = mid - 1;
        }
        
        // Wait to show the elimination effect
        await sleep(speed);
    }

    // Dim everything if not found
    for(let i=0; i<searchArray.length; i++) {
        searchBlocks[i].style.opacity = '0.3';
        searchBlocks[i].style.filter = 'blur(2px)';
        searchBlocks[i].classList.remove('active', 'visited');
    }
    setTimeout(() => alert('Target not found!'), 100);
}

// Initial Search setup
function setInitialSearchArray() {
    searchArray = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
    searchTarget = 23;
    document.getElementById('search-array-input').value = searchArray.join(',');
    document.getElementById('search-target-input').value = searchTarget;
    renderSearchBlocks();
}
setInitialSearchArray();

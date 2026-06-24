let sortArray = [];
let sortBars = [];
let isSorting = false;
const sortContainer = document.getElementById('sort-container');

document.getElementById('btn-set-sort-array').addEventListener('click', () => {
    if (isSorting) return;
    const input = document.getElementById('sort-array-input').value;
    if (input) {
        sortArray = input.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        renderSortBars();
    }
});

document.getElementById('btn-random-sort-array').addEventListener('click', () => {
    if (isSorting) return;
    sortArray = Array.from({length: 20}, () => Math.floor(Math.random() * 100) + 10);
    document.getElementById('sort-array-input').value = sortArray.join(',');
    renderSortBars();
});

document.getElementById('btn-run-sort').addEventListener('click', async () => {
    if (isSorting || sortArray.length === 0) return;
    const algo = document.getElementById('sort-algo').value;
    const speed = 1010 - parseInt(document.getElementById('sort-speed').value);
    
    isSorting = true;
    resetMetrics();
    
    if (algo === 'bubble') await bubbleSort(speed);
    else if (algo === 'selection') await selectionSort(speed);
    else if (algo === 'insertion') await insertionSort(speed);
    else if (algo === 'merge') await mergeSortWrapper(speed);
    else if (algo === 'quick') await quickSortWrapper(speed);
    
    isSorting = false;
});

function renderSortBars() {
    sortContainer.innerHTML = '';
    sortBars = [];
    const maxVal = Math.max(...sortArray, 1);
    
    sortArray.forEach(val => {
        const bar = document.createElement('div');
        bar.className = 'sort-bar';
        bar.style.height = `${(val / maxVal) * 90}%`;
        bar.innerText = val;
        sortContainer.appendChild(bar);
        sortBars.push(bar);
    });
}

function updateBar(idx, heightPercent, text, className) {
    if (sortBars[idx]) {
        sortBars[idx].style.height = `${heightPercent}%`;
        sortBars[idx].innerText = text;
        if (className) {
            sortBars[idx].className = `sort-bar ${className}`;
        }
    }
}

async function bubbleSort(speed) {
    updateMetrics({ timeComplexity: 'O(N^2)', spaceComplexity: 'O(1)' });
    let steps = 0;
    let n = sortArray.length;
    let maxVal = Math.max(...sortArray);
    
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            steps++;
            updateMetrics({ execSteps: steps });
            
            sortBars[j].classList.add('active');
            sortBars[j+1].classList.add('active');
            await sleep(speed);
            
            if (sortArray[j] > sortArray[j+1]) {
                // swap
                let temp = sortArray[j];
                sortArray[j] = sortArray[j+1];
                sortArray[j+1] = temp;
                
                updateBar(j, (sortArray[j]/maxVal)*90, sortArray[j]);
                updateBar(j+1, (sortArray[j+1]/maxVal)*90, sortArray[j+1]);
            }
            sortBars[j].classList.remove('active');
            sortBars[j+1].classList.remove('active');
        }
        sortBars[n-i-1].classList.add('sorted');
    }
    sortBars[0].classList.add('sorted');
}

async function selectionSort(speed) {
    updateMetrics({ timeComplexity: 'O(N^2)', spaceComplexity: 'O(1)' });
    let steps = 0;
    let n = sortArray.length;
    let maxVal = Math.max(...sortArray);
    
    for (let i = 0; i < n; i++) {
        let minIdx = i;
        sortBars[minIdx].classList.add('active');
        
        for (let j = i + 1; j < n; j++) {
            steps++;
            updateMetrics({ execSteps: steps });
            sortBars[j].classList.add('active');
            await sleep(speed);
            
            if (sortArray[j] < sortArray[minIdx]) {
                sortBars[minIdx].classList.remove('active');
                minIdx = j;
                sortBars[minIdx].classList.add('active');
            } else {
                sortBars[j].classList.remove('active');
            }
        }
        
        if (minIdx !== i) {
            let temp = sortArray[i];
            sortArray[i] = sortArray[minIdx];
            sortArray[minIdx] = temp;
            
            updateBar(i, (sortArray[i]/maxVal)*90, sortArray[i]);
            updateBar(minIdx, (sortArray[minIdx]/maxVal)*90, sortArray[minIdx]);
        }
        sortBars[minIdx].classList.remove('active');
        sortBars[i].classList.add('sorted');
    }
}

async function insertionSort(speed) {
    updateMetrics({ timeComplexity: 'O(N^2)', spaceComplexity: 'O(1)' });
    let steps = 0;
    let n = sortArray.length;
    let maxVal = Math.max(...sortArray);
    
    sortBars[0].classList.add('sorted');
    for (let i = 1; i < n; i++) {
        let key = sortArray[i];
        let j = i - 1;
        sortBars[i].classList.add('active');
        await sleep(speed);
        
        while (j >= 0 && sortArray[j] > key) {
            steps++;
            updateMetrics({ execSteps: steps });
            sortArray[j+1] = sortArray[j];
            updateBar(j+1, (sortArray[j+1]/maxVal)*90, sortArray[j+1], 'sorted');
            sortBars[j].classList.add('active');
            await sleep(speed);
            sortBars[j].classList.remove('active');
            j--;
        }
        sortArray[j+1] = key;
        updateBar(j+1, (sortArray[j+1]/maxVal)*90, sortArray[j+1], 'sorted');
        sortBars[i].classList.remove('active');
    }
}

async function mergeSortWrapper(speed) {
    updateMetrics({ timeComplexity: 'O(N log N)', spaceComplexity: 'O(N)' });
    let stepsObj = { val: 0 };
    await mergeSort(0, sortArray.length - 1, speed, stepsObj);
    for(let i=0; i<sortArray.length; i++) sortBars[i].classList.add('sorted');
}

async function mergeSort(l, r, speed, stepsObj) {
    if (l >= r) return;
    let m = l + Math.floor((r - l) / 2);
    await mergeSort(l, m, speed, stepsObj);
    await mergeSort(m + 1, r, speed, stepsObj);
    await merge(l, m, r, speed, stepsObj);
}

async function merge(l, m, r, speed, stepsObj) {
    let maxVal = Math.max(...sortArray);
    let left = sortArray.slice(l, m + 1);
    let right = sortArray.slice(m + 1, r + 1);
    
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
        stepsObj.val++;
        updateMetrics({ execSteps: stepsObj.val });
        sortBars[k].classList.add('active');
        await sleep(speed);
        
        if (left[i] <= right[j]) {
            sortArray[k] = left[i];
            i++;
        } else {
            sortArray[k] = right[j];
            j++;
        }
        updateBar(k, (sortArray[k]/maxVal)*90, sortArray[k]);
        sortBars[k].classList.remove('active');
        k++;
    }
    
    while (i < left.length) {
        stepsObj.val++;
        updateMetrics({ execSteps: stepsObj.val });
        sortBars[k].classList.add('active');
        await sleep(speed);
        sortArray[k] = left[i];
        updateBar(k, (sortArray[k]/maxVal)*90, sortArray[k]);
        sortBars[k].classList.remove('active');
        i++; k++;
    }
    while (j < right.length) {
        stepsObj.val++;
        updateMetrics({ execSteps: stepsObj.val });
        sortBars[k].classList.add('active');
        await sleep(speed);
        sortArray[k] = right[j];
        updateBar(k, (sortArray[k]/maxVal)*90, sortArray[k]);
        sortBars[k].classList.remove('active');
        j++; k++;
    }
}

async function quickSortWrapper(speed) {
    updateMetrics({ timeComplexity: 'O(N log N)', spaceComplexity: 'O(log N)' });
    let stepsObj = { val: 0 };
    await quickSort(0, sortArray.length - 1, speed, stepsObj);
    for(let i=0; i<sortArray.length; i++) sortBars[i].classList.add('sorted');
}

async function quickSort(low, high, speed, stepsObj) {
    if (low < high) {
        let pi = await partition(low, high, speed, stepsObj);
        sortBars[pi].classList.add('sorted');
        await quickSort(low, pi - 1, speed, stepsObj);
        await quickSort(pi + 1, high, speed, stepsObj);
    } else if (low === high) {
        sortBars[low].classList.add('sorted');
    }
}

async function partition(low, high, speed, stepsObj) {
    let pivot = sortArray[high];
    let maxVal = Math.max(...sortArray);
    sortBars[high].classList.add('active'); // pivot
    
    let i = low - 1;
    for (let j = low; j <= high - 1; j++) {
        stepsObj.val++;
        updateMetrics({ execSteps: stepsObj.val });
        
        sortBars[j].classList.add('active');
        await sleep(speed);
        
        if (sortArray[j] < pivot) {
            i++;
            // swap
            let temp = sortArray[i];
            sortArray[i] = sortArray[j];
            sortArray[j] = temp;
            updateBar(i, (sortArray[i]/maxVal)*90, sortArray[i]);
            updateBar(j, (sortArray[j]/maxVal)*90, sortArray[j]);
        }
        sortBars[j].classList.remove('active');
    }
    let temp = sortArray[i+1];
    sortArray[i+1] = sortArray[high];
    sortArray[high] = temp;
    updateBar(i+1, (sortArray[i+1]/maxVal)*90, sortArray[i+1]);
    updateBar(high, (sortArray[high]/maxVal)*90, sortArray[high]);
    sortBars[high].classList.remove('active');
    
    return i + 1;
}

// Initial Array
function setInitialSortArray() {
    sortArray = [50, 20, 80, 10, 90, 30, 70, 40, 60, 25, 85, 15];
    document.getElementById('sort-array-input').value = sortArray.join(',');
    renderSortBars();
}
setInitialSortArray();

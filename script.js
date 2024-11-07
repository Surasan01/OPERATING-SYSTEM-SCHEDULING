// Global variables
let processes = [];
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F06292', '#AED581', 
    '#FFD54F', '#AED6F1', '#A5D6A7', '#FFD180', '#80CBC4', '#FFE082', '#FFAB91',
    '#FFF59D', '#9FA8DA', '#90CAF9', '#81C784', '#CE93D8', '#C5E1A5', '#FFF176',
    '#FFCC80', '#FF9E80', '#B39DDB', '#FF8A65', '#D4E157', '#FFCDD2', '#E1BEE7',
    '#C8E6C9', '#FFF8E1'
];


// Toggle display of input form
document.getElementById('addProcess').addEventListener('click', () => {
    document.getElementById('processInput').style.display = 
        document.getElementById('processInput').style.display === 'none' ? 'block' : 'none';
});

// Submit custom process
document.getElementById('submitProcess').addEventListener('click', () => {
    const arrivalTime = parseInt(document.getElementById('arrivalTime').value);
    const burstTime = parseInt(document.getElementById('burstTime').value);
    const priority = parseInt(document.getElementById('priority').value);
    
    if (!isNaN(arrivalTime) && !isNaN(burstTime) && !isNaN(priority)) {
        addProcess(arrivalTime, burstTime, priority);
        displayProcesses();
    }
});

// Function to add a custom process
function addProcess(arrivalTime, burstTime, priority) {
    const newProcess = {
        id: processes.length + 1,
        arrivalTime,
        burstTime,
        priority,
        remainingTime: burstTime,
        startTime: 0,
        endTime: 0,
        waitingTime: 0,
        turnaroundTime: 0,
    };
    processes.push(newProcess);
}

// Function to reset all processes and results
function resetProcesses() {
    processes = []; // Clear processes array
    document.getElementById('processesContainer').innerHTML = ''; // Clear process display
    document.querySelectorAll('.algorithm-result .gantt-chart').forEach(chart => chart.innerHTML = ''); // Clear gantt charts
    document.querySelectorAll('.algorithm-result .metrics').forEach(metrics => metrics.innerHTML = ''); // Clear metrics
}

// Generate random processes
function generateProcesses() {
    processes = []; // Reset processes array
    for (let i = 0; i < 5; i++) {
        processes.push({
            id: i + 1,
            arrivalTime: Math.floor(Math.random() * 10),
            burstTime: Math.floor(Math.random() * 10) + 1,
            priority: Math.floor(Math.random() * 5) + 1,
            remainingTime: 0,
            startTime: 0,
            endTime: 0,
            waitingTime: 0,
            turnaroundTime: 0,
        });
    }
    displayProcesses(); // Display the newly generated processes
}

// Display processes in the UI
function displayProcesses() {
    const container = document.getElementById('processesContainer');
    container.innerHTML = ''; // Clear previous processes
    processes.forEach((process, index) => {
        const processDiv = document.createElement('div');
        processDiv.className = 'process';
        processDiv.style.backgroundColor = colors[index % colors.length];
        processDiv.innerHTML = `
            <h3>Process ${process.id}</h3>
            <p>Arrival Time: ${process.arrivalTime}</p>
            <p>Burst Time: ${process.burstTime}</p>
            <p>Priority: ${process.priority}</p>
        `;
        container.appendChild(processDiv);
    });
}

// Run all simulations
function runAllSimulations() {
    if (processes.length === 0) {
        alert("Please generate processes before running the simulation.");
        return;
    }
    const algorithms = ['fcfs', 'rr', 'sjf', 'srtf', 'priority', 'hrrn', 'mlq'];
    algorithms.forEach(algorithm => {
        const result = runAlgorithm(algorithm);
        displayResult(algorithm, result);
    });
}


// Run specific algorithm
function runAlgorithm(algorithm) {
    // Reset process properties
    processes.forEach(process => {
        process.remainingTime = process.burstTime;
        process.startTime = 0;
        process.endTime = 0;
        process.waitingTime = 0;
        process.turnaroundTime = 0;
    });

    let timeline = [];
    let currentTime = 0;
    let completedProcesses = 0;
    const totalProcesses = processes.length;

    switch (algorithm) {
        case 'fcfs':
            // First-Come, First-Served (FCFS) implementation
            processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
            processes.forEach(process => {
                if (currentTime < process.arrivalTime) {
                    currentTime = process.arrivalTime;
                }
                process.startTime = currentTime;
                process.endTime = currentTime + process.burstTime;
                timeline.push({ id: process.id, start: currentTime, end: process.endTime });
                currentTime = process.endTime;
                process.turnaroundTime = process.endTime - process.arrivalTime;
                process.waitingTime = process.turnaroundTime - process.burstTime;
            });
            break;

        case 'rr':
            // Round-Robin (RR) implementation with improved handling
            const timeQuantum = 3;
            let queue = [];
            processes.sort((a, b) => a.arrivalTime - b.arrivalTime); // Sort by arrival time first
            
            // Set initial remaining time
            processes.forEach(process => {
                process.remainingTime = process.burstTime;
            });
        
            while (completedProcesses < totalProcesses) {
                // Check for newly arrived processes
                processes.forEach(process => {
                    if (process.arrivalTime <= currentTime && 
                        process.remainingTime > 0 && 
                        !queue.some(p => p.id === process.id)) {
                        queue.push(process);
                    }
                });
        
                // Handle idle time
                if (queue.length === 0) {
                    currentTime++;
                    continue;
                }
        
                // Process execution
                const currentProcess = queue.shift();
                const executionTime = Math.min(timeQuantum, currentProcess.remainingTime);
        
                // Record start time if it's the first execution
                if (currentProcess.startTime === 0) {
                    currentProcess.startTime = currentTime;
                }
        
                // Add to timeline
                timeline.push({ 
                    id: currentProcess.id, 
                    start: currentTime, 
                    end: currentTime + executionTime,
                    remainingTime: currentProcess.remainingTime - executionTime
                });
        
                currentTime += executionTime;
                currentProcess.remainingTime -= executionTime;
        
                // Process completion
                if (currentProcess.remainingTime === 0) {
                    completedProcesses++;
                    currentProcess.endTime = currentTime;
                    currentProcess.turnaroundTime = currentProcess.endTime - currentProcess.arrivalTime;
                    currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                } else {
                    // Check if any new processes arrived during execution
                    processes.forEach(process => {
                        if (process.arrivalTime <= currentTime && 
                            process.remainingTime > 0 && 
                            !queue.some(p => p.id === process.id) && 
                            process.id !== currentProcess.id) {
                            queue.push(process);
                        }
                    });
                    // Add current process back to queue
                    queue.push(currentProcess);
                }
            }
            break;

        case 'sjf':
            // Shortest Job First (SJF) implementation
            let availableProcesses = [];
            while (completedProcesses < totalProcesses) {
                processes.forEach(process => {
                    if (process.arrivalTime <= currentTime && process.remainingTime > 0 && !availableProcesses.includes(process)) {
                        availableProcesses.push(process);
                    }
                });

                if (availableProcesses.length === 0) {
                    currentTime++;
                    continue;
                }

                availableProcesses.sort((a, b) => a.burstTime - b.burstTime);
                const currentProcess = availableProcesses.shift();
                currentProcess.startTime = currentTime;
                currentProcess.endTime = currentTime + currentProcess.burstTime;
                timeline.push({ id: currentProcess.id, start: currentTime, end: currentProcess.endTime });
                currentTime = currentProcess.endTime;
                currentProcess.turnaroundTime = currentProcess.endTime - currentProcess.arrivalTime;
                currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                currentProcess.remainingTime = 0;
                completedProcesses++;
            }
            break;

        case 'srtf':
            // Shortest Remaining Time First (SRTF) implementation
            processes.forEach(process => {
                process.remainingTime = process.burstTime;
            });
        
            let lastProcessId = null;
            
            while (completedProcesses < totalProcesses) {
                let shortestProcess = null;
                let shortestTime = Infinity;
        
                // Find process with shortest remaining time
                processes.forEach(process => {
                    if (process.arrivalTime <= currentTime && 
                        process.remainingTime > 0 && 
                        process.remainingTime < shortestTime) {
                        shortestProcess = process;
                        shortestTime = process.remainingTime;
                    }
                });
        
                // If no process is available, increment time
                if (shortestProcess === null) {
                    currentTime++;
                    continue;
                }
        
                // Record start time if it's the first execution
                if (shortestProcess.startTime === 0) {
                    shortestProcess.startTime = currentTime;
                }
        
                // Check if we're switching to a different process
                if (lastProcessId !== shortestProcess.id && lastProcessId !== null) {
                    // Create a new timeline entry when switching processes
                    timeline.push({
                        id: shortestProcess.id,
                        start: currentTime,
                        end: currentTime + 1,
                        remainingTime: shortestProcess.remainingTime - 1
                    });
                } else {
                    // Extend the last timeline entry if it's the same process
                    const lastEntry = timeline[timeline.length - 1];
                    if (lastEntry && lastEntry.id === shortestProcess.id) {
                        lastEntry.end = currentTime + 1;
                        lastEntry.remainingTime = shortestProcess.remainingTime - 1;
                    } else {
                        timeline.push({
                            id: shortestProcess.id,
                            start: currentTime,
                            end: currentTime + 1,
                            remainingTime: shortestProcess.remainingTime - 1
                        });
                    }
                }
        
                // Update process state
                currentTime++;
                shortestProcess.remainingTime--;
                lastProcessId = shortestProcess.id;
        
                // Check if process is complete
                if (shortestProcess.remainingTime === 0) {
                    completedProcesses++;
                    shortestProcess.endTime = currentTime;
                    shortestProcess.turnaroundTime = shortestProcess.endTime - shortestProcess.arrivalTime;
                    shortestProcess.waitingTime = shortestProcess.turnaroundTime - shortestProcess.burstTime;
                    lastProcessId = null; // Reset lastProcessId when process completes
                }
            }
            break;

            case 'priority':
                // Priority Scheduling implementation
                let availablePriorityProcesses = [];
                const isHigherPriorityBetter = false; // Set to true if higher number means higher priority
            
                function comparePriority(a, b) {
                    if (isHigherPriorityBetter) {
                        return b.priority - a.priority; // Higher number = higher priority
                    } else {
                        return a.priority - b.priority; // Lower number = higher priority
                    }
                }
            
                while (completedProcesses < totalProcesses) {
                    // Add newly arrived processes to the available list
                    processes.forEach(process => {
                        if (process.arrivalTime <= currentTime && process.remainingTime > 0 && !availablePriorityProcesses.includes(process)) {
                            availablePriorityProcesses.push(process);
                        }
                    });
            
                    if (availablePriorityProcesses.length === 0) {
                        currentTime++;
                        continue;
                    }
            
                    // Sort available processes by priority
                    availablePriorityProcesses.sort(comparePriority);
            
                    // Select the highest priority process
                    const currentPriorityProcess = availablePriorityProcesses.shift();
            
                    // Execute the process
                    currentPriorityProcess.startTime = currentTime;
                    currentPriorityProcess.endTime = currentTime + currentPriorityProcess.burstTime;
                    timeline.push({ id: currentPriorityProcess.id, start: currentTime, end: currentPriorityProcess.endTime });
                    currentTime = currentPriorityProcess.endTime;
            
                    // Update process metrics
                    currentPriorityProcess.turnaroundTime = currentPriorityProcess.endTime - currentPriorityProcess.arrivalTime;
                    currentPriorityProcess.waitingTime = currentPriorityProcess.turnaroundTime - currentPriorityProcess.burstTime;
                    currentPriorityProcess.remainingTime = 0;
                    completedProcesses++;
            
                    console.log(`Executed Process ${currentPriorityProcess.id} with priority ${currentPriorityProcess.priority}`);
                }
                break;

        case 'hrrn':
            // Highest Response Ratio Next (HRRN) implementation
            while (completedProcesses < totalProcesses) {
                let highestRRProcess = null;
                let highestRR = -1;

                processes.forEach(process => {
                    if (process.arrivalTime <= currentTime && process.remainingTime > 0) {
                        const waitingTime = currentTime - process.arrivalTime;
                        const responseRatio = (waitingTime + process.burstTime) / process.burstTime;
                        if (responseRatio > highestRR) {
                            highestRRProcess = process;
                            highestRR = responseRatio;
                        }
                    }
                });

                if (highestRRProcess === null) {
                    currentTime++;
                    continue;
                }

                highestRRProcess.startTime = currentTime;
                highestRRProcess.endTime = currentTime + highestRRProcess.burstTime;
                timeline.push({ id: highestRRProcess.id, start: currentTime, end: highestRRProcess.endTime });
                currentTime = highestRRProcess.endTime;
                highestRRProcess.turnaroundTime = highestRRProcess.endTime - highestRRProcess.arrivalTime;
                highestRRProcess.waitingTime = highestRRProcess.turnaroundTime - highestRRProcess.burstTime;
                highestRRProcess.remainingTime = 0;
                completedProcesses++;
            }
            break;

        case 'mlq':
            // Improved Multilevel Queue implementation
            const queues = [[], [], []]; // Three priority queues
            const timeSlices = [4, 8, 16,32,64]; // Shorter time slices for higher priority queues
            const queueMap = new Map(); // Track which queue each process is in
            const agingThreshold = 10; // Time units before promoting a process
            const processAging = new Map(); // Track waiting time for aging
        
            while (completedProcesses < totalProcesses) {
                // Handle aging of processes
                queues.forEach((queue, queueIndex) => {
                    if (queueIndex < queues.length - 1) { // Don't age processes in lowest queue
                        queue.forEach(process => {
                            const waitingTime = processAging.get(process.id) || 0;
                            if (waitingTime >= agingThreshold) {
                                // Promote process to higher priority queue
                                const newQueueIndex = Math.max(0, queueIndex - 1);
                                queues[newQueueIndex].push(process);
                                queue.splice(queue.indexOf(process), 1);
                                queueMap.set(process.id, newQueueIndex);
                                processAging.set(process.id, 0);
                            } else {
                                processAging.set(process.id, waitingTime + 1);
                            }
                        });
                    }
                });
        
                // Add newly arrived processes to the highest priority queue
                processes.forEach(process => {
                    if (process.arrivalTime <= currentTime && 
                        process.remainingTime > 0 && 
                        !queueMap.has(process.id)) {
                        queues[0].push(process);
                        queueMap.set(process.id, 0);
                        processAging.set(process.id, 0);
                    }
                });
        
                let selectedProcess = null;
                let selectedQueue = -1;
        
                // Find the highest priority non-empty queue
                for (let i = 0; i < queues.length; i++) {
                    if (queues[i].length > 0) {
                        selectedProcess = queues[i].shift();
                        selectedQueue = i;
                        queueMap.delete(selectedProcess.id);
                        break;
                    }
                }
        
                if (selectedProcess === null) {
                    currentTime++;
                    continue;
                }
        
                // Execute process
                const executionTime = Math.min(timeSlices[selectedQueue], selectedProcess.remainingTime);
                
                // Update process start time if first execution
                if (selectedProcess.startTime === 0) {
                    selectedProcess.startTime = currentTime;
                }
        
                timeline.push({ 
                    id: selectedProcess.id, 
                    start: currentTime, 
                    end: currentTime + executionTime,
                    queue: selectedQueue // Track which queue executed the process
                });
        
                currentTime += executionTime;
                selectedProcess.remainingTime -= executionTime;
        
                // Process completion
                if (selectedProcess.remainingTime === 0) {
                    completedProcesses++;
                    selectedProcess.endTime = currentTime;
                    selectedProcess.turnaroundTime = selectedProcess.endTime - selectedProcess.arrivalTime;
                    selectedProcess.waitingTime = selectedProcess.turnaroundTime - selectedProcess.burstTime;
                    processAging.delete(selectedProcess.id);
                } else {
                    // Move process to lower priority queue if it didn't complete
                    const nextQueue = Math.min(selectedQueue + 1, queues.length - 1);
                    queues[nextQueue].push(selectedProcess);
                    queueMap.set(selectedProcess.id, nextQueue);
                    // Reset aging counter for moved process
                    processAging.set(selectedProcess.id, 0);
                }
        
                // Update aging for all waiting processes
                queues.forEach((queue, queueIndex) => {
                    queue.forEach(process => {
                        const currentAging = processAging.get(process.id) || 0;
                        processAging.set(process.id, currentAging + 1);
                    });
                });
            }
            break;
    }

    return { timeline, processes };
}

// Display result for a specific algorithm
function displayResult(algorithm, result) {
    const resultDiv = document.getElementById(`${algorithm}Result`);
    const ganttChart = resultDiv.querySelector('.gantt-chart');
    const metrics = resultDiv.querySelector('.metrics');

    // Clear previous results
    ganttChart.innerHTML = '';
    metrics.innerHTML = '';

    // Display Gantt chart
    result.timeline.forEach(item => {
        const block = document.createElement('div');
        block.className = 'gantt-block';
        block.style.width = `${(item.end - item.start) * 20}px`;
        block.style.backgroundColor = colors[(item.id - 1) % colors.length];
        block.setAttribute('data-process', `P${item.id}`);
        block.textContent = item.end - item.start;
        ganttChart.appendChild(block);
    });

    // Calculate and display metrics
    const avgWaitingTime = result.processes.reduce((sum, process) => sum + process.waitingTime, 0) / result.processes.length;
    const avgTurnaroundTime = result.processes.reduce((sum, process) => sum + process.turnaroundTime, 0) / result.processes.length;

    metrics.innerHTML = `
        <p>Average Waiting Time: ${avgWaitingTime.toFixed(2)}</p>
        <p>Average Turnaround Time: ${avgTurnaroundTime.toFixed(2)}</p>
    `;
}

// Event listeners for generating, resetting, and running simulations
document.getElementById('generateProcesses').addEventListener('click', generateProcesses);
document.getElementById('runSimulation').addEventListener('click', runAllSimulations);
document.getElementById('reset').addEventListener('click', resetProcesses); // Add reset button listener
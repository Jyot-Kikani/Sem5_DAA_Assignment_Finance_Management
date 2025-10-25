document.addEventListener('DOMContentLoaded', () => {
    // Canvas & Rendering Setup
    const canvas = document.getElementById('intersection-canvas');
    const ctx = canvas.getContext('2d');
    let lastRenderTime = 0;
    const CAR_SPEED = 2; // pixels per frame

    // DOM Elements
    const algorithmSelect = document.getElementById('algorithm-select');
    const startButton = document.getElementById('start-button');
    const stopButton = document.getElementById('stop-button');
    const resetButton = document.getElementById('reset-button');
    const dischargeRateInput = document.getElementById('discharge-rate');
    const minGreenTimeInput = document.getElementById('min-green-time');
    const fixedCycleTimeInput = document.getElementById('fixed-cycle-time');
    const fixedTimeGroup = document.getElementById('fixed-time-group');
    const arrivalRatesInputs = { north: document.getElementById('north-rate'), south: document.getElementById('south-rate'), east: document.getElementById('east-rate'), west: document.getElementById('west-rate') };
    const queueLengthDisplays = { north: document.getElementById('north-queue'), south: document.getElementById('south-queue'), east: document.getElementById('east-queue'), west: document.getElementById('west-queue') };
    const metricsDisplays = { avgWaitTime: document.getElementById('avg-wait-time'), totalThroughput: document.getElementById('total-throughput'), maxQueueLength: document.getElementById('max-queue-length'), signalSwitches: document.getElementById('signal-switches'), simTime: document.getElementById('sim-time') };

    // Simulation State
    let simulationRunning = false;
    let logicInterval;
    let tick = 0;
    let nextCarId = 0;
    let cars = []; // Unified list of all car objects
    let arrivalAccumulators = { north: 0, south: 0, east: 0, west: 0 };
    let queues = { north: [], south: [], east: [], west: [] };
    let trafficLights = { north: 'red', south: 'red', east: 'green', west: 'green' };
    let greenTime = 0;
    let currentGreenDirection = 'horizontal';

    // Metrics State
    let totalWaitTime = 0;
    let vehiclesPassed = 0;
    let maxQueue = 0;
    let signalSwitches = 0;
    
    // --- GEOMETRY & DRAWING ---
    const GEOMETRY = {
        width: canvas.width,
        height: canvas.height,
        roadWidth: canvas.width / 4,
        get center() { return { x: this.width / 2, y: this.height / 2 } },
        get roadStartX() { return this.center.x - this.roadWidth / 2 },
        get roadStartY() { return this.center.y - this.roadWidth / 2 },
        carSize: { w: 12, h: 24 },
        carSpacing: 35,
    };
    
    // Defines paths for cars
    const PATHS = {
        north: {
            start: { x: GEOMETRY.center.x + GEOMETRY.roadWidth / 4, y: 0 },
            queue: { x: GEOMETRY.center.x + GEOMETRY.roadWidth / 4, y: GEOMETRY.roadStartY - GEOMETRY.carSize.h },
            end: { x: GEOMETRY.center.x + GEOMETRY.roadWidth / 4, y: GEOMETRY.height }
        },
        south: {
            start: { x: GEOMETRY.center.x - GEOMETRY.roadWidth / 4, y: GEOMETRY.height },
            queue: { x: GEOMETRY.center.x - GEOMETRY.roadWidth / 4, y: GEOMETRY.roadStartY + GEOMETRY.roadWidth },
            end: { x: GEOMETRY.center.x - GEOMETRY.roadWidth / 4, y: 0 }
        },
        east: {
            start: { x: GEOMETRY.width, y: GEOMETRY.center.y + GEOMETRY.roadWidth / 4 },
            queue: { x: GEOMETRY.roadStartX + GEOMETRY.roadWidth, y: GEOMETRY.center.y + GEOMETRY.roadWidth / 4 },
            end: { x: 0, y: GEOMETRY.center.y + GEOMETRY.roadWidth / 4 }
        },
        west: {
            start: { x: 0, y: GEOMETRY.center.y - GEOMETRY.roadWidth / 4 },
            queue: { x: GEOMETRY.roadStartX - GEOMETRY.carSize.h, y: GEOMETRY.center.y - GEOMETRY.roadWidth / 4 },
            end: { x: GEOMETRY.width, y: GEOMETRY.center.y - GEOMETRY.roadWidth / 4 }
        }
    };
    
    function drawIntersection() {
        const { width, height, roadWidth, roadStartX, roadStartY, center } = GEOMETRY;
        const { greenLight, redLight, roadColor, lineColor } = { greenLight: '#66bb6a', redLight: '#ef5350', roadColor: '#424242', lineColor: '#757575' };
        
        ctx.clearRect(0, 0, width, height);

        // Roads
        ctx.fillStyle = roadColor;
        ctx.fillRect(roadStartX, 0, roadWidth, height); // Vertical
        ctx.fillRect(0, roadStartY, width, roadWidth);   // Horizontal

        // Center lines
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        // Vertical
        ctx.beginPath();
        ctx.moveTo(center.x, 0);
        ctx.lineTo(center.x, roadStartY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(center.x, roadStartY + roadWidth);
        ctx.lineTo(center.x, height);
        ctx.stroke();
        // Horizontal
        ctx.beginPath();
        ctx.moveTo(0, center.y);
        ctx.lineTo(roadStartX, center.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(roadStartX + roadWidth, center.y);
        ctx.lineTo(width, center.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Traffic Lights
        const lightSize = 12;
        ctx.fillStyle = trafficLights.north === 'green' ? greenLight : redLight;
        ctx.fillRect(roadStartX - lightSize - 5, roadStartY - lightSize - 5, lightSize, lightSize);
        ctx.fillStyle = trafficLights.south === 'green' ? greenLight : redLight;
        ctx.fillRect(roadStartX + roadWidth + 5, roadStartY + roadWidth + 5, lightSize, lightSize);
        ctx.fillStyle = trafficLights.west === 'green' ? greenLight : redLight;
        ctx.fillRect(roadStartX - lightSize - 5, roadStartY + roadWidth + 5, lightSize, lightSize);
        ctx.fillStyle = trafficLights.east === 'green' ? greenLight : redLight;
        ctx.fillRect(roadStartX + roadWidth + 5, roadStartY - lightSize - 5, lightSize, lightSize);
    }

    function drawCars() {
        cars.forEach(car => {
            ctx.save();
            ctx.translate(car.x, car.y);
            // Rotate car based on direction
            if (car.direction === 'north' || car.direction === 'south') {
                 ctx.rotate(0);
            } else {
                 ctx.rotate(Math.PI / 2);
            }
            ctx.fillStyle = car.color;
            ctx.fillRect(-GEOMETRY.carSize.w / 2, -GEOMETRY.carSize.h / 2, GEOMETRY.carSize.w, GEOMETRY.carSize.h);
            ctx.strokeStyle = 'black';
            ctx.strokeRect(-GEOMETRY.carSize.w / 2, -GEOMETRY.carSize.h / 2, GEOMETRY.carSize.w, GEOMETRY.carSize.h);
            ctx.restore();
        });
    }

    // --- ANIMATION ENGINE ---
    function animationLoop(timestamp) {
        if (!simulationRunning) return;
        const deltaTime = timestamp - lastRenderTime;
        lastRenderTime = timestamp;

        // Update car positions
        cars.forEach(car => {
            if (car.status === 'moving') {
                switch (car.direction) {
                    case 'north': car.y += CAR_SPEED; break;
                    case 'south': car.y -= CAR_SPEED; break;
                    case 'east': car.x -= CAR_SPEED; break;
                    case 'west': car.x += CAR_SPEED; break;
                }
            } else if (car.status === 'waiting') {
                // Update waiting car positions based on queue index
                const queue = queues[car.direction];
                const index = queue.indexOf(car.id);
                const path = PATHS[car.direction];
                
                if (car.direction === 'north') car.y = path.queue.y - index * GEOMETRY.carSpacing;
                else if (car.direction === 'south') car.y = path.queue.y + index * GEOMETRY.carSpacing;
                else if (car.direction === 'east') car.x = path.queue.x + index * GEOMETRY.carSpacing;
                else if (car.direction === 'west') car.x = path.queue.x - index * GEOMETRY.carSpacing;
            }
        });

        // Remove cars that have passed the intersection
        cars = cars.filter(car => {
            const { width, height } = GEOMETRY;
            return car.x > -20 && car.x < width + 20 && car.y > -20 && car.y < height + 20;
        });

        drawIntersection();
        drawCars();

        requestAnimationFrame(animationLoop);
    }
    
    // --- SIMULATION LOGIC ---
    function updateSimulation() {
        if (!simulationRunning) return;
        tick++;
        const DISCHARGE_RATE = parseFloat(dischargeRateInput.value);
        const MIN_GREEN_TIME = parseInt(minGreenTimeInput.value, 10);

        // 1. Add new cars
        for (const dir in arrivalRatesInputs) {
            arrivalAccumulators[dir] += parseFloat(arrivalRatesInputs[dir].value);
            while (arrivalAccumulators[dir] >= 1) {
                const newCar = {
                    id: nextCarId++,
                    direction: dir,
                    status: 'waiting',
                    arrivalTick: tick,
                    color: `hsl(${Math.random() * 360}, 80%, 60%)`,
                    x: PATHS[dir].start.x,
                    y: PATHS[dir].start.y,
                };
                cars.push(newCar);
                queues[dir].push(newCar.id);
                arrivalAccumulators[dir]--;
            }
        }
        
        // 2. Discharge cars from green lights
        const greenDirections = currentGreenDirection === 'vertical' ? ['north', 'south'] : ['east', 'west'];
        for (const dir of greenDirections) {
            for (let i = 0; i < DISCHARGE_RATE; i++) {
                if (queues[dir].length > 0) {
                    const carId = queues[dir].shift();
                    const car = cars.find(c => c.id === carId);
                    if (car) {
                        car.status = 'moving';
                        totalWaitTime += tick - car.arrivalTick;
                        vehiclesPassed++;
                    }
                }
            }
        }

        greenTime++;

        // 3. Controller logic (decide to switch lights)
        if (greenTime >= MIN_GREEN_TIME) {
            let switchSignal = false;
            const verticalQueueLength = queues.north.length + queues.south.length;
            const horizontalQueueLength = queues.east.length + queues.west.length;

            const algorithm = algorithmSelect.value;
            if (algorithm === 'fixed') {
                if (greenTime >= parseInt(fixedCycleTimeInput.value, 10)) switchSignal = true;
            } else if (algorithm === 'greedy') {
                if (currentGreenDirection === 'horizontal' && verticalQueueLength > horizontalQueueLength) switchSignal = true;
                else if (currentGreenDirection === 'vertical' && horizontalQueueLength > verticalQueueLength) switchSignal = true;
            } else if (algorithm === 'round-robin') {
                if (currentGreenDirection === 'horizontal' && verticalQueueLength > 0) switchSignal = true;
                else if (currentGreenDirection === 'vertical' && horizontalQueueLength > 0) switchSignal = true;
            }

            if (switchSignal) {
                switchLights();
                signalSwitches++;
                greenTime = 0;
            }
        }

        updateUI();
    }
    
    function switchLights() {
        if (currentGreenDirection === 'horizontal') {
            trafficLights.east = 'red'; trafficLights.west = 'red';
            trafficLights.north = 'green'; trafficLights.south = 'green';
            currentGreenDirection = 'vertical';
        } else {
            trafficLights.north = 'red'; trafficLights.south = 'red';
            trafficLights.east = 'green'; trafficLights.west = 'green';
            currentGreenDirection = 'horizontal';
        }
    }

    // --- UI & Controls ---
    function updateUI() {
        for (const dir in queues) {
            const qLength = queues[dir].length;
            queueLengthDisplays[dir].textContent = qLength;
            if (qLength > maxQueue) maxQueue = qLength;
        }
        metricsDisplays.avgWaitTime.textContent = (vehiclesPassed > 0 ? (totalWaitTime / vehiclesPassed) : 0).toFixed(2) + 's';
        metricsDisplays.totalThroughput.textContent = vehiclesPassed;
        metricsDisplays.maxQueueLength.textContent = maxQueue;
        metricsDisplays.signalSwitches.textContent = signalSwitches;
        metricsDisplays.simTime.textContent = tick + 's';
    }
    
    function startSimulation() {
        if (simulationRunning) return;
        simulationRunning = true;
        startButton.disabled = true;
        stopButton.disabled = false;
        logicInterval = setInterval(updateSimulation, 1000); // Logic tick
        requestAnimationFrame(animationLoop); // Start rendering
    }
    
    function stopSimulation() {
        simulationRunning = false;
        startButton.disabled = false;
        stopButton.disabled = true;
        clearInterval(logicInterval);
    }

    function resetSimulation() {
        stopSimulation();
        tick = 0;
        nextCarId = 0;
        cars = [];
        arrivalAccumulators = { north: 0, south: 0, east: 0, west: 0 };
        queues = { north: [], south: [], east: [], west: [] };
        trafficLights = { north: 'red', south: 'red', east: 'green', west: 'green' };
        greenTime = 0;
        currentGreenDirection = 'horizontal';
        totalWaitTime = 0; vehiclesPassed = 0; maxQueue = 0; signalSwitches = 0;
        updateUI();
        drawIntersection();
    }
    
    // Event Listeners
    startButton.addEventListener('click', startSimulation);
    stopButton.addEventListener('click', stopSimulation);
    resetButton.addEventListener('click', resetSimulation);
    algorithmSelect.addEventListener('change', () => {
        fixedTimeGroup.style.display = (algorithmSelect.value === 'fixed') ? 'block' : 'none';
    });
    
    // Initial Setup
    fixedTimeGroup.style.display = 'block';
    resetSimulation();
});
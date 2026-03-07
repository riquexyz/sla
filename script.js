// Elementos do DOM
const carsContainer = document.getElementById('cars-container');
const simulationArea = document.getElementById('simulation-area');
const btnCamera = document.getElementById('btn-camera');
const btnDrone = document.getElementById('btn-drone');
const cameraLabel = document.getElementById('camera-label');
const droneIcon = document.getElementById('drone-icon');
const alertBox = document.getElementById('alert-box');
const ambulanceBox = document.getElementById('ambulance-box');

// Estado
let isDroneMode = false;
let isAccidentOccurred = false;

// Configuração
const CAR_SPEED = 3;

// --- VISÃO DA CÂMERA ---
function setCameraMode() {

    isDroneMode = false;

    simulationArea.classList.remove('drone-view');
    droneIcon.classList.add('hidden');

    cameraLabel.innerText = "CÂMERA 01";

    btnCamera.classList.add('active');
    btnDrone.classList.remove('active');
}

// --- VISÃO DO DRONE ---
function setDroneMode() {

    isDroneMode = true;

    simulationArea.classList.add('drone-view');
    droneIcon.classList.remove('hidden');

    cameraLabel.innerText = "DRONE AÉREO";

    btnDrone.classList.add('active');
    btnCamera.classList.remove('active');
}

// Botões
btnCamera.addEventListener('click', setCameraMode);
btnDrone.addEventListener('click', setDroneMode);

// --- CRIAR CARRO ---
function createCar(direction) {

    if (isAccidentOccurred) return;

    const car = document.createElement("div");
    car.classList.add("car");
    car.innerText = "CARRO";

    const screenWidth = simulationArea.offsetWidth;

    let startLeft = direction === "left" ? -100 : screenWidth;

    car.style.left = startLeft + "px";
    car.style.top = "calc(50% - 20px)";

    carsContainer.appendChild(car);

    let carPosition = startLeft;

    const moveInterval = setInterval(() => {

        if (isAccidentOccurred) {
            clearInterval(moveInterval);
            return;
        }

        if (direction === "left") {
            carPosition += CAR_SPEED;
        } else {
            carPosition -= CAR_SPEED;
        }

        car.style.left = carPosition + "px";

        const center = screenWidth / 2;

        if (Math.abs(carPosition - center) < 5) {
            triggerAccident();
        }

    }, 30);
}

// --- ACIDENTE ---
function triggerAccident() {

    if (isAccidentOccurred) return;

    isAccidentOccurred = true;

    alertBox.classList.remove("hidden");

    // parar carros
    const cars = document.querySelectorAll(".car");
    cars.forEach(car => {
        car.style.opacity = "0.5";
    });

    setTimeout(() => {

        ambulanceBox.classList.remove("hidden");

        const ambulance = document.createElement("div");
        ambulance.classList.add("car");
        ambulance.innerText = "🚑";

        ambulance.style.backgroundColor = "white";
        ambulance.style.left = "-100px";
        ambulance.style.top = "calc(50% - 20px)";

        carsContainer.appendChild(ambulance);

        let position = -100;
        const target = simulationArea.offsetWidth / 2 - 60;

        const move = setInterval(() => {

            if (position >= target) {

                clearInterval(move);

                // espera 2 segundos no local
                setTimeout(() => {

                    const leave = setInterval(() => {

                        position -= 5;
                        ambulance.style.left = position + "px";

                        if (position < -120) {

                            clearInterval(leave);

                            // reinicia depois que ambulância sai
                            setTimeout(() => {
                                resetSimulation();
                            }, 1000);

                        }

                    }, 30);

                }, 2000);

                return;
            }

            position += 4;
            ambulance.style.left = position + "px";

        }, 30);

    }, 2000);
}

// --- INICIAR SIMULAÇÃO ---
function startSimulation() {

    createCar("left");

    setTimeout(() => {
        createCar("right");
    }, 1500);
}

// começa em 3 segundos
setTimeout(startSimulation, 3000);

function resetSimulation() {

    carsContainer.innerHTML = "";

    alertBox.classList.add("hidden");
    ambulanceBox.classList.add("hidden");

    isAccidentOccurred = false;

    startSimulation();
}
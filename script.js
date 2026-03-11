// Configuração do canvas
const canvas = document.getElementById('trafficCanvas');
const ctx = canvas.getContext('2d');

// Variáveis de controle
let simulationRunning = true;
let collisionOccurred = false;
let ambulanceActive = false;
let victimStatus = '';

// Variáveis para controle de áudio
let crashAudio = null;
let sireneAudio = null;

// Sistema de Fumaça
let smokeParticles = [];

class SmokeParticle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 30;
        this.y = y + (Math.random() - 0.5) * 20;
        this.size = Math.random() * 8 + 3;
        this.speedY = Math.random() * 0.8 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.opacity = 0.7 + Math.random() * 0.3;
        this.life = 1.0;
        this.decay = 0.002 + Math.random() * 0.003;
    }
    
    update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        this.life -= this.decay;
        this.opacity = this.life * 0.7;
        this.size += 0.1;
        this.speedX *= 0.99;
    }
    
    draw() {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size
        );
        gradient.addColorStop(0, 'rgba(180, 180, 180, 0.8)');
        gradient.addColorStop(0.5, 'rgba(120, 120, 120, 0.5)');
        gradient.addColorStop(1, 'rgba(80, 80, 80, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Elementos da interface
const reportLog = document.getElementById('reportLog');
const victimStatusText = document.getElementById('victimStatusText');
const currentTimeDisplay = document.getElementById('currentTime');
const restartBtn = document.getElementById('restartBtn');

// ===== CARROS RANDOMIZADOS =====
const carColors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];
const carTypes = ['Sedan', 'Hatch', 'SUV', 'Esportivo', 'Picape'];

function randomCar() {
    return {
        color: carColors[Math.floor(Math.random() * carColors.length)],
        type: carTypes[Math.floor(Math.random() * carTypes.length)]
    };
}

let car1 = { 
    x: 100, y: 280, speed: 1.5 + Math.random(), active: true, 
    color: carColors[Math.floor(Math.random() * carColors.length)],
    type: carTypes[Math.floor(Math.random() * carTypes.length)]
};

let car2 = { 
    x: 380, y: 100, speed: 1.5 + Math.random(), active: true, 
    color: carColors[Math.floor(Math.random() * carColors.length)],
    type: carTypes[Math.floor(Math.random() * carTypes.length)]
};

// Ambulância
let ambulance = { 
    x: 0, 
    y: 0, 
    active: false, 
    state: 'coming',
    orientation: 'horizontal',
    stage: 'exiting'
};

// Histórico de eventos
let eventLog = [];

// ===== FUNÇÕES DE ÁUDIO =====
function initAudios() {
    try {
        crashAudio = document.getElementById('crashSound');
        sireneAudio = document.getElementById('sireneSound');
        
        if (crashAudio) {
            crashAudio.volume = 0.7;
            crashAudio.load(); // Forçar carregamento
            console.log('🎵 Áudio de crash carregado:', crashAudio);
        }
        
        if (sireneAudio) {
            sireneAudio.volume = 0.1;
            sireneAudio.load(); // Forçar carregamento
            console.log('🎵 Áudio de sirene carregado:', sireneAudio);
        }
        
        console.log('✅ Sistema de áudio inicializado');
    } catch (error) {
        console.error('❌ Erro ao inicializar áudios:', error);
    }
}

function playCrashSound() {
    if (crashAudio) {
        // Parar se estiver tocando e reiniciar
        crashAudio.pause();
        crashAudio.currentTime = 0;
        
        // Tocar
        let playPromise = crashAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('✅ Som de crash tocando');
            }).catch(error => {
                console.error('❌ Erro ao tocar crash:', error);
                // Tentar tocar novamente após interação do usuário
                document.addEventListener('click', function playOnClick() {
                    crashAudio.play();
                    document.removeEventListener('click', playOnClick);
                }, { once: true });
            });
        }
    } else {
        console.error('❌ crashAudio não está inicializado');
    }
}

function playSirene() {
    if (sireneAudio) {
        sireneAudio.loop = true;
        let playPromise = sireneAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('❌ Erro ao tocar sirene:', error);
            });
        }
    }
}

function stopSirene() {
    if (sireneAudio) {
        sireneAudio.pause();
        sireneAudio.currentTime = 0;
    }
}

function stopAllSounds() {
    stopSirene();
    if (crashAudio) {
        crashAudio.pause();
        crashAudio.currentTime = 0;
    }
}

// Função para testar áudio manualmente
window.testarCrash = function() {
    console.log('🔊 Testando áudio de crash...');
    playCrashSound();
};

window.testarSirene = function() {
    console.log('🔊 Testando áudio de sirene...');
    playSirene();
    setTimeout(stopSirene, 3000);
};

function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    currentTimeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

function addEvent(message, type = 'system') {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `<span class="log-time">[${time}]</span><span class="log-message">${message}</span>`;
    
    reportLog.appendChild(logEntry);
    reportLog.scrollTop = reportLog.scrollHeight;
}

function generateVictimStatus() {
    const statuses = [
        'Ferimentos leves - Consciente',
        'Suspeita de fratura - Imobilizado',
        'Ambulância a caminho - Prioridade máxima',
        'Vítima consciente - Escoriações',
        'Estado grave - Atendimento urgente'
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

// Criar fumaça na colisão
function createCollisionSmoke() {
    for (let i = 0; i < 20; i++) {
        smokeParticles.push(new SmokeParticle(380, 280));
    }
}

// Verificar colisão (SEM som antecipado)
function checkCollision() {
    if (!collisionOccurred && car1.active && car2.active) {
        if (Math.abs(car1.x - 380) < 25 && Math.abs(car2.y - 280) < 25) {
            collisionOccurred = true;
            car1.speed = 0;
            car2.speed = 0;
            
            // Tocar som de colisão APENAS no momento da colisão
            playCrashSound();
            
            // Criar fumaça na colisão
            createCollisionSmoke();
            
            victimStatus = generateVictimStatus();
            victimStatusText.textContent = victimStatus;
            
            addEvent('🚨 COLISÃO DETECTADA no cruzamento!', 'collision');
            addEvent(`🚗 ${car1.type} ${car1.color} x ${car2.type} ${car2.color}`, 'collision');
            addEvent(`👤 Status da vítima: ${victimStatus}`, 'collision');
            
            setTimeout(() => {
                callAmbulance();
            }, 2000);
        }
    }
}

function callAmbulance() {
    if (!ambulanceActive) {
        ambulanceActive = true;
        ambulance.active = true;
        ambulance.state = 'coming';
        ambulance.stage = 'exiting';
        ambulance.x = 710;
        ambulance.y = 515;
        ambulance.orientation = 'horizontal';
        
        playSirene();
        
        addEvent('🚑 AMBULÂNCIA acionada - Saindo do estacionamento', 'ambulance');
    }
}

function moveAmbulance() {
    if (!ambulance.active) return;
    
    const centerX = 380;
    const centerY = 280;
    const speed = 2;
    const safeDistance = 40;
    
    const roadEntryX = 360;
    const accidentY = centerY + safeDistance;
    const hospitalReturnY = 500;
    
    switch(ambulance.state) {
        case 'coming':
            if (ambulance.stage === 'exiting') {
                if (ambulance.x > roadEntryX) {
                    ambulance.x -= speed;
                    ambulance.orientation = 'horizontal';
                } else {
                    ambulance.stage = 'onRoad';
                }
            }
            else if (ambulance.stage === 'onRoad') {
                if (ambulance.y > accidentY) {
                    ambulance.y -= speed;
                    ambulance.orientation = 'vertical';
                } else {
                    ambulance.stage = 'approaching';
                }
            }
            else if (ambulance.stage === 'approaching') {
                if (ambulance.x > centerX) {
                    ambulance.x -= speed;
                    ambulance.orientation = 'horizontal';
                } else {
                    ambulance.state = 'stopped';
                    ambulance.stage = 'stopped';
                    addEvent('🚑 AMBULÂNCIA chegou ao local do acidente', 'ambulance');
                    
                    setTimeout(() => {
                        ambulance.state = 'leaving';
                        ambulance.stage = 'returning';
                        addEvent('✅ Atendimento realizado, ambulância voltando', 'ambulance');
                    }, 3000);
                }
            }
            break;
            
        case 'leaving':
            if (ambulance.stage === 'returning') {
                if (ambulance.x < roadEntryX) {
                    ambulance.x += speed;
                    ambulance.orientation = 'horizontal';
                } else {
                    ambulance.stage = 'goingDown';
                }
            }
            else if (ambulance.stage === 'goingDown') {
                if (ambulance.y < hospitalReturnY) {
                    ambulance.y += speed;
                    ambulance.orientation = 'vertical';
                } else {
                    ambulance.stage = 'parking';
                }
            }
            else if (ambulance.stage === 'parking') {
                if (ambulance.x < 710) {
                    ambulance.x += speed;
                    ambulance.orientation = 'horizontal';
                } else {
                    ambulance.active = false;
                    ambulanceActive = false;
                    stopSirene();
                    addEvent('🏥 Ambulância estacionada no hospital', 'system');
                }
            }
            break;
    }
}

function moveCars() {
    if (!collisionOccurred) {
        if (car1.active) {
            car1.x += car1.speed;
            if (car1.x > 800) {
                car1.x = 100;
                let newCar = randomCar();
                car1.color = newCar.color;
                car1.type = newCar.type;
                car1.speed = 1.5 + Math.random();
            }
        }
        if (car2.active) {
            car2.y += car2.speed;
            if (car2.y > 600) {
                car2.y = 100;
                let newCar = randomCar();
                car2.color = newCar.color;
                car2.type = newCar.type;
                car2.speed = 1.5 + Math.random();
            }
        }
        checkCollision();
    }
}

function drawEstablishments() {
    // Posto de gasolina
    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(20, 120, 100, 60);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(25, 115, 90, 10);
    ctx.fillStyle = '#333333';
    ctx.fillRect(40, 140, 15, 30);
    ctx.fillRect(70, 140, 15, 30);
    ctx.fillStyle = '#666666';
    ctx.fillRect(20, 110, 100, 10);
    ctx.font = 'bold 10px "Courier New"';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText('GAS', 45, 118);
    
    // Restaurante
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(650, 120, 120, 70);
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.moveTo(650, 120);
    ctx.lineTo(770, 120);
    ctx.lineTo(760, 100);
    ctx.lineTo(640, 100);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(670, 140, 25, 25);
    ctx.fillRect(720, 140, 25, 25);
    ctx.font = 'bold 12px "Courier New"';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('REST', 685, 135);
    ctx.fillText('🍔', 715, 134);
    
    // Loja de conveniência
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(20, 400, 100, 70);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(20, 400, 100, 15);
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(35, 430, 30, 25);
    ctx.fillRect(75, 430, 30, 25);
    ctx.font = 'bold 10px "Courier New"';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('24H', 45, 410);
    
    // HOSPITAL
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(650, 400, 120, 80);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(690, 425, 40, 10);
    ctx.fillRect(705, 410, 10, 40);
    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(650, 390, 120, 15);
    ctx.font = 'bold 12px "Courier New"';
    ctx.fillStyle = '#FF0000';
    ctx.fillText('HOSP', 680, 403);
    
    // Estacionamento
    ctx.fillStyle = '#444444';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(640, 500, 140, 40);
    ctx.globalAlpha = 1.0;
    
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(655 + i * 40, 510);
        ctx.lineTo(655 + i * 40, 530);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
    
    ctx.font = '10px "Courier New"';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('A', 715, 525);
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(660, 515, 25, 12);
    ctx.fillStyle = '#666666';
    ctx.fillRect(700, 515, 25, 12);
}

function drawTrees() {
    // Árvores canto superior esquerdo
    for (let i = 0; i < 3; i++) {
        const x = 150 + i * 30;
        const y = 190;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 2, y, 5, 15);
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(x, y - 8, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.arc(x - 5, y - 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 5, y - 12, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Árvores canto superior direito
    for (let i = 0; i < 3; i++) {
        const x = 550 + i * 30;
        const y = 190;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 2, y, 5, 15);
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(x, y - 8, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.arc(x - 5, y - 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 5, y - 12, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Árvores perto do hospital
    for (let i = 0; i < 3; i++) {
        const x = 570 + i * 25;
        const y = 540;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 2, y, 5, 12);
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(x, y - 6, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawDroneView() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 800, 600);
    
    drawEstablishments();
    drawTrees();
    
    // Grade
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 0.3;
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 600; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(800, i);
        ctx.stroke();
    }
    for (let i = 0; i < 800; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 600);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
    
    // Estrada horizontal
    ctx.fillStyle = '#222222';
    ctx.globalAlpha = 0.95;
    ctx.fillRect(0, 250, 800, 100);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 250, 800, 100);
    
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 30]);
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(800, 300);
    ctx.stroke();
    
    // Estrada vertical
    ctx.fillStyle = '#222222';
    ctx.fillRect(350, 0, 100, 600);
    ctx.strokeStyle = '#444444';
    ctx.strokeRect(350, 0, 100, 600);
    
    ctx.strokeStyle = '#FFFF00';
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 600);
    ctx.stroke();
    
    // Cruzamento
    ctx.setLineDash([]);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(350, 250, 100, 100);
    
    // Faixas de pedestres
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(360, 260 + i * 20, 80, 5);
    }
    ctx.globalAlpha = 1.0;
    
    // Calçadas
    ctx.fillStyle = '#666666';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 210, 800, 40);
    ctx.fillRect(0, 350, 800, 40);
    ctx.fillRect(310, 0, 40, 600);
    ctx.fillRect(450, 0, 40, 600);
    ctx.globalAlpha = 1.0;
    
    // Postes
    ctx.fillStyle = '#FFD700';
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < 4; i++) {
        const x = 100 + i * 200;
        ctx.beginPath();
        ctx.arc(x, 225, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(x - 2, 215, 4, 20);
        ctx.fillStyle = '#FFD700';
    }
    ctx.globalAlpha = 1.0;
    
    // Desenhar fumaça
    smokeParticles = smokeParticles.filter(p => p.life > 0);
    smokeParticles.forEach(p => {
        p.update();
        p.draw();
    });
    
    // Adicionar fumaça contínua durante o acidente
    if (collisionOccurred && Math.random() < 0.3) {
        smokeParticles.push(new SmokeParticle(380, 280));
    }
    
    // Carros
    if (car1.active) drawCar(car1.x, car1.y, car1.color, true, car1.type);
    if (car2.active) drawCar(car2.x, car2.y, car2.color, false, car2.type);
    
    // Ambulância
    if (ambulance.active) {
        drawAmbulance(ambulance.x, ambulance.y, ambulance.orientation);
    }
    
    // Informações
    ctx.font = 'bold 14px "Courier New"';
    ctx.fillStyle = '#00ff00';
    ctx.fillText('🚁 DRONE - VISÃO AÉREA', 20, 30);
    ctx.font = '10px "Courier New"';
    ctx.fillText('ALT: 120m | ZOOM: 2x', 20, 50);
}

function drawCar(x, y, color, isHorizontal, type) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    if (isHorizontal) {
        ctx.fillRect(x, y, 40, 20);
        ctx.fillStyle = '#333333';
        ctx.fillRect(x + 5, y + 2, 8, 3);
        ctx.fillRect(x + 27, y + 2, 8, 3);
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(x + 5, y + 12, 10, 5);
        ctx.fillRect(x + 25, y + 12, 10, 5);
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(x + 38, y + 5, 2, 5);
        ctx.fillRect(x, y + 5, 2, 5);
    } else {
        ctx.fillRect(x, y, 20, 40);
        ctx.fillStyle = '#333333';
        ctx.fillRect(x + 2, y + 5, 3, 8);
        ctx.fillRect(x + 2, y + 27, 3, 8);
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(x + 2, y + 5, 5, 10);
        ctx.fillRect(x + 2, y + 25, 5, 10);
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(x + 5, y + 38, 5, 2);
        ctx.fillRect(x + 5, y, 5, 2);
    }
    ctx.shadowBlur = 0;
}

function drawAmbulance(x, y, orientation) {
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 15;
    
    if (orientation === 'horizontal') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 12, y - 6, 35, 14);
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x, y - 2, 8, 4);
        ctx.fillRect(x - 2, y - 4, 12, 2);
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(x - 16, y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + 12, y - 4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(x + 12, y + 1, 2, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 6, y - 12, 14, 35);
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x - 2, y, 5, 7);
        ctx.fillRect(x - 4, y - 2, 9, 12);
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(x - 2, y - 17, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x - 4, y + 13, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(x + 1, y + 13, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function restartSimulation() {
    simulationRunning = true;
    collisionOccurred = false;
    ambulanceActive = false;
    ambulance.active = false;
    
    // Limpar fumaça
    smokeParticles = [];
    
    stopAllSounds();
    
    let newCar1 = randomCar();
    let newCar2 = randomCar();
    
    car1 = { 
        x: 100, y: 280, speed: 1.5 + Math.random(), active: true, 
        color: newCar1.color, type: newCar1.type 
    };
    car2 = { 
        x: 380, y: 100, speed: 1.5 + Math.random(), active: true, 
        color: newCar2.color, type: newCar2.type 
    };
    
    eventLog = [];
    reportLog.innerHTML = '<div class="log-entry system"><span class="log-time">[00:00:00]</span><span class="log-message">Sistema inicializado</span></div>';
    victimStatusText.textContent = '-';
    
    addEvent('🔄 Simulação reiniciada', 'system');
}

// Loop principal
function simulate() {
    if (!simulationRunning) return;
    
    updateTime();
    
    if (!collisionOccurred) {
        moveCars();
    } else {
        moveAmbulance();
    }
    
    drawDroneView();
    
    requestAnimationFrame(simulate);
}

// Event listeners
restartBtn.addEventListener('click', restartSimulation);
window.addEventListener('load', initAudios);

// Iniciar simulação
addEvent('🚁 Sistema de monitoramento ativado', 'system');
simulate();
setInterval(updateTime, 1000);
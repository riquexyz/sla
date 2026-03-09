// Configuração do canvas
const canvas = document.getElementById('trafficCanvas');
const ctx = canvas.getContext('2d');

// Variáveis de controle
let simulationRunning = true;
let collisionOccurred = false;
let ambulanceActive = false;
let victimStatus = '';

// Elementos da interface
const reportLog = document.getElementById('reportLog');
const victimStatusText = document.getElementById('victimStatusText');
const currentTimeDisplay = document.getElementById('currentTime');
const restartBtn = document.getElementById('restartBtn');

// Posições dos objetos
let car1 = { x: 100, y: 280, speed: 2, active: true, color: '#FF0000' }; // Carro horizontal (vermelho)
let car2 = { x: 380, y: 100, speed: 2, active: true, color: '#0000FF' }; // Carro vertical (azul)
let ambulance = { 
    x: 0, 
    y: 0, 
    active: false, 
    state: 'coming',
    orientation: 'horizontal',
    stage: 'exiting' // 'exiting', 'onRoad', 'approaching', 'stopped', 'returning', 'parking'
};

// Histórico de eventos
let eventLog = [];

// Atualizar tempo
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    currentTimeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

// Adicionar evento ao log
function addEvent(message, type = 'system') {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const eventEntry = { time, message, type };
    eventLog.push(eventEntry);
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `<span class="log-time">[${time}]</span><span class="log-message">${message}</span>`;
    
    reportLog.appendChild(logEntry);
    reportLog.scrollTop = reportLog.scrollHeight;
}

// Gerar status da vítima aleatório
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

// Verificar colisão
function checkCollision() {
    if (!collisionOccurred && car1.active && car2.active) {
        if (Math.abs(car1.x - 380) < 25 && Math.abs(car2.y - 280) < 25) {
            collisionOccurred = true;
            car1.color = '#FFA500';
            car2.color = '#FFA500';
            car1.speed = 0;
            car2.speed = 0;
            
            victimStatus = generateVictimStatus();
            victimStatusText.textContent = victimStatus;
            
            addEvent('🚨 COLISÃO DETECTADA no cruzamento!', 'collision');
            addEvent('🚗 Veículo A (horizontal) avançou o cruzamento', 'collision');
            addEvent('🚙 Veículo B (vertical) trafegava na via perpendicular', 'collision');
            addEvent(`👤 Status da vítima: ${victimStatus}`, 'collision');
            
            setTimeout(() => {
                callAmbulance();
            }, 2000);
        }
    }
}

// Chamar ambulância
function callAmbulance() {
    if (!ambulanceActive) {
        ambulanceActive = true;
        ambulance.active = true;
        ambulance.state = 'coming';
        ambulance.stage = 'exiting';
        
        // Posição inicial: estacionamento do hospital
        ambulance.x = 710;
        ambulance.y = 515;
        ambulance.orientation = 'horizontal';
        
        addEvent('🚑 AMBULÂNCIA acionada - Saindo do estacionamento', 'ambulance');
    }
}

// Mover ambulância
function moveAmbulance() {
    if (!ambulance.active) return;
    
    const centerX = 380; // Centro do cruzamento (onde os carros colidiram)
    const centerY = 280;
    const speed = 2;
    const safeDistance = 40; // Distância segura para parar antes do acidente
    
    // Pontos de referência
    const roadEntryX = 360; // Ponto onde entra na rua (próximo ao hospital)
    const roadY = 400; // Altura onde termina o estacionamento e começa a rua
    const accidentY = centerY + safeDistance; // Posição Y para parar antes do acidente (320)
    const hospitalReturnY = 500; // Altura para voltar ao estacionamento
    
    switch(ambulance.state) {
        case 'coming':
            // ESTÁGIO 1: Saindo do estacionamento (horizontal para esquerda)
            if (ambulance.stage === 'exiting') {
                if (ambulance.x > roadEntryX) {
                    ambulance.x -= speed;
                    ambulance.orientation = 'horizontal';
                } else {
                    ambulance.stage = 'onRoad';
                }
            }
            // ESTÁGIO 2: Subindo a rua em direção ao acidente (vertical para cima)
            else if (ambulance.stage === 'onRoad') {
                if (ambulance.y > accidentY) {
                    ambulance.y -= speed;
                    ambulance.orientation = 'vertical';
                } else {
                    ambulance.stage = 'approaching';
                }
            }
            // ESTÁGIO 3: Aproximação final do acidente (horizontal para esquerda)
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
            // ESTÁGIO 1: Saindo do acidente (horizontal para direita)
            if (ambulance.stage === 'returning') {
                if (ambulance.x < roadEntryX) {
                    ambulance.x += speed;
                    ambulance.orientation = 'horizontal';
                } else {
                    ambulance.stage = 'goingDown';
                }
            }
            // ESTÁGIO 2: Descendo a rua (vertical para baixo)
            else if (ambulance.stage === 'goingDown') {
                if (ambulance.y < hospitalReturnY) {
                    ambulance.y += speed;
                    ambulance.orientation = 'vertical';
                } else {
                    ambulance.stage = 'parking';
                }
            }
            // ESTÁGIO 3: Entrando no estacionamento (horizontal para direita)
            else if (ambulance.stage === 'parking') {
                if (ambulance.x < 710) {
                    ambulance.x += speed;
                    ambulance.orientation = 'horizontal';
                } else {
                    ambulance.active = false;
                    ambulanceActive = false;
                    addEvent('🏥 Ambulância estacionada no hospital', 'system');
                }
            }
            break;
    }
}

// Mover carros
function moveCars() {
    if (!collisionOccurred) {
        if (car1.active) {
            car1.x += car1.speed;
            if (car1.x > 800) car1.x = 100;
        }
        if (car2.active) {
            car2.y += car2.speed;
            if (car2.y > 600) car2.y = 100;
        }
        checkCollision();
    }
}

// Desenhar estabelecimentos
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
    ctx.fillText('GAS', 45, 135);
    
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
    
    // HOSPITAL COM ESTACIONAMENTO
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(650, 400, 120, 80);
    
    // Cruz vermelha
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(690, 425, 40, 10);
    ctx.fillRect(705, 410, 10, 40);
    
    // Telhado
    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(650, 390, 120, 15);
    
    // Placa do hospital
    ctx.font = 'bold 12px "Courier New"';
    ctx.fillStyle = '#FF0000';
    ctx.fillText('HOSP', 680, 402);
    
    // ESTACIONAMENTO
    ctx.fillStyle = '#444444';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(640, 500, 140, 40);
    ctx.globalAlpha = 1.0;
    
    // Linhas das vagas
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
    
    // Vaga da ambulância
    ctx.font = '10px "Courier New"';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('A', 715, 525);
    
    // Carros estacionados
    ctx.fillStyle = '#333333';
    ctx.fillRect(660, 515, 25, 12);
    ctx.fillStyle = '#666666';
    ctx.fillRect(700, 515, 25, 12);
}

// Desenhar árvores
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

// Desenhar via
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
    
    // Carros
    if (car1.active) drawCar(car1.x, car1.y, car1.color, true);
    if (car2.active) drawCar(car2.x, car2.y, car2.color, false);
    
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

// Desenhar carro
function drawCar(x, y, color, isHorizontal) {
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

// Desenhar ambulância
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

// Reiniciar simulação
function restartSimulation() {
    simulationRunning = true;
    collisionOccurred = false;
    ambulanceActive = false;
    ambulance.active = false;
    
    car1 = { x: 100, y: 280, speed: 2, active: true, color: '#FF0000' };
    car2 = { x: 380, y: 100, speed: 2, active: true, color: '#0000FF' };
    
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

restartBtn.addEventListener('click', restartSimulation);

addEvent('🚁 Sistema de monitoramento ativado - Modo Drone', 'system');
simulate();
setInterval(updateTime, 1000);
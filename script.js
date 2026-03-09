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
    direction: 'left', 
    state: 'coming',
    orientation: 'horizontal' // 'horizontal' ou 'vertical'
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
        // Verificar se os carros estão no centro do cruzamento
        if (Math.abs(car1.x - 380) < 25 && Math.abs(car2.y - 280) < 25) {
            collisionOccurred = true;
            car1.color = '#FFA500'; // Laranja (carro danificado)
            car2.color = '#FFA500'; // Laranja (carro danificado)
            car1.speed = 0;
            car2.speed = 0;
            
            victimStatus = generateVictimStatus();
            victimStatusText.textContent = victimStatus;
            
            addEvent('🚨 COLISÃO DETECTADA no cruzamento!', 'collision');
            addEvent('🚗 Veículo A (horizontal) avançou o cruzamento', 'collision');
            addEvent('🚙 Veículo B (vertical) trafegava na via perpendicular', 'collision');
            addEvent(`👤 Status da vítima: ${victimStatus}`, 'collision');
            
            // Chamar ambulância após 2 segundos
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
        
        // Escolher direção aleatória
        const directions = ['left', 'right', 'top', 'bottom'];
        ambulance.direction = directions[Math.floor(Math.random() * 4)];
        
        // Posicionar ambulância baseado na direção e definir orientação
        switch(ambulance.direction) {
            case 'left':
                ambulance.x = -80;
                ambulance.y = 280;
                ambulance.orientation = 'horizontal';
                break;
            case 'right':
                ambulance.x = 880;
                ambulance.y = 280;
                ambulance.orientation = 'horizontal';
                break;
            case 'top':
                ambulance.x = 380;
                ambulance.y = -80;
                ambulance.orientation = 'vertical';
                break;
            case 'bottom':
                ambulance.x = 380;
                ambulance.y = 680;
                ambulance.orientation = 'vertical';
                break;
        }
        
        addEvent('🚑 AMBULÂNCIA enviada para o local', 'ambulance');
    }
}

// Mover ambulância
function moveAmbulance() {
    if (!ambulance.active) return;
    
    const centerX = 380;
    const centerY = 280;
    const speed = 3;
    
    // Distância segura para parar antes dos carros
    const safeDistance = 50;
    
    switch(ambulance.state) {
        case 'coming':
            // Verificar se chegou na distância segura
            let distanceToTarget;
            let shouldStop = false;
            
            switch(ambulance.direction) {
                case 'left':
                    distanceToTarget = Math.abs(ambulance.x - (centerX - safeDistance));
                    if (ambulance.x >= centerX - safeDistance) {
                        shouldStop = true;
                    }
                    break;
                case 'right':
                    distanceToTarget = Math.abs(ambulance.x - (centerX + safeDistance));
                    if (ambulance.x <= centerX + safeDistance) {
                        shouldStop = true;
                    }
                    break;
                case 'top':
                    distanceToTarget = Math.abs(ambulance.y - (centerY - safeDistance));
                    if (ambulance.y >= centerY - safeDistance) {
                        shouldStop = true;
                    }
                    break;
                case 'bottom':
                    distanceToTarget = Math.abs(ambulance.y - (centerY + safeDistance));
                    if (ambulance.y <= centerY + safeDistance) {
                        shouldStop = true;
                    }
                    break;
            }
            
            if (shouldStop) {
                ambulance.state = 'stopped';
                addEvent('🚑 AMBULÂNCIA chegou ao local', 'ambulance');
                
                // Parar por 3 segundos
                setTimeout(() => {
                    ambulance.state = 'leaving';
                    addEvent('✅ Atendimento realizado, ambulância deixando o local', 'ambulance');
                }, 3000);
            } else {
                // Mover em direção ao centro (mas parar antes)
                switch(ambulance.direction) {
                    case 'left':
                        ambulance.x += speed;
                        break;
                    case 'right':
                        ambulance.x -= speed;
                        break;
                    case 'top':
                        ambulance.y += speed;
                        break;
                    case 'bottom':
                        ambulance.y -= speed;
                        break;
                }
            }
            break;
            
        case 'leaving':
            // Sair pela mesma direção que veio
            switch(ambulance.direction) {
                case 'left':
                    ambulance.x -= speed;
                    if (ambulance.x < -100) {
                        ambulance.active = false;
                        ambulanceActive = false;
                    }
                    break;
                case 'right':
                    ambulance.x += speed;
                    if (ambulance.x > 900) {
                        ambulance.active = false;
                        ambulanceActive = false;
                    }
                    break;
                case 'top':
                    ambulance.y -= speed;
                    if (ambulance.y < -100) {
                        ambulance.active = false;
                        ambulanceActive = false;
                    }
                    break;
                case 'bottom':
                    ambulance.y += speed;
                    if (ambulance.y > 700) {
                        ambulance.active = false;
                        ambulanceActive = false;
                    }
                    break;
            }
            break;
    }
}

// Mover carros
function moveCars() {
    if (!collisionOccurred) {
        // Carro horizontal
        if (car1.active) {
            car1.x += car1.speed;
            if (car1.x > 800) {
                car1.x = 100;
            }
        }
        
        // Carro vertical
        if (car2.active) {
            car2.y += car2.speed;
            if (car2.y > 600) {
                car2.y = 100;
            }
        }
        
        checkCollision();
    }
}

// Desenhar via (visão drone)
function drawDroneView() {
    // Fundo escuro
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 800, 600);
    
    // Grade de fundo (efeito drone)
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 0.3;
    ctx.globalAlpha = 0.2;
    
    // Linhas horizontais da grade
    for (let i = 0; i < 600; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(800, i);
        ctx.stroke();
    }
    
    // Linhas verticais da grade
    for (let i = 0; i < 800; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 600);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
    
    // Estrada horizontal
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 250, 800, 100);
    
    // Borda da estrada horizontal
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 250, 800, 100);
    
    // Faixas da estrada horizontal
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
    
    // Borda da estrada vertical
    ctx.strokeStyle = '#444444';
    ctx.strokeRect(350, 0, 100, 600);
    
    // Faixas da estrada vertical
    ctx.strokeStyle = '#FFFF00';
    ctx.setLineDash([20, 30]);
    ctx.beginPath();
    ctx.moveTo(400, 0);
    ctx.lineTo(400, 600);
    ctx.stroke();
    
    // Cruzamento (área central)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(350, 250, 100, 100);
    
    // Faixas de pedestres no cruzamento
    ctx.setLineDash([]);
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(360, 260 + i * 20, 80, 5);
    }
    ctx.globalAlpha = 1.0;
    
    // Carros
    if (car1.active) {
        drawCar(car1.x, car1.y, car1.color, true);
    }
    if (car2.active) {
        drawCar(car2.x, car2.y, car2.color, false);
    }
    
    // Ambulância
    if (ambulance.active) {
        drawAmbulance(ambulance.x, ambulance.y, ambulance.orientation);
    }
    
    // Informações do drone no canto
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
        // Carro horizontal
        ctx.fillRect(x, y, 40, 20);
        
        // Detalhes do carro
        ctx.fillStyle = '#333333';
        ctx.fillRect(x + 5, y + 2, 8, 3);
        ctx.fillRect(x + 27, y + 2, 8, 3);
        
        // Janelas
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(x + 5, y + 12, 10, 5);
        ctx.fillRect(x + 25, y + 12, 10, 5);
        
        // Faróis
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(x + 38, y + 5, 2, 5);
        ctx.fillRect(x, y + 5, 2, 5);
    } else {
        // Carro vertical
        ctx.fillRect(x, y, 20, 40);
        
        // Detalhes do carro
        ctx.fillStyle = '#333333';
        ctx.fillRect(x + 2, y + 5, 3, 8);
        ctx.fillRect(x + 2, y + 27, 3, 8);
        
        // Janelas
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(x + 2, y + 5, 5, 10);
        ctx.fillRect(x + 2, y + 25, 5, 10);
        
        // Faróis
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(x + 5, y + 38, 5, 2);
        ctx.fillRect(x + 5, y, 5, 2);
    }
    
    ctx.shadowBlur = 0;
}

// Desenhar ambulância com orientação correta
function drawAmbulance(x, y, orientation) {
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 15;
    
    if (orientation === 'horizontal') {
        // Ambulância horizontal
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 20, y - 10, 50, 20);
        
        // Cruz vermelha
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x, y - 3, 10, 6);
        ctx.fillRect(x - 3, y - 6, 16, 3);
        
        // Sirene
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(x - 25, y - 3, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Luzes da ambulância
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + 20, y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(x + 20, y + 2, 3, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Ambulância vertical
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 10, y - 20, 20, 50);
        
        // Cruz vermelha
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x - 3, y, 6, 10);
        ctx.fillRect(x - 6, y - 3, 12, 16);
        
        // Sirene
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(x - 3, y - 25, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Luzes da ambulância
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x - 5, y + 20, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#0000FF';
        ctx.beginPath();
        ctx.arc(x + 2, y + 20, 3, 0, Math.PI * 2);
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
    
    // Resetar carros
    car1 = { x: 100, y: 280, speed: 2, active: true, color: '#FF0000' };
    car2 = { x: 380, y: 100, speed: 2, active: true, color: '#0000FF' };
    
    // Limpar relatório
    eventLog = [];
    reportLog.innerHTML = '<div class="log-entry system"><span class="log-time">[00:00:00]</span><span class="log-message">Sistema inicializado</span></div>';
    victimStatusText.textContent = '-';
    
    addEvent('🔄 Simulação reiniciada', 'system');
}

// Loop principal da simulação
function simulate() {
    if (!simulationRunning) return;
    
    updateTime();
    
    if (!collisionOccurred) {
        moveCars();
    } else {
        moveAmbulance();
    }
    
    // Desenhar visão drone
    drawDroneView();
    
    requestAnimationFrame(simulate);
}

// Event listener
restartBtn.addEventListener('click', restartSimulation);

// Iniciar simulação
addEvent('🚁 Sistema de monitoramento ativado - Modo Drone', 'system');
simulate();

// Timer para atualização do relógio
setInterval(updateTime, 1000);
/**
 * ============================================================
 *  RELÓGIO DE 20 HORAS — clock.js
 *
 *  Conceito:
 *    1 dia  = 86.400 segundos  (imutável)
 *    1 dia  = 20 horas
 *    1 hora = 4.320 segundos
 *    1 hora = 72 minutos
 *    1 min  = 60 segundos
 *
 *  Ângulos dos ponteiros (transform-origin: bottom center):
 *    0 deg  → ponteiro aponta para CIMA  (posição 20 / topo)
 *    180 deg → ponteiro aponta para BAIXO (posição 10)
 *  Portanto NÃO aplicamos offset de ±90°.
 *  O CSS já centraliza via margin-left; NÃO usamos translateX no JS.
 * ============================================================
 */

'use strict';

/* ──────────────────────────────────────────
   CONSTANTES
────────────────────────────────────────── */
const SECONDS_PER_DAY    = 86400;   // 24 × 60 × 60
const HOURS_PER_DAY      = 20;
const MINUTES_PER_HOUR   = 72;      // 1440 / 20
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR   = MINUTES_PER_HOUR * SECONDS_PER_MINUTE; // 4320

/* ──────────────────────────────────────────
   REFERÊNCIAS DOM
────────────────────────────────────────── */
const hourHand    = document.getElementById('hourHand');
const minuteHand  = document.getElementById('minuteHand');
const secondHand  = document.getElementById('secondHand');
const digitalTime = document.getElementById('digitalTime');
const digitalReal = document.getElementById('digitalReal');
const statHoraVal = document.getElementById('statHoraVal');
const statMinVal  = document.getElementById('statMinVal');
const statSecVal  = document.getElementById('statSecVal');
const clockMarks  = document.getElementById('clockMarks');

/* ──────────────────────────────────────────
   GERAR MARCAÇÕES E NÚMEROS (20 posições)
────────────────────────────────────────── */
function buildClockMarks() {
    const RADIUS_LABEL = 42; // raio dos números em % do raio da face
    const fragment = document.createDocumentFragment();

    for (let h = 0; h < HOURS_PER_DAY; h++) {
        const isMain = (h % 5 === 0); // marca principal a cada 5 horas

        /* ── Traço do tick ──
         * O tick está em top:0. Para que a rotação seja em torno do CENTRO
         * do clock-face, o transform-origin Y precisa ser:
         *   (50% da face) / (altura do tick) * 100%
         *   Ex: main tick 13%: 50/13*100 ≈ 384.6%
         *       minor tick  7%: 50/7*100  ≈ 714.3%
         */
        const tickHeight = isMain ? 13 : 7;
        const originY    = (50 / tickHeight * 100).toFixed(1) + '%';

        const tick = document.createElement('div');
        tick.style.cssText = `
            position: absolute;
            top: 0;
            left: 50%;
            width: ${isMain ? '3px' : '2px'};
            height: ${tickHeight}%;
            margin-left: ${isMain ? '-1.5px' : '-1px'};
            background: ${isMain ? 'rgba(34,197,94,.9)' : 'rgba(34,197,94,.38)'};
            border-radius: 2px;
            transform-origin: 50% ${originY};
            transform: rotate(${(h / HOURS_PER_DAY) * 360}deg);
            box-shadow: ${isMain ? '0 0 6px rgba(34,197,94,.5)' : 'none'};
        `;
        fragment.appendChild(tick);

        /* ── Número da hora ──
         * Calcula posição cartesiana a partir do centro (50%, 50%).
         * Ângulo: começa no topo (-90°) e vai no sentido horário.
         */
        const angleDeg = (h / HOURS_PER_DAY) * 360 - 90;
        const angleRad = (angleDeg * Math.PI) / 180;
        const numX = 50 + RADIUS_LABEL * Math.cos(angleRad);
        const numY = 50 + RADIUS_LABEL * Math.sin(angleRad);

        const label = document.createElement('div');
        label.textContent = (h === 0) ? '20' : h;
        label.style.cssText = `
            position: absolute;
            left: ${numX}%;
            top:  ${numY}%;
            transform: translate(-50%, -50%);
            font-family: 'Orbitron', monospace;
            font-size: ${isMain ? 'clamp(9px,1.8vw,13px)' : 'clamp(7px,1.4vw,10px)'};
            font-weight: ${isMain ? '700' : '400'};
            color: ${isMain ? 'rgba(134,239,172,.95)' : 'rgba(134,239,172,.42)'};
            z-index: 2;
            letter-spacing: -0.02em;
            line-height: 1;
            pointer-events: none;
            ${h === 0
                ? 'color:rgba(57,255,20,.95);text-shadow:0 0 8px rgba(57,255,20,.6);'
                : ''}
        `;
        fragment.appendChild(label);
    }

    clockMarks.appendChild(fragment);
}

/* ──────────────────────────────────────────
   CALCULAR ÂNGULOS DOS PONTEIROS
────────────────────────────────────────── */
/**
 * Com bottom:50% + transform-origin:bottom center no CSS:
 *   rotate(0deg)   → ponteiro aponta para CIMA   ✓ (hora 20 = topo)
 *   rotate(180deg) → ponteiro aponta para BAIXO  ✓ (hora 10 = baixo)
 *
 * Por isso NÃO subtraímos 90° — o layout já está correto.
 */
function calcClockAngles(totalSeconds) {
    // ── Hora no sistema de 20h ──
    const h20       = Math.floor(totalSeconds / SECONDS_PER_HOUR);
    const remAfterH = totalSeconds % SECONDS_PER_HOUR;        // segundos dentro da hora atual

    // Minutos: quantos blocos de 60s cabem em remAfterH
    const m72 = Math.floor(remAfterH / SECONDS_PER_MINUTE);   // 0..71

    // Segundos dentro do minuto atual
    const s60 = remAfterH % SECONDS_PER_MINUTE;               // 0..59

    // ── Ângulos contínuos (ponteiros se movem suavemente, sem saltos) ──

    // Hora: giro completo em 86.400 s (= 20 h)
    const hourDeg = (totalSeconds / SECONDS_PER_DAY) * 360;

    // Minuto: giro completo em 4.320 s (= 1 hora de 20h)
    const minuteDeg = (remAfterH / SECONDS_PER_HOUR) * 360;

    // Segundo: giro completo em 60 s
    const secondDeg = (s60 / SECONDS_PER_MINUTE) * 360;

    return { hourDeg, minuteDeg, secondDeg, h20, m72, s60 };
}

/* ──────────────────────────────────────────
   SEGUNDOS DESDE MEIA-NOITE
────────────────────────────────────────── */
function getTotalSeconds() {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}

/* ──────────────────────────────────────────
   ZERO-PAD
────────────────────────────────────────── */
function pad(n, digits = 2) {
    return String(n).padStart(digits, '0');
}

/* ──────────────────────────────────────────
   ATUALIZAR RELÓGIO (chamado a cada 1s)
────────────────────────────────────────── */
function updateClock() {
    const totalSec = getTotalSeconds();
    const { hourDeg, minuteDeg, secondDeg, h20, m72, s60 } = calcClockAngles(totalSec);

    /*
     * IMPORTANTE: o CSS dos ponteiros usa:
     *   bottom: 50%;  left: 50%;  margin-left: -Npx;
     *   transform-origin: bottom center;
     *
     * Portanto o único transform necessário em JS é rotate().
     * NÃO usar translateX(-50%) aqui — já está resolvido pelo margin-left no CSS.
     */
    hourHand.style.transform   = `rotate(${hourDeg}deg)`;
    minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
    secondHand.style.transform = `rotate(${secondDeg}deg)`;

    // Display digital — hora 0 exibida como "20"
    const displayH = (h20 === 0) ? 20 : h20;
    digitalTime.textContent = `${pad(displayH)}:${pad(m72)}:${pad(s60)}`;

    // Hora real (sistema 24h)
    digitalReal.textContent = new Date().toLocaleTimeString('pt-BR', { hour12: false });

    // Cards de estatística
    statHoraVal.textContent = pad(h20);
    statMinVal.textContent  = pad(m72);
    statSecVal.textContent  = pad(s60);
}

/* ──────────────────────────────────────────
   NAVEGAÇÃO LATERAL (bolinhas)
────────────────────────────────────────── */
function initNavDots() {
    const sections = ['hero', 'clock-section', 'math-section', 'why-section'];
    const dotIds   = ['nav-hero', 'nav-clock', 'nav-math', 'nav-why'];
    const dots     = dotIds.map(id => document.getElementById(id));

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const idx = sections.indexOf(entry.target.id);
                dots.forEach((d, i) => d.classList.toggle('active', i === idx));
            }
        });
    }, { threshold: 0.5 });

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
}

/* ──────────────────────────────────────────
   SCROLL REVEAL (animação de entrada)
────────────────────────────────────────── */
function initScrollReveal() {
    const targets = document.querySelectorAll(
        '.math-card, .why-card, .formula-box, .stat-card, .clock-container, .digital-display'
    );

    targets.forEach(el => {
        el.style.opacity   = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    });

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity   = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, i * 80);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    targets.forEach(el => observer.observe(el));
}

/* ──────────────────────────────────────────
   SMOOTH SCROLL (links âncora)
────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

/* ──────────────────────────────────────────
   INICIALIZAÇÃO
────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    buildClockMarks();
    updateClock();                   // renderiza imediatamente
    setInterval(updateClock, 1000);  // atualiza a cada segundo
    initNavDots();
    initScrollReveal();

    console.log('%c🕐 Relógio de 20 Horas', 'color:#39ff14;font-family:monospace;font-size:18px;font-weight:bold;');
    console.log(`%c1h = ${SECONDS_PER_HOUR}s = ${MINUTES_PER_HOUR}min | Dia = ${SECONDS_PER_DAY}s`, 'color:#86efac;font-size:13px;');
});

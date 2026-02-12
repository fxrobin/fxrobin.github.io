const PROMPT = 'guest@term-cv >';
const CHAR_DELAY = 12;

const terminal = document.getElementById('terminal');
let history = [];
let historyIndex = -1;
let inputLine = null;
let commandInput = null;

const typeQueue = [];
let typing = false;

// Typing engine

function processQueue() {
    if (typing || typeQueue.length === 0) return;
    typing = true;
    const { text, className, isHTML, resolve } = typeQueue.shift();

    const line = document.createElement('div');
    if (className) line.className = className;

    if (inputLine) {
        terminal.insertBefore(line, inputLine);
    } else {
        terminal.appendChild(line);
    }

    if (isHTML) {
        line.innerHTML = text;
        terminal.scrollTop = terminal.scrollHeight;
        typing = false;
        if (resolve) resolve();
        processQueue();
        return;
    }

    if (!text || text.trim() === '') {
        line.textContent = text;
        terminal.scrollTop = terminal.scrollHeight;
        typing = false;
        if (resolve) resolve();
        processQueue();
        return;
    }

    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.textContent = ' ';
    line.appendChild(cursor);

    function typeChar() {
        if (i < text.length) {
            cursor.remove();
            line.appendChild(document.createTextNode(text[i]));
            i++;
            if (i < text.length) {
                cursor.textContent = text[i];
            } else {
                cursor.textContent = ' ';
            }
            line.appendChild(cursor);
            terminal.scrollTop = terminal.scrollHeight;
            setTimeout(typeChar, CHAR_DELAY);
        } else {
            cursor.remove();
            terminal.scrollTop = terminal.scrollHeight;
            typing = false;
            if (resolve) resolve();
            processQueue();
        }
    }

    typeChar();
}

function print(text, className = '') {
    return new Promise(resolve => {
        typeQueue.push({ text, className, isHTML: false, resolve });
        processQueue();
    });
}

function printHTML(html) {
    return new Promise(resolve => {
        typeQueue.push({ text: html, className: '', isHTML: true, resolve });
        processQueue();
    });
}

function printSection(title) {
    print('');
    print(`< ${title} >`, 'header');
    print('');
}

function printList(items, className = '') {
    items.forEach(item => print(`  • ${item}`, className));
}

function printImmediate(text, className = '') {
    const line = document.createElement('div');
    if (className) line.className = className;
    line.textContent = text;
    if (inputLine) {
        terminal.insertBefore(line, inputLine);
    } else {
        terminal.appendChild(line);
    }
    terminal.scrollTop = terminal.scrollHeight;
}

// Input

function createInputLine() {
    inputLine = document.createElement('div');
    inputLine.className = 'input-line';
    inputLine.innerHTML = `<span class="prompt">${PROMPT}</span> <input type="text" id="command-input" autocomplete="off" spellcheck="false"><span class="block-cursor"></span>`;
    terminal.appendChild(inputLine);
    commandInput = document.getElementById('command-input');

    function resizeInput() {
        commandInput.style.width = Math.max(1, commandInput.value.length) + 'ch';
    }

    commandInput.addEventListener('input', resizeInput);

    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            executeCommand(commandInput.value);
            commandInput.value = '';
            resizeInput();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < history.length - 1) {
                historyIndex++;
                commandInput.value = history[historyIndex];
                resizeInput();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                commandInput.value = history[historyIndex];
                resizeInput();
            } else if (historyIndex === 0) {
                historyIndex = -1;
                commandInput.value = '';
                resizeInput();
            }
        }
    });

    commandInput.focus();
    document.addEventListener('click', () => commandInput.focus());
}

// Commands

function executeCommand(cmd) {
    cmd = cmd.trim();
    if (!cmd) return;

    history.unshift(cmd);
    historyIndex = -1;

    print(`${PROMPT} ${cmd}`, 'prompt');

    const [command, ...args] = cmd.toLowerCase().split(' ');

    switch (command) {
        case 'help':
            showHelp();
            break;
        case 'about':
        case 'whoami':
            showAbout();
            break;
        case 'skills':
            showSkills();
            break;
        case 'experience':
        case 'exp':
            showExperience();
            break;
        case 'education':
            showEducation();
            break;
        case 'projects':
            showProjects();
            break;
        case 'contact':
            showContact();
            break;
        case 'clear':
        case 'cls':
            clearTerminal();
            break;
        case 'neofetch':
            showNeofetch();
            break;
        case 'matrix':
            showMatrix();
            break;
        case 'tree':
            showTree();
            break;
        case 'fortune':
            showFortune();
            break;
        default:
            print(`Command not found: ${command}`, 'error');
            print(`Type 'help' for available commands`, 'warning');
    }

    print('');
}

function showHelp() {
    printSection('AVAILABLE COMMANDS');
    print('  about      - Présentation et bio', 'success');
    print('  skills     - Compétences techniques', 'success');
    print('  experience - Parcours professionnel', 'success');
    print('  education  - Formation', 'success');
    print('  projects   - Projets personnels', 'success');
    print('  contact    - Informations de contact', 'success');
    print('');
    print('  neofetch   - System information', 'warning');
    print('  tree       - CV structure', 'warning');
    print('  matrix     - Easter egg ;)', 'warning');
    print('  fortune    - Random quote', 'warning');
    print('');
    print('  clear/cls  - Effacer l\'écran', 'prompt');
    print('');
}

function showAbout() {
    printSection('ABOUT ME');
    print(`Nom      : ${cvData.about.name}`);
    print(`Titre    : ${cvData.about.title}`);
    print(`Location : ${cvData.about.location}`);
    print('');
    cvData.about.bio.split('\n').forEach(line => print(line));
    print('');
}

function showSkills() {
    printSection('COMPÉTENCES');
    const categories = [
        ['Languages', cvData.skills.languages],
        ['Frameworks', cvData.skills.frameworks],
        ['Tools', cvData.skills.tools],
        ['Architecture', cvData.skills.architecture],
    ];
    categories.forEach(([label, items]) => {
        print(`[${label}]`, 'success');
        printList(items);
        print('');
    });
}

function showExperience() {
    printSection('EXPÉRIENCE');
    cvData.experience.forEach(exp => {
        print(`[${exp.period}]`, 'warning');
        print(`${exp.title} @ ${exp.company}`, 'success');
        print(`  ${exp.description}`);
        print('');
    });
}

function showEducation() {
    printSection('FORMATION');
    cvData.education.forEach(edu => {
        print(`[${edu.year}]`, 'warning');
        print(`${edu.degree}`, 'success');
        print(`  ${edu.school}`);
        print('');
    });
}

function showProjects() {
    printSection('PROJETS');
    printList(cvData.projects, 'success');
    print('');
}

function showContact() {
    printSection('CONTACT');
    print('  Email    : fx@example.com', 'success');
    print('  GitHub   : github.com/fx', 'success');
    print('  LinkedIn : linkedin.com/in/fx', 'success');
    print('  Blog     : fx-dev.blog', 'success');
    print('');
}

function showNeofetch() {
    print('');
    print('     ___       fx@retro-terminal', 'success');
    print('    (.. |      ─────────────────', 'success');
    print('    (<> |      OS: Retro-OS v1.0', 'success');
    print('   / __  \\     Shell: FX Terminal', 'success');
    print('  ( /  \\ /|    Resolution: Vintage CRT', 'success');
    print(' _/\\ __)\\ \\    Theme: Matrix Green', 'success');
    print(' \\/_____)\_)   Skills: Java, Quarkus, DDD', 'success');
    print('');
}

function showTree() {
    print('');
    print('cv/', 'header');
    print('├── about/', 'success');
    print('│   ├── bio.txt');
    print('│   └── contact.txt');
    print('├── skills/', 'success');
    print('│   ├── languages/');
    print('│   ├── frameworks/');
    print('│   └── architecture/');
    print('├── experience/', 'success');
    print('│   ├── 2020-present.txt');
    print('│   └── 2017-2020.txt');
    print('├── education/', 'success');
    print('│   └── master-2015.txt');
    print('└── projects/', 'success');
    print('    ├── thomson-emulator/');
    print('    └── mqtt-router/');
    print('');
}

function showMatrix() {
    print('Wake up, Neo...', 'success');
    print('The Matrix has you...', 'success');
    print('Follow the white rabbit.', 'success');
    print('');
    print('01001010 01000001 01010110 01000001', 'success');
    print('');
}

function showFortune() {
    const quotes = [
        '"Clean code is simple and direct." - Grady Booch',
        '"Make it work, make it right, make it fast." - Kent Beck',
        '"Premature optimization is the root of all evil." - Donald Knuth',
        '"Code is like humor. If you have to explain it, it\'s bad."',
        '"Truth can only be found in one place: the code." - Robert C. Martin'
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    print('');
    print(quote, 'warning');
    print('');
}

function clearTerminal() {
    terminal.innerHTML = '';
    inputLine = null;
    createInputLine();
}

// Boot sequence

const bootLines = [
    'Terminal-CV-OS v1.0. BASIC 512 Compatible',
    ' ',
    'Copyright (c) 1975 FX Systems',
    '512K RAM System (256K native, 256K Extended)',
    ' ',
    'Memory Check: OK',
    'CPU Check: OK',
    ' ',
    'Loading CV System...'
];

const postProgressLines = [
    'Ready.',
    '"Where code meets creativity"',
];

let bootIndex = 0;

async function bootStep() {
    if (bootIndex < bootLines.length) {
        await print(bootLines[bootIndex]);
        bootIndex++;
        setTimeout(bootStep, 30);
    } else {
        startProgressBar();
    }
}

function startProgressBar() {
    printImmediate('');
    const barWidth = 40;
    const progressDiv = document.createElement('div');
    progressDiv.className = 'progress-bar';
    terminal.appendChild(progressDiv);

    let progress = 0;
    const totalDuration = 2000;
    const steps = barWidth;
    const interval = totalDuration / steps;

    function updateBar() {
        const filled = '█'.repeat(progress);
        const empty = '░'.repeat(barWidth - progress);
        const pct = Math.round((progress / barWidth) * 100);
        progressDiv.textContent = `[${filled}${empty}] ${pct}%`;
        terminal.scrollTop = terminal.scrollHeight;

        if (progress < barWidth) {
            progress++;
            setTimeout(updateBar, interval);
        } else {
            printImmediate('');
            finishBoot();
        }
    }

    updateBar();
}

async function finishBoot() {
    for (const line of postProgressLines) {
        await print(line);
    }
    await printHTML('Type <span style="color:#0f0;font-weight:bold">help</span> for available commands');
    await print('');
    createInputLine();
}

bootStep();

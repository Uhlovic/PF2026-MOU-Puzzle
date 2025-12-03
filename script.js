// Získání elementů
const puzzlePieces = document.querySelectorAll('.puzzle-piece');
const puzzleSlots = document.querySelectorAll('.puzzle-slot');
const completionOverlay = document.getElementById('completionOverlay');
const puzzlePiecesContainer = document.getElementById('puzzlePieces');
const backgroundMusic = document.getElementById('backgroundMusic');
const musicBtn = document.getElementById('musicBtn');
const easterEggOverlay = document.getElementById('easterEggOverlay');
const closeEasterEggBtn = document.getElementById('closeEasterEggBtn');

// Stav hry
let placedPieces = 0;
const totalPieces = 8;
let musicPlaying = false;
let musicStarted = false;

// Předem načíst obrázek pro drag image
const puzzleImage = new Image();
puzzleImage.src = 'COP_new.png';

// Nastavit hlasitost hudby
backgroundMusic.volume = 0.6; // 60% hlasitosti

// Zamíchání dílků při načtení
window.addEventListener('DOMContentLoaded', () => {
    shufflePieces();
    initializeVisiblePieces();
});

// Inicializace - zobrazit pouze prvních 2-3 dílky (podle velikosti obrazovky)
function initializeVisiblePieces() {
    const piecesArray = Array.from(puzzlePieces);

    // Zjistit počet dílků podle velikosti obrazovky
    const isMobile = window.innerWidth <= 768;
    const visibleCount = isMobile ? 2 : 3;

    // Vytvořit pole indexů dílků k zobrazení
    const allIndices = Array.from({length: 8}, (_, i) => i);
    const visibleIndices = [];

    // Náhodně vybrat dílky
    for (let i = 0; i < visibleCount; i++) {
        const randomIndex = Math.floor(Math.random() * allIndices.length);
        visibleIndices.push(allIndices[randomIndex]);
        allIndices.splice(randomIndex, 1);
    }

    // Skrýt všechny kromě vybraných
    piecesArray.forEach((piece, index) => {
        if (!visibleIndices.includes(index)) {
            piece.classList.add('hidden');
        }
    });
}

// Zobrazit další dílek z fronty
function showNextPiece() {
    const hiddenPieces = puzzlePiecesContainer.querySelectorAll('.puzzle-piece.hidden');
    if (hiddenPieces.length > 0) {
        const nextPiece = hiddenPieces[0];
        nextPiece.classList.remove('hidden');
        nextPiece.classList.add('newly-visible');

        // Odstranit animační třídu po dokončení animace
        setTimeout(() => {
            nextPiece.classList.remove('newly-visible');
        }, 400);
    }
}

// Funkce pro zamíchání dílků
function shufflePieces() {
    const piecesArray = Array.from(puzzlePieces);
    // Fisher-Yates shuffle algoritmus
    for (let i = piecesArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        puzzlePiecesContainer.appendChild(piecesArray[j]);
    }
}

// Drag and Drop události pro dílky
puzzlePieces.forEach(piece => {
    piece.addEventListener('dragstart', handleDragStart);
    piece.addEventListener('dragend', handleDragEnd);

    // Touch události pro mobilní zařízení
    piece.addEventListener('touchstart', handleTouchStart, { passive: false });
    piece.addEventListener('touchmove', handleTouchMove, { passive: false });
    piece.addEventListener('touchend', handleTouchEnd, { passive: false });
});

// Drag and Drop události pro sloty
puzzleSlots.forEach(slot => {
    slot.addEventListener('dragover', handleDragOver);
    slot.addEventListener('dragleave', handleDragLeave);
    slot.addEventListener('drop', handleDrop);
});

let draggedPiece = null;

function handleDragStart(e) {
    // Zabránit přetažení správně umístěných dílků
    if (this.classList.contains('correct')) {
        e.preventDefault();
        return false;
    }

    // Spustit hudbu při první interakci
    startMusicOnInteraction();

    draggedPiece = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }

    // Povolit drop pouze pokud je slot prázdný
    if (!this.hasChildNodes() || this.children.length === 0) {
        e.dataTransfer.dropEffect = 'move';
        this.classList.add('drag-over');
    }

    return false;
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    this.classList.remove('drag-over');

    // Zkontrolovat, zda je slot prázdný nebo obsahuje špatně umístěný dílek
    if (this.hasChildNodes() && this.children.length > 0) {
        const existingPiece = this.children[0];
        // Pokud je tam správně umístěný dílek, nepřepisovat
        if (existingPiece.classList.contains('correct')) {
            return false;
        }
        // Pokud je tam špatně umístěný dílek, vrátit ho zpět
        if (existingPiece.classList.contains('incorrect')) {
            puzzlePiecesContainer.appendChild(existingPiece);
            existingPiece.classList.remove('placed', 'incorrect');
            existingPiece.setAttribute('draggable', 'true');
            this.classList.remove('filled');
        }
    }

    // Přidat dílek do slotu
    const slotPosition = parseInt(this.dataset.position);
    const pieceCorrectPosition = parseInt(draggedPiece.dataset.correctPosition);

    // Pokud dílek přichází z jiného slotu, vyčistit původní slot
    const previousSlot = draggedPiece.parentElement;
    if (previousSlot && previousSlot.classList.contains('puzzle-slot')) {
        previousSlot.classList.remove('filled');
    }

    // Přesunout dílek do slotu
    this.appendChild(draggedPiece);
    draggedPiece.classList.add('placed');
    draggedPiece.classList.remove('correct', 'incorrect');
    this.classList.add('filled');

    // Zkontrolovat, zda je dílek na správné pozici
    if (slotPosition === pieceCorrectPosition) {
        // Správná pozice - zelený signál
        draggedPiece.classList.add('correct');
        draggedPiece.setAttribute('draggable', 'false');
        placedPieces++;

        // Zobrazit další dílek z fronty
        showNextPiece();
    } else {
        // Špatná pozice - červený signál, lze přemístit
        draggedPiece.classList.add('incorrect');
        draggedPiece.setAttribute('draggable', 'true');
    }

    // Zkontrolovat, zda jsou všechny dílky umístěny správně
    checkCompletion();

    return false;
}

function checkCompletion() {
    // Zkontrolovat, zda jsou VŠECHNY dílky správně umístěné
    if (placedPieces === totalPieces) {
        // Puzzle je kompletní a správně složené!
        // Skrýt kontejner s dílky
        puzzlePiecesContainer.style.opacity = '0';
        puzzlePiecesContainer.style.pointerEvents = 'none';

        // Spojit obrázek - odstranit mezery a rámečky
        setTimeout(() => {
            const puzzleGrid = document.getElementById('puzzleGrid');
            puzzleGrid.classList.add('completed');
            // Úplně skrýt kontejner s dílky
            puzzlePiecesContainer.style.display = 'none';
            // Skrýt nadpis
            document.querySelector('h1').style.display = 'none';
            // Zobrazit PF 2026 nápis
            document.getElementById('pfGreeting').classList.add('show');
        }, 500);

        // Zobrazit gratulaci (po dokončení animace spojení + 1 sekunda navíc)
        setTimeout(() => {
            showCompletionMessage();
        }, 3000);
    }
}

function showCompletionMessage() {
    completionOverlay.classList.add('show');
}

// Možnost zavřít overlay kliknutím
completionOverlay.addEventListener('click', (e) => {
    if (e.target === completionOverlay) {
        completionOverlay.classList.remove('show');
    }
});

// Zavřít overlay křížkem
const closeCompletionBtn = document.getElementById('closeCompletionBtn');
closeCompletionBtn.addEventListener('click', () => {
    completionOverlay.classList.remove('show');
});

// Připojení tlačítek
const resetBtn = document.getElementById('resetBtn');
const helpBtn = document.getElementById('helpBtn');
const helpOverlay = document.getElementById('helpOverlay');
const closeHelpBtn = document.getElementById('closeHelpBtn');

resetBtn.addEventListener('click', resetGame);

// Zobrazit nápovědu
helpBtn.addEventListener('click', () => {
    helpOverlay.classList.add('show');
});

// Zavřít nápovědu
closeHelpBtn.addEventListener('click', () => {
    helpOverlay.classList.remove('show');
});

// Zavřít nápovědu kliknutím mimo obsah
helpOverlay.addEventListener('click', (e) => {
    if (e.target === helpOverlay) {
        helpOverlay.classList.remove('show');
    }
});


// Resetování hry
function resetGame() {
    placedPieces = 0;

    // Vrátit mřížku do původního stavu
    const puzzleGrid = document.getElementById('puzzleGrid');
    puzzleGrid.classList.remove('completed');

    // Vrátit všechny dílky zpět
    puzzleSlots.forEach(slot => {
        if (slot.hasChildNodes()) {
            const piece = slot.firstChild;
            puzzlePiecesContainer.appendChild(piece);
            piece.setAttribute('draggable', 'true');
            piece.classList.remove('placed', 'correct', 'incorrect', 'newly-visible', 'hidden');
            piece.style.opacity = '';
            piece.style.pointerEvents = '';
            slot.classList.remove('filled');
        }
    });

    // Resetovat všechny dílky v kontejneru - odstranit třídu hidden ze všech
    puzzlePiecesContainer.querySelectorAll('.puzzle-piece').forEach(piece => {
        piece.classList.remove('hidden', 'placed', 'correct', 'incorrect', 'newly-visible');
        piece.style.opacity = '';
        piece.style.pointerEvents = '';
        piece.setAttribute('draggable', 'true');
    });

    // Zobrazit kontejner s dílky zpět
    puzzlePiecesContainer.style.opacity = '';
    puzzlePiecesContainer.style.pointerEvents = '';
    puzzlePiecesContainer.style.display = '';

    // Zobrazit nadpis zpět
    document.querySelector('h1').style.display = '';

    // Skrýt PF 2026 nápis
    document.getElementById('pfGreeting').classList.remove('show');

    // Zamíchat znovu
    shufflePieces();

    // Resetovat viditelnost - zobrazit jen prvních 3
    initializeVisiblePieces();

    // Skrýt overlay
    completionOverlay.classList.remove('show');
}

// Touch události pro mobilní zařízení
let touchedPiece = null;
let touchClone = null;
let lastTouchedSlot = null;
let touchOffset = { x: 0, y: 0 };

function handleTouchStart(e) {
    // Zabránit přetažení správně umístěných dílků
    if (this.classList.contains('correct')) {
        return;
    }

    e.preventDefault();

    // Spustit hudbu při první interakci
    startMusicOnInteraction();

    touchedPiece = this;
    this.classList.add('dragging');

    // Uložit velikost dílku pro správné centrování
    const pieceWidth = this.offsetWidth;
    const pieceHeight = this.offsetHeight;
    touchOffset.x = pieceWidth / 2;
    touchOffset.y = pieceHeight / 2;

    // Vytvořit klon pro vizuální feedback
    const touch = e.touches[0];
    touchClone = this.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '10000';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.opacity = '0.8';
    touchClone.style.width = pieceWidth + 'px';
    touchClone.style.height = pieceHeight + 'px';
    touchClone.style.willChange = 'transform';
    touchClone.style.transition = 'none';
    // Nastavit přímo na správnou pozici místo 0,0
    touchClone.style.left = (touch.clientX - touchOffset.x) + 'px';
    touchClone.style.top = (touch.clientY - touchOffset.y) + 'px';
    document.body.appendChild(touchClone);
}

function handleTouchMove(e) {
    if (!touchedPiece) return;
    e.preventDefault();

    const touch = e.touches[0];

    // Posunout klon
    if (touchClone) {
        touchClone.style.left = (touch.clientX - touchOffset.x) + 'px';
        touchClone.style.top = (touch.clientY - touchOffset.y) + 'px';
    }

    // Najít slot pod prstem
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    const slot = elementUnderTouch?.closest('.puzzle-slot');

    // Odstranit drag-over z předchozího slotu
    if (lastTouchedSlot && lastTouchedSlot !== slot) {
        lastTouchedSlot.classList.remove('drag-over');
    }

    // Přidat drag-over na aktuální slot
    if (slot && (!slot.hasChildNodes() || slot.children.length === 0 || slot.children[0].classList.contains('incorrect'))) {
        slot.classList.add('drag-over');
        lastTouchedSlot = slot;
    } else {
        lastTouchedSlot = null;
    }
}

function handleTouchEnd(e) {
    if (!touchedPiece) return;
    e.preventDefault();

    touchedPiece.classList.remove('dragging');

    // Odstranit klon
    if (touchClone) {
        touchClone.remove();
        touchClone = null;
    }

    // Najít slot pod místem, kde byl prst zvednut
    const touch = e.changedTouches[0];
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    const slot = elementUnderTouch?.closest('.puzzle-slot');

    if (slot) {
        slot.classList.remove('drag-over');

        // Zkontrolovat, zda je slot prázdný nebo obsahuje špatně umístěný dílek
        if (slot.hasChildNodes() && slot.children.length > 0) {
            const existingPiece = slot.children[0];
            if (existingPiece.classList.contains('correct')) {
                touchedPiece = null;
                lastTouchedSlot = null;
                return;
            }
            if (existingPiece.classList.contains('incorrect')) {
                puzzlePiecesContainer.appendChild(existingPiece);
                existingPiece.classList.remove('placed', 'incorrect');
                existingPiece.setAttribute('draggable', 'true');
                slot.classList.remove('filled');
            }
        }

        // Přidat dílek do slotu
        const slotPosition = parseInt(slot.dataset.position);
        const pieceCorrectPosition = parseInt(touchedPiece.dataset.correctPosition);

        // Pokud dílek přichází z jiného slotu, vyčistit původní slot
        const previousSlot = touchedPiece.parentElement;
        if (previousSlot && previousSlot.classList.contains('puzzle-slot')) {
            previousSlot.classList.remove('filled');
        }

        // Přesunout dílek do slotu
        slot.appendChild(touchedPiece);
        touchedPiece.classList.add('placed');
        touchedPiece.classList.remove('correct', 'incorrect');
        slot.classList.add('filled');

        // Zkontrolovat, zda je dílek na správné pozici
        if (slotPosition === pieceCorrectPosition) {
            touchedPiece.classList.add('correct');
            touchedPiece.setAttribute('draggable', 'false');
            placedPieces++;
            showNextPiece();
        } else {
            touchedPiece.classList.add('incorrect');
            touchedPiece.setAttribute('draggable', 'true');
        }

        checkCompletion();
    }

    touchedPiece = null;
    lastTouchedSlot = null;
}

// Ovládání hudby
function startMusicOnInteraction() {
    if (!musicStarted) {
        backgroundMusic.play().then(() => {
            musicPlaying = true;
            musicStarted = true;
            updateMusicButton();
        }).catch(err => {
            console.log('Automatické přehrávání zablokováno:', err);
        });
    }
}

function toggleMusic() {
    if (!musicStarted) {
        // První spuštění hudby
        backgroundMusic.play().then(() => {
            musicPlaying = true;
            musicStarted = true;
            updateMusicButton();
        }).catch(err => {
            console.log('Přehrávání hudby selhalo:', err);
        });
    } else {
        // Přepínání hudby
        if (musicPlaying) {
            backgroundMusic.pause();
            musicPlaying = false;
        } else {
            backgroundMusic.play();
            musicPlaying = true;
        }
        updateMusicButton();
    }
}

function updateMusicButton() {
    if (musicPlaying) {
        musicBtn.innerHTML = '🔊 Hudba';
    } else {
        musicBtn.innerHTML = '🔇 Hudba';
    }
}

// Připojení tlačítka pro hudbu
musicBtn.addEventListener('click', toggleMusic);

// Spustit hudbu při první interakci s puzzle
document.addEventListener('click', startMusicOnInteraction, { once: true });

// Easter egg - double click na první dílek po dokončení
puzzleSlots.forEach(slot => {
    slot.addEventListener('dblclick', (e) => {
        // Aktivovat pouze pokud je puzzle dokončené a je to slot 0
        const puzzleGrid = document.getElementById('puzzleGrid');
        if (puzzleGrid.classList.contains('completed') && slot.dataset.position === '0') {
            easterEggOverlay.classList.add('show');
        }
    });
});

// Zavřít easter egg křížkem
closeEasterEggBtn.addEventListener('click', () => {
    easterEggOverlay.classList.remove('show');
});

// Zavřít easter egg kliknutím mimo obsah
easterEggOverlay.addEventListener('click', (e) => {
    if (e.target === easterEggOverlay) {
        easterEggOverlay.classList.remove('show');
    }
});

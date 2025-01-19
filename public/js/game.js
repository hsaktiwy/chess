// game.js
let board = null;
let game = new Chess();
let stockfish = new Worker('./lib/stockfish/src/stockfish-nnue-16-single.js');

// Initialize Stockfish
stockfish.postMessage('uci');
stockfish.postMessage('setoption name Skill Level value 20'); // Adjust AI strength (0-20)

// Stockfish message handler
stockfish.onmessage = function(event) {
    const message = event.data;
    console.log('Stockfish:', message);
    
    // Check for best move
    const moveMatch = message.match(/bestmove ([a-h][1-8][a-h][1-8])(q)?/);
    if (moveMatch) {
        const from = moveMatch[1].slice(0, 2);
        const to = moveMatch[1].slice(2, 4);
        const promotion = moveMatch[2] ? 'q' : undefined;

        // Make the AI move
        game.move({
            from: from,
            to: to,
            promotion: promotion
        });

        board.position(game.fen());
        updateStatus();
    }
};

function makeAIMove() {
    const difficulty = parseInt(document.getElementById('difficulty').value);
    
    // Set search depth based on difficulty
    const depth = difficulty === 1 ? 5 : 
                 difficulty === 2 ? 10 : 
                 15; // Level 3 (hard)
    
    // Send position to Stockfish
    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go depth ' + depth);
}

function onDragStart(source, piece, position, orientation) {
    // Allow the piece to be dragged only if:
    // 1. The game is not over
    // 2. It's the player's turn (white)
    // 3. The piece being dragged is the correct color
    if (game.isGameOver() ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function onDrop(source, target) {
    try {
        // Player move (white)
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q' // Always promote to queen for simplicity
        });

        // If illegal move, snap back
        if (move === null) return 'snapback';
        
        updateStatus();

        // Make AI move after a short delay
        if (!game.isGameOver()) {
            document.getElementById('status').textContent = 'AI is thinking...';
            setTimeout(makeAIMove, 250);
        }

    } catch (error) {
        console.error('Move error:', error);
        return 'snapback';
    }
}

function updateStatus() {
    let status = '';

    if (game.isCheckmate()) {
        status = 'Game over, ' + (game.turn() === 'w' ? 'black' : 'white') + ' wins by checkmate';
    } else if (game.isDraw()) {
        status = 'Game over, drawn position';
    } else {
        status = (game.turn() === 'w' ? 'White' : 'Black') + ' to move';
        if (game.isCheck()) {
            status += ', ' + (game.turn() === 'w' ? 'White' : 'Black') + ' is in check';
        }
    }

    document.getElementById('status').textContent = status;
}

function initGame() {
    const config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: () => board.position(game.fen())
    };
    board = Chessboard('board', config);
    updateStatus();
}

// Initialize the game when document is ready
$(document).ready(initGame);

// Add button event listeners
document.getElementById('startBtn').addEventListener('click', () => {
    game.reset();
    board.position('start');
    updateStatus();
});

document.getElementById('clearBtn').addEventListener('click', () => {
    game.clear();
    board.clear();
    updateStatus();
});

document.getElementById('undoBtn').addEventListener('click', () => {
    game.undo();
    if (game.turn() === 'b') {
        game.undo(); // Undo both player and AI moves
    }
    board.position(game.fen());
    updateStatus();
});

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
    stockfish.terminate();
});
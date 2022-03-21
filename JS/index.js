import { Game } from "./Game.js";
const icons = [
    {
        name: "bishop",
        white: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Chess_blt60.png",
        black: "https://upload.wikimedia.org/wikipedia/commons/8/81/Chess_bdt60.png"
    },
    {
        name: "king",
        white: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Chess_klt60.png",
        black: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Chess_kdt60.png"
    },
    {
        name: "knight",
        white: "https://upload.wikimedia.org/wikipedia/commons/2/28/Chess_nlt60.png",
        black: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Chess_ndt60.png"
    },
    {
        name: "pawn",
        white: "https://upload.wikimedia.org/wikipedia/commons/0/04/Chess_plt60.png",
        black: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Chess_pdt60.png"
    },
    {
        name: "queen",
        white: "https://upload.wikimedia.org/wikipedia/commons/4/49/Chess_qlt60.png",
        black: "https://upload.wikimedia.org/wikipedia/commons/a/af/Chess_qdt60.png"
    },
    {
        name: "rook",
        white: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Chess_rlt60.png",
        black: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Chess_rdt60.png"
    }
];
const main = document.querySelector('main');
const turnText = document.querySelector('section h1');
const turnImgs = document.querySelectorAll('section div img');
const turnSection = document.querySelector('.turn');
const restartSection = document.querySelector('.other');
const min = document.querySelector('.timer .min');
const sec = document.querySelector('.timer .sec');
/* */
const game = new Game(icons, main);
let swapTurn = game.swapTurn();
let turn = swapTurn.next().value;
const fields = game.draw_start();
game.addClick(fields, clickHandle);
game.startTimer(min, sec);
/* */
let move;
let currentField;
restartSection.children[0].addEventListener('click', () => {
    for (let x of document.body.children) {
        if (x.tagName === 'H2')
            x.remove();
    }
    main.style.pointerEvents = 'all';
    restartSection.style.display = 'none';
    turnSection.style.display = 'block';
    const ts = turnSection.children[1];
    for (let x of ts.children) {
        if (x.tagName === 'H1') {
            x.textContent = 'white';
            continue;
        }
        x.src = 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Chess_klt60.png';
        swapTurn = game.swapTurn();
        turn = swapTurn.next().value;
        game.restartGame();
        game.startTimer(min, sec);
    }
});
function clickHandle(dataset) {
    const { col, row } = dataset;
    if (!move || !currentField) {
        const moves = game.clickPath(col, row, turn);
        if (moves.length) {
            move = moves[0];
            currentField = moves[1];
        }
        return;
    }
    for (let x of move) {
        const col2 = parseInt(x.dataset.col);
        const row2 = parseInt(x.dataset.row);
        if (col === col2 && row === row2) {
            turn = swapTurn.next().value;
            turnText.textContent = turn;
            changeTurnIcons();
            game.movePiece(x, currentField.element);
            if (game.isKingDead()) {
                const t = turn === 'white' ? 'black' : 'white';
                displayFinish();
                game.finishPopUpText(t, restartSection);
                game.stopTimer();
            }
        }
        for (let y of Array.from(x.children)) {
            if (y.tagName !== 'SPAN')
                continue;
            y.remove();
        }
        if (currentField.element.style.background === 'rgb(14, 201, 151)') {
            currentField.element.style.background = currentField.background;
        }
    }
    move = null;
    currentField = null;
}
function changeTurnIcons() {
    for (let x of [...turnImgs]) {
        //@ts-ignore
        x.src = icons[1][turn];
    }
}
function displayFinish() {
    turnSection.style.display = 'none';
    main.style.pointerEvents = 'none';
    restartSection.style.display = 'flex';
}

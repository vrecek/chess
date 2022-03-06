import { Game } from "./Game.js"

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
]
const main = document.querySelector('main') as HTMLElement
const turnSection = document.querySelector('section') as HTMLElement
const turnText = document.querySelector('section h1') as HTMLElement
const turnImgs= document.querySelectorAll('section div img') as NodeListOf<HTMLElement>

/* */
const game = new Game(icons)

const swapTurn = game.swapTurn()
let turn:string = swapTurn.next().value

const fields = game.draw_start(main)
/* */

let move:Array<HTMLElement> | null
let currentField:any

game.addClick(fields, dataset => {
   const { col, row } = dataset
   
   if(!move || !currentField) {
      const moves = game.clickPath(col, row, turn)
      if(moves.length){
         move = moves[0]
         currentField = moves[1]
      }
      return
   }

   for(let x of move) {
      const col2 = parseInt(x.dataset.col!)
      const row2 = parseInt(x.dataset.row!)

      if(col === col2 && row === row2) {
         turn = swapTurn.next().value

         turnText.textContent = turn
         changeTurnIcons()

         game.movePiece(x, currentField.element)

         if(game.isKingDead(turn)){
            const t = turn === 'white' ? 'black' : 'white'
            turnSection.style.display = 'none'
            main.style.pointerEvents = 'none'

            game.finishText(t)
         }   
      }

      for(let y of Array.from(x.children)){
         if(y.tagName !== 'SPAN') continue
         y.remove()
      }

      currentField.element.style.background = currentField.background
   }
   move = null
   currentField = null
})

function changeTurnIcons():void{
   for(let x of [...turnImgs]){
      //@ts-ignore
      x.src = icons[1][turn]
   }
}



interface col_row_int {
   row: number,
   col: number
}

interface element_background {
   element: HTMLElement,
   background: string 
}

interface diagonal_sides {
   min: number,
   dir: string
}

interface appending_piece {
   img: HTMLElement | null,
   type: string | null
}

interface castling {
   white: {
      canDo: boolean, 
      kingMoved: boolean,
      leftRookMoved: boolean,
      rightRookMoved: boolean
   },

   black: {
      canDo: boolean, 
      kingMoved: boolean,
      leftRookMoved: boolean,
      rightRookMoved: boolean
   }
}

enum oppositeColor {
   black = 'white',
   white = 'black'
}

type PlayerColor = 'black' | 'white'

export class Game {
   private pawn:{ white: string, black: string } | undefined
   private rook:{ white: string, black: string } | undefined
   private knight:{ white: string, black: string } | undefined
   private bishop:{ white: string, black: string } | undefined
   private queen:{ white: string, black: string } | undefined
   private king:{ white: string, black: string } | undefined

   private field:Array<Array<HTMLElement>>
   private currentField:element_background | undefined
   private board:HTMLElement
   private restartCb:Function

   private check:any = {
      player_color: '',
      original_color: '',
      danger: false,
      king: null,
      enemyMoves: null,
      enemy: null
   }

   private castle:castling
   private timer:any
   private end:boolean = false

   //--- PRIVATE METHODS ---//

   private pathHelper(dir:string, col:number, row:number, whosTurn:'white' | 'black', arr:Array<HTMLElement>, dontSpan?:true):void{
      if(dir === 'horizontal') {
         for(let i = row-2, j = row; ; i--, j++){
            if(i < 0 && j > 7) break
            
            // LEFT
            left: if(i >= 0){
               const next = this.field[col - 1][i]

               if(this.collision('left', whosTurn, i, j, col, row)){
                  i = -1
                  break left
               }

               const span = document.createElement('span')               
               !dontSpan ? next.appendChild(span) : null

               arr.push(next) 
            }

            // RIGHT
            right: if(j <= 7){
               const next = this.field[col - 1][j]

               if(this.collision('right', whosTurn, i, j, col, row)){
                  j = 8
                  break right
               }

               const span = document.createElement('span')           
               !dontSpan ? next.appendChild(span) : null

               arr.push(next) 
            }
         }
      }     
      else if(dir === 'vertical') {
         for(let i = col-2, j = col; ; i--, j++){
            if(i < 0 && j > 7) break

            top: if(i >= 0){
               const next = this.field[i][row - 1]

               if(this.collision('top', whosTurn, i, j, col, row)){
                  i = -1
                  break top
               }

               const span = document.createElement('span')              
               !dontSpan ? next.appendChild(span) : null

               arr.push(next) 
            }

            bottom: if(j <= 7){
               const next = this.field[j][row - 1]

               if(this.collision('bottom', whosTurn, i, j, col, row)){
                  j = 8
                  break bottom
               }

               const span = document.createElement('span')           
               !dontSpan ? next.appendChild(span) : null

               arr.push(next)
            }
         }
      }
      else if(dir === 'diagonally') {
         const ar:Array<diagonal_sides> = [
            {v: col - 1, h: row - 1, d: 'lt'}, 
            {v: 8 - col, h: 8 - row, d: 'rb'}, 
            {v: col - 1, h: 8 - row, d: 'rt'}, 
            {v: 8 - col, h: row - 1, d: 'lb'}
         ].map(x => {
            return { min: Math.min(x.v, x.h), dir: x.d }
         })

         for(let x of ar){
            inner: for(let i = 1; i <= x.min; i++){
               let e:HTMLElement | null = null
               if(x.dir === 'lt') e = this.field[col - (i+1)][row - (i+1)]
               else if(x.dir === 'rb') e = this.field[col + (i-1)][row + (i-1)]
               else if(x.dir === 'rt') e = this.field[col - (i+1)][row + (i-1)]
               else if(x.dir === 'lb') e = this.field[col - -(i-1)][row - (i + 1)]
               else return

               const span = document.createElement('span')

               if(this.collision(x.dir, whosTurn, i, 0, col, row, arr, e, dontSpan)){
                  break inner
               }

               !dontSpan ? e.appendChild(span) : null
               arr.push(e)
            }
         }
      }
      else if(dir === 'jump_L' || dir === 'around'){
         let [rt, t, lt, l, lb, b, rb, r] = Array(8).fill(null)

         if(dir === 'jump_L'){
            if(col >= 3 && row >= 2) lt = this.field[col - 3][row - 2]
            if(col >= 3 && row <= 7) rt = this.field[col - 3][row]
            if(col <= 6 && row >= 2) lb = this.field[col + 1][row - 2]
            if(col <= 6 && row <= 7) rb = this.field[col + 1][row]

            if(col <= 7 && row <= 6) r = this.field[col][row + 1]
            if(col >= 2 && row <= 6) l = this.field[col - 2][row + 1]
            if(col <= 7 && row >= 3) t = this.field[col][row - 3]
            if(col >= 2 && row >= 3) b = this.field[col - 2][row - 3]

         }else if(dir === 'around'){
            if(row >= 2) l = this.field[col - 1][row - 2]
            if(row <= 7) r = this.field[col - 1][row]
            if(col >= 2) t = this.field[col - 2][row - 1]
            if(col <= 7) b = this.field[col][row - 1]

            if(col >= 2 && row >= 2) lt = this.field[col - 2][row - 2]
            if(col <= 7 && row >= 2) lb = this.field[col][row - 2]

            if(col >= 2 && row <= 7) rt = this.field[col - 2][row]
            if(col <= 7 && row <= 7) rb = this.field[col][row]
         }

         for(let x of [rt, t, lt, l, lb, b, rb, r]){
            if(!x) continue

            if(this.collision('onemove', whosTurn, 0, 0, col, row, arr, x)){
               continue
            }

            const span = document.createElement('span')
            !dontSpan ? x.appendChild(span) : null

            arr.push(x)
         }
      }
      else if(dir === 'pawn'){
         let [next, lt, rt]:any = [null, null, null]
 
         if(whosTurn === 'white'){
            col > 1 ? next = this.field[col - 2][row - 1] : null
            if(row > 1 && col > 1) lt = this.field[col - 2][row - 2]
            if(row < 8 && col > 1) rt = rt = this.field[col - 2][row]
         }
         else if(whosTurn === 'black'){
            col < 8 ? next = this.field[col][row - 1] : null
            if(col < 8 && row > 1) lt = this.field[col][row - 2]
            if(col < 8 && row < 8) rt = this.field[col][row]
         }    

         for(let x of [lt, next, rt].filter(x => x)){
            if(this.collision('pawn', whosTurn, 0, 0, col, row, arr, x, dontSpan)){
               continue
            }

            const span = document.createElement('span')
            !dontSpan ? x.appendChild(span) : null

            arr.push(x)
         }
      }
      else if(dir === 'castle'){
         const cf = this.field[col - 1][row - 1]

         if(!cf.classList.contains('king') || !this.castle[whosTurn].canDo) return

         let [left, right] = [true, true]
         for(let i = 1; i <= 6; i++){
            const field = this.field[col - 1][i]

            if(i < 4 && left){
               field.classList.length ? left = false : null
            }
            else if(i > 4 && right){
               field.classList.length ? right = false : null
            }
         }
         
         if(left && !this.castle[whosTurn].leftRookMoved){
            const place = this.field[col - 1][2]

            for(let x of place.children){
               x.remove()
            }

            if(!dontSpan){
               const span = document.createElement('span')
               place.appendChild(span)
            }

            const span = document.createElement('span')
            !dontSpan ? place.appendChild(span) : null
            
            arr.push(place)         
         }
         if(right && !this.castle[whosTurn].rightRookMoved){
            const place = this.field[col - 1][6]

            for(let x of place.children){
               x.remove()
            }

            const span = document.createElement('span')
            !dontSpan ? place.appendChild(span) : null
      
            arr.push(place)       
         }
      }
   }

   private collision
   (dir:string, turn:string, i:number, j:number, col:number, row:number, addArr?:Array<HTMLElement>, ele?:HTMLElement, dontSpan?:true)
   :boolean {
      switch(dir){
         case 'right':
            if((turn === 'white' && this.field[col - 1][j].classList.contains('white')) ||
               (turn === 'white' && this.field[col - 1][j - 1].classList.contains('black')) ||
               (turn === 'black' && this.field[col - 1][j].classList.contains('black')) ||
               (turn === 'black' && this.field[col - 1][j - 1].classList.contains('white')) 
            ){
               return true
            }
         return false

         case 'left':
            if(
               (turn === 'white' && this.field[col - 1][i].classList.contains('white')) ||
               (turn === 'white' && this.field[col - 1][i + 1].classList.contains('black')) ||
               (turn === 'black' && this.field[col - 1][i].classList.contains('black')) ||
               (turn === 'black' && this.field[col - 1][i + 1].classList.contains('white'))           
            ){
               return true
            }
         return false

         case 'top':
            if(
               (turn === 'white' && this.field[i][row - 1].classList.contains('white')) ||
               (turn === 'white' && this.field[i + 1][row - 1].classList.contains('black')) ||
               (turn === 'black' && this.field[i][row - 1].classList.contains('black')) || 
               (turn === 'black' && this.field[i + 1][row - 1].classList.contains('white'))           
            ){
               return true
            }
         return false

         case 'bottom':
            if(
               (turn === 'white' && this.field[j][row - 1].classList.contains('white')) ||
               (turn === 'white' && this.field[j - 1][row - 1].classList.contains('black')) ||
               (turn === 'black' && this.field[j][row - 1].classList.contains('black')) || 
               (turn === 'black' && this.field[j - 1][row - 1].classList.contains('white'))           
            ){
               return true
            }
         return false

         case 'pawn':
            if(!ele) return true

            if(turn === 'white' && ele === this.field[col - 2][row - 1] ||
               turn === 'black' && ele === this.field[col][row - 1])
            {
               const span = document.createElement('span')

               if(turn === 'white' && col === 7 && !this.field[col - 3][row - 1].classList.length && !ele.classList.length){
                  !dontSpan ? this.field[col - 3][row - 1].appendChild(span) : null
                  addArr?.push(this.field[col - 3][row - 1])

               }else if(turn === 'black' && col === 2 && !this.field[col + 1][row - 1].classList.length && !ele.classList.length){
                  !dontSpan ? this.field[col + 1][row - 1].appendChild(span) : null
                  addArr?.push(this.field[col + 1][row - 1])
               }
               
               return ele.classList.length ? true : false
            }

            const clist = [...ele.classList]
            if(clist.length){
               const canMove = clist.indexOf(turn) !== -1
               return canMove
            }
         return true    

         case 'rt': case 'lb': case 'rb': case 'lt':
            if(!ele) return false

            if((turn === 'white' && ele.classList.contains('white')) ||
               (turn === 'black' && ele.classList.contains('black')) 
            ){
               return true
            }

            if((turn === 'black' && ele.classList.contains('white')) ||
               (turn === 'white' && ele.classList.contains('black'))
            ){
               const span = document.createElement('span')
               !dontSpan ? ele.appendChild(span) : null
               addArr?.push(ele)
               return true
            }
         return false

         case 'onemove':
            if(!ele || ele.classList.contains(turn)) return true
         return false

         default: return false
      }    
   }

   private appendPiece(current:number):appending_piece {
      const img = document.createElement('img')
      let type:string = ''
      const clr = current < 32 ? 'black' : 'white'

      img.style.pointerEvents = 'none'

      if(current > 8 && current < 17 || current > 48 && current < 57){
         img.src = this.pawn![clr]
         return { img, type: 'pawn' }
      }

      switch(current){
         case 1: case 57: case 8: case 64:
            img.src = this.rook![clr]
            type = 'rook'
         break;

         case 2: case 58: case 7: case 63:
            img.src = this.knight![clr]
            type = 'knight'
         break;

         case 3: case 59: case 6: case 62:    
            img.src = this.bishop![clr]
            type = 'bishop'
         break;

         case 4: case 60:
            img.src = this.queen![clr]
            type = 'queen'
         break;

         case 5: case 61:
            img.src = this.king![clr]
            type = 'king'
         break;

         default: return { img: null, type: null }
      }  

      return { img, type }
   }

   private dataset_to_int(set:any):col_row_int {
      let obj = { col: 0, row: 0 }

      obj.col = parseInt(set?.col)
      obj.row = parseInt(set?.row)

      return obj
   }

   private createPath(current:HTMLElement, col:number, row:number, whosTurn:'white' | 'black', dontSpan?:true):Array<HTMLElement>{
      let possibleMoves:Array<HTMLElement> = []

      switch(current.classList[0]){
         case 'rook':
            this.pathHelper('horizontal', col, row, whosTurn, possibleMoves, dontSpan)
            this.pathHelper('vertical', col, row, whosTurn, possibleMoves, dontSpan)
         break;

         case 'pawn':   
            this.pathHelper('pawn', col, row, whosTurn, possibleMoves, dontSpan) 
         break

         case 'queen':
            this.pathHelper('horizontal', col, row, whosTurn, possibleMoves, dontSpan)
            this.pathHelper('vertical', col, row, whosTurn, possibleMoves, dontSpan)
            this.pathHelper('diagonally', col, row, whosTurn, possibleMoves, dontSpan)
         break

         case 'bishop':
            this.pathHelper('diagonally', col, row, whosTurn, possibleMoves, dontSpan)
         break

         case 'knight':
            this.pathHelper('jump_L', col, row, whosTurn, possibleMoves, dontSpan)
         break

         case 'king':
            this.pathHelper('around', col, row, whosTurn, possibleMoves, dontSpan)
            this.pathHelper('castle', col, row, whosTurn, possibleMoves, dontSpan)
         break

         default: return []
      }
      
      return possibleMoves
   }

   private king_check_place(currField:HTMLElement):void{
      const [, clr] = currField.classList
      const oppClr = oppositeColor[clr as PlayerColor]

      const currFields = this.field.reduce( (p, c) => p.concat(c) ).filter(x => x.classList.contains(clr))
      const enemyFields = this.field.reduce( (p, c) => p.concat(c) ).filter(x => x.classList.contains(oppClr))

      // CURRENT, GO FOR CHECK
      for(let x of currFields){
         const [col, row] = Object.values(x.dataset).map(x => parseInt(x!))

         const f = this.createPath(this.field[col - 1][row - 1], col, row, clr as PlayerColor, true)
         
         for(let y of f){
            if(y.className === `king ${oppClr}`){
               const c = this.check

               c.player_color = oppClr
               c.original_color = y.style.background
               c.danger = true
               c.king = y
               c.enemyMoves = f
               c.enemy = this.field[col - 1][row - 1]

               y.style.background = 'red'

               this.finishCheck(enemyFields, oppClr)

               return
            }
         }
      }
   }

   private isEnemy(field:HTMLElement):boolean{
      for(let x of field.children){
         if(x.tagName === 'IMG' && field.classList.length === 2){
            return true
         }
      }
      
      return false
   }

   private checkHandle(moves:Array<HTMLElement>, c:any, turn:PlayerColor, f:HTMLElement):void{
      const arr = [...c.enemyMoves]
      let canClr = false

      // AFTER CLICK
      if(f.classList.contains('king')){
            for(let x of [...moves]){
               const prevClass = x.className
               const cKingClass = c.king.className

               x.className = cKingClass
               c.king.className = ''
               

               const [e_col, e_row] = Object.values(c.enemy.dataset).map((x:any) => parseInt(x!))
               const enemyMoves = this.createPath(c.enemy, e_col, e_row, oppositeColor[turn], true)

               for(let y of enemyMoves){
                  if(y.className === `king ${turn}`){
                     while(x.children.length){
                        x.children[0].remove()
                     }
                     const ind = moves.indexOf(x)
                     moves.splice(ind, 1)

                     continue
                  }
               }

               x.className = prevClass
               c.king.className = cKingClass

               continue
            }
      }else{
            for(let x of [...moves]){
               if(x === c.enemy) continue

               if( !arr.includes(x) ){
                  for(let i=0; i<=x.children.length; i++){
                     const ch = x.children
                     if(ch[i]?.tagName === 'SPAN') ch[i].remove()

                     const ind = moves.indexOf(x)
                     moves.splice(ind, 1)
                  }
                  continue
               }
                       
               x.classList.add(oppositeColor[turn])

               const [e_col, e_row] = Object.values(c.enemy.dataset).map((x:any) => parseInt(x!))
               const enemyMoves = this.createPath(c.enemy, e_col, e_row, oppositeColor[turn], true)

               x.classList.remove(oppositeColor[turn])

               if(!enemyMoves.includes(c.king)) canClr = true

               if(enemyMoves.includes(c.king)){
                  const ind = moves.indexOf(x)
                  moves.splice(ind, 1) 

                  for(let i=0; i<=x.children.length; i++){
                     const ch = x.children
                     if(ch[i]?.tagName === 'SPAN') ch[i].remove()
                  }
               }      
            }
      }
   }

   private movePreventCheck(moves:Array<HTMLElement>, turn:PlayerColor, cf:HTMLElement):void{
      const enemies = this.field.reduce((p, c) => p.concat(c)).filter(x => x.classList.contains(oppositeColor[turn]))
      const set:Set<HTMLElement> = new Set()
      const prevClass = cf.className

      let len = moves.length

      while(len--){
         const m = moves[len]

         const pc = m.className

         cf.className = ''
         m.className = prevClass

         const king = this.field.reduce((p, c) => p.concat(c)).filter(x => x.className === `king ${turn}`)[0]

         for(let x of enemies){
            const [col, row] = Object.values(x.dataset).map(x => parseInt(x!))
            const enemyMoves = this.createPath(x, col, row, oppositeColor[turn], true)

            for(let y of enemyMoves){
               if(y.className === `king ${turn}`){
                  set.add(moves[len])    

               }else if(y === king){
                  const ind = moves.indexOf(moves[len])

                  const span = [...moves[len].children].filter(x => x.tagName === 'SPAN')[0]
                  span.remove()
                  moves.splice(ind, 1)        
               }     
            }
         }

         m.className = pc
         cf.className = prevClass
      }

      for(let x of set){
         const ind = moves.indexOf(x as HTMLElement)

         if(moves[ind]?.children){
            const span = [...moves[ind].children].filter(x => x.tagName === 'SPAN')
            span.length ? span[0].remove() : null
         }
         
         moves.splice(ind, 1)
      }
   }

   public finishCheck(checked_king_pieces:Array<HTMLElement>, checked_king_clr:PlayerColor){
      let availableMoves = []

      for(let x of checked_king_pieces){
         const [col, row] = Object.values(x.dataset).map(x => parseInt(x!))
         
         const x1 = this.createPath(x, col, row, checked_king_clr, true)
         this.checkHandle(x1, this.check, checked_king_clr, x)
         this.movePreventCheck(x1, checked_king_clr, x)

         if(x1.length){
            availableMoves.push(x1)
            break
         }
      }

      availableMoves.length ? null : this.end = true
   }



   //--- PUBLIC METHODS ---//



   public constructor(white_and_black_array:Array<{ name: string, white: string, black: string }>, field:HTMLElement) {
      for(let x of white_and_black_array){    
         switch(x.name){
            case "pawn": this.pawn = { white: x.white, black: x.black }   
            break;

            case "rook": this.rook = { white: x.white, black: x.black }      
            break;

            case "knight": this.knight = { white: x.white, black: x.black }
            break;

            case "bishop": this.bishop = { white: x.white, black: x.black }         
            break;

            case "queen": this.queen = { white: x.white, black: x.black }         
            break;

            case "king": this.king = { white: x.white, black: x.black }        
            break;

            default: continue
         }
      }

      if(!this.pawn || !this.rook || !this.knight || !this.bishop || !this.queen || !this.king){
         throw new Error('Not all fields are initialized, check if "name" starts with non capital letter')
      }

      this.board = field
      this.restartCb = () => {}
      this.field = [
         [], [], [], [], [], [], [], []
      ]
      this.castle = {
         white:{
            canDo: true,
            kingMoved: false,
            leftRookMoved: false,
            rightRookMoved: false
         },
         black: {
            canDo: true, 
            kingMoved: false,
            leftRookMoved: false,
            rightRookMoved:false
         }
      }
   }

   public *swapTurn():Generator<string> {
      let turn:string = 'black'
      while(true){
         turn = oppositeColor[turn as PlayerColor]
         yield turn
      }
   }

   public draw_start():Array<HTMLElement> {
      let actual = 0

      for(let i = 1; i <= 8; i++){
         const col:boolean = i % 2 === 0
   
         for(let j = 1; j <= 8; j++){
            ++actual

            const field:boolean = j % 2 === 0    
            const div:HTMLElement = document.createElement('div')

            const { img, type } = this.appendPiece(actual)
            if(img){
               div.appendChild(img)
               div.classList.add(type!)
               div.classList.add(actual > 16 ? 'white' : 'black')
            }
             
            div.setAttribute("data-col", i.toString())
            div.setAttribute("data-row", j.toString())
   
            if(col){
               div.style.background = field ? 'sandybrown' : 'saddlebrown'
   
            }else{
               div.style.background = field ? 'saddlebrown' : 'sandybrown'
            }

            this.field[i-1].push(div)

            this.board.appendChild(div)
         }
      }
      
      return this.field.reduce( (p, c) => p.concat(c) )
   }

   public addClick(arrayElements:Array<HTMLElement>, callback:Function) {  
      for(let x of arrayElements){
         x.addEventListener('click', (e:Event) => {      
            const t = e.target as HTMLElement

            callback( this.dataset_to_int({ ...t.dataset }) )
         })
      }

      this.restartCb = callback
   }

   public clickPath(col:number, row:number, turn:PlayerColor):Array<any> {
      const f = this.field[col - 1][row - 1]

      if(f.classList.contains(turn)){
         this.currentField = {
            element: f,
            background: f.style.background
         }
         
         const moves = this.createPath(f, col, row, turn)

         const c = this.check
         if(c.danger){
            this.checkHandle(moves, c, turn, f)
         }
 
         this.movePreventCheck(moves, turn, f)

         moves.length ? f.style.background = '#0ec997' : null

         return [moves, this.currentField]
      }

      return []
   }

   public movePiece(moveTo:HTMLElement, current:HTMLElement):void{
      if(this.isEnemy(moveTo)){
         while(moveTo.children.length){
            moveTo.children[0].remove()
         }
      }

      if(this.check.danger){
         const c = this.check

         c.king.style.background = c.original_color

         c.player_color = null
         c.original_color = null
         c.danger = null
         c.king = null
         c.enemyMoves = null
         c.enemy = null
      }

      /*------------------------------- CASTLING -------------------------------*/

      const classlist = [...current.classList]
      const pieceType = classlist.filter(x => x !== 'white' && x !== 'black').toString()
      const pieceColor:PlayerColor = classlist.filter(x => x === 'white' || x === 'black').toString() as PlayerColor
      const rookSide = parseInt(current.dataset.row!) > 4 ? 'right' : 'left'

      // @ts-ignore
      if(pieceType === 'rook' && !this.castle[pieceColor][`${rookSide}RookMoved`]){
         // @ts-ignore
         this.castle[pieceColor][`${rookSide}RookMoved`] = true

         if(this.castle[pieceColor].leftRookMoved && this.castle[pieceColor].rightRookMoved){
            this.castle[pieceColor].canDo = false
         }
      }

      if(pieceType === 'king' && !this.castle[pieceColor].kingMoved){
         const nextRow = parseInt(moveTo.dataset.row!)

         if(this.castle[pieceColor].canDo && (nextRow === 7 || nextRow === 3 ) ){
            const currCol = parseInt(current.dataset.col!)
            const currRow = parseInt(current.dataset.row!)

            const rook = nextRow === 3 ? this.field[currCol - 1][0] : this.field[currCol - 1][7]
            const rookFieldTo = nextRow === 3 ? this.field[currCol - 1][currRow - 2] : this.field[currCol - 1][currRow]

            this.movePiece(rookFieldTo, rook)
         }

         this.castle[pieceColor].kingMoved = true
         this.castle[pieceColor].canDo = false
      }

      /*------------------------------- ^^^ CASTLING ^^^ -------------------------------*/

      const [c_type, c_clr] = current.classList

      const img = document.createElement('img')
      // @ts-ignore 
      img.src = this[c_type][c_clr]    
      moveTo.appendChild(img)
      moveTo.className = `${c_type} ${c_clr}`

      while(current.children.length){
         current.children[0].remove()
      }
      current.className = ''

      this.king_check_place(moveTo)
   }

   public isKingDead():boolean{
      return this.end
   }

   public finishPopUpText(turn:PlayerColor, element:HTMLElement, styleClass?:string):void{
      const h2 = document.createElement('h2')
      const img = document.createElement('img')

      if(styleClass){
         h2.classList.add(styleClass)
      }

      img.src = this.king![turn]

      h2.appendChild(img)
      h2.appendChild(document.createTextNode('WIN'))
      h2.classList.add(turn)

      element.appendChild(h2)
   }

   public restartGame():void{
      while(this.board.children.length){
         this.board.children[0].remove()
      }

      this.field = [
         [], [], [], [], [], [], [], []
      ]

      const arr = this.draw_start()
      this.addClick(arr, this.restartCb)

      this.end = false

      this.check = {
         player_color: '',
         original_color: '',
         danger: false,
         king: null,
         enemyMoves: null,
         enemy: null
      }
   }

   public startTimer(minutes:HTMLElement, seconds:HTMLElement):void{
      let m = 0
      let s = 0
      minutes.textContent = '00'
      seconds.textContent = '00'

      this.timer = setInterval(() => {
         if(s >= 59){
            m += 1
            s = -1
         }

         s += 1
         const sec = `0${s.toString()}`.slice(-2)
         const min = `0${m.toString()}`.slice(-2)

         minutes.textContent = min
         seconds.textContent = sec
      }, 1000)
   }

   public stopTimer():void{
      clearInterval(this.timer)
   }

}
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

export class Game {
   private pawn:{ white: string, black: string } | undefined
   private rook:{ white: string, black: string } | undefined
   private knight:{ white: string, black: string } | undefined
   private bishop:{ white: string, black: string } | undefined
   private queen:{ white: string, black: string } | undefined
   private king:{ white: string, black: string } | undefined

   private field:Array<Array<HTMLElement>> = [
      [], [], [], [], [], [], [], []
   ]
   private currentField:element_background | undefined

   //--- PRIVATE METHODS ---//

   private pathHelper(dir:string, col:number, row:number, whosTurn:any, arr:Array<HTMLElement>):void{
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
               next.appendChild(span)
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
               next.appendChild(span)
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
               next.appendChild(span)
               arr.push(next) 
            }

            bottom: if(j <= 7){
               const next = this.field[j][row - 1]

               if(this.collision('bottom', whosTurn, i, j, col, row)){
                  j = 8
                  break bottom
               }

               const span = document.createElement('span')           
               next.appendChild(span)
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

               if(this.collision(x.dir, whosTurn, i, 0, col, row, arr, e)){
                  break inner
               }

               e.appendChild(span)
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
            x.appendChild(span)
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
            if(this.collision('pawn', whosTurn, 0, 0, col, row, arr, x)){
               continue
            }

            const span = document.createElement('span')
            x.appendChild(span)
            arr.push(x)
         }
      }
   }

   private collision
   (dir:string, turn:string, i:number, j:number, col:number, row:number, addArr?:Array<HTMLElement>, ele?:HTMLElement)
   :boolean | Array<HTMLElement> {
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
                  this.field[col - 3][row - 1].appendChild(span)
                  addArr?.push(this.field[col - 3][row - 1])

               }else if(turn === 'black' && col === 2 && !this.field[col + 1][row - 1].classList.length && !ele.classList.length){
                  this.field[col + 1][row - 1].appendChild(span)
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
               ele.appendChild(span)
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

   private createPath(current:HTMLElement, col:number, row:number, whosTurn:string){
      let possibleMoves:Array<HTMLElement> = []

      switch(current.classList[0]){
         case 'rook':
            this.pathHelper('horizontal', col, row, whosTurn, possibleMoves)
            this.pathHelper('vertical', col, row, whosTurn, possibleMoves)
         break;

         case 'pawn':   
            this.pathHelper('pawn', col, row, whosTurn, possibleMoves) 
         break

         case 'queen':
            this.pathHelper('horizontal', col, row, whosTurn, possibleMoves)
            this.pathHelper('vertical', col, row, whosTurn, possibleMoves)
            this.pathHelper('diagonally', col, row, whosTurn, possibleMoves)
         break

         case 'bishop':
            this.pathHelper('diagonally', col, row, whosTurn, possibleMoves)
         break

         case 'knight':
            this.pathHelper('jump_L', col, row, whosTurn, possibleMoves)
         break

         case 'king':
            this.pathHelper('around', col, row, whosTurn, possibleMoves)
         break

         default: return []
      }

      possibleMoves.length ? current.style.background = '#0ec997' : null
      
      return possibleMoves
   }

   private isEnemy(field:HTMLElement):boolean{
      for(let x of field.children){
         if(x.tagName === 'IMG' && field.classList.length === 2){
            return true
         }
      }
      
      return false
   }

   //--- PUBLIC METHODS ---//

   public constructor(white_and_black_array:Array<{ name: string, white: string, black: string }>) {
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
   }

   public *swapTurn():Generator<string> {
      let turn:string = 'black'
      while(true){
         turn = turn === 'black' ? 'white' : 'black'
         yield turn
      }
   }

   public draw_start(container:HTMLElement):Array<HTMLElement> {
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

            container.appendChild(div)
         }
      }
      
      return this.field.reduce( (p, c) => p.concat(c) )
   }

   public addClick(arrayElements:Array<HTMLElement>, callback:(dataset:col_row_int) => void) {   
      for(let x of arrayElements){
         x.addEventListener('click', (e:Event) => {      
            const t = e.target as HTMLElement
            
            callback( this.dataset_to_int({ ...t.dataset }) )
         })
      }
   }

   public clickPath(col:number, row:number, turn:string):Array<any> {
      const f = this.field[col - 1][row - 1]
      
      if(f.classList.contains(turn)){
         this.currentField = {
            element: f,
            background: f.style.background
         }
         
         const moves = this.createPath(f, col, row, turn)

         return [moves, this.currentField]
      }

      return []
   }

   public movePiece(moveTo:HTMLElement, current:HTMLElement){
      if(this.isEnemy(moveTo)){
         while(moveTo.children.length){
            moveTo.children[0].remove()
         }
      }

      const [c_type, c_clr] = current.classList

      moveTo.className = `${c_type} ${c_clr}`
      const img = document.createElement('img')
      // @ts-ignore 
      img.src = this[c_type][c_clr]    
      moveTo.appendChild(img)

      while(current.children.length){
         current.children[0].remove()
      }
      current.className = ''
   }

   public isKingDead(turn:string):boolean{
      const reducedField = this.field.reduce( (p, c) => p.concat(c) ).map(x => x.classList.value)

      for(let x of reducedField){
         if(x === `king ${turn}`) return false
      }

      return true
   }

   public finishText(turn:string, styleClass?:string){
      const h2 = document.createElement('h2')
      const img = document.createElement('img')

      if(styleClass){
         h2.classList.add(styleClass)
      }

      // @ts-ignore
      img.src = this.king![turn]

      h2.appendChild(img)
      h2.appendChild(document.createTextNode('WIN'))
      h2.classList.add(turn)

      document.body.appendChild(h2)
   }

}
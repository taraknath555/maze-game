const {Engine,Render,Runner,World,Bodies,Body,Events} = Matter

//Boilerplate
const height = window.innerHeight
const width = window.innerWidth
const cellsHorizontal = 14
const cellsVertical  = 16

const engine = Engine.create()
const {world} = engine
world.gravity.y = 0
const render = Render.create({
  element : document.body,
  engine,
  options : {
    height, 
    width,
    wireframes : false
  }
})
const runner = Runner.create()
Render.run(render)
Runner.run(runner,engine)

//Borders
const borders = [
  Bodies.rectangle(width/2,0,width,2,{isStatic:true}),
  Bodies.rectangle(width/2,height,width,2,{isStatic:true}),
  Bodies.rectangle(0,height/2,2,height,{isStatic:true}),
  Bodies.rectangle(width,height/2,2,height,{isStatic:true})
]
World.add(world,borders)


//**************************
//MAZE ALGORITHM
//**************************

const unitLengthX = width / cellsHorizontal
const unitLengthY = height / cellsVertical
const grid = Array(cellsVertical)
  .fill(null)
  .map((each) => Array(cellsHorizontal).fill(false))

const horizontals = Array(cellsVertical-1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false))

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal-1).fill(false))

const startRow = Math.floor(Math.random() * cellsVertical)
const startCol = Math.floor(Math.random() * cellsHorizontal)

//suffle function
const suffle = arr => {
  let randIdx,temp;
  for(let i=arr.length-1; i>0; i--){
    randIdx = Math.floor(Math.random() * i);
    
    //Swapping Logic
    temp = arr[i]
    arr[i] = arr[randIdx]
    arr[randIdx] = temp
  }
  return arr
}

//Step ot cells function
const stepThroughCell = (row,col) => {
  //Return if cell s already visited
  if(grid[row][col]) return

  //mark the cell to visited
  grid[row][col] = true

  //find neighbors
  const neighbors = suffle([
    [row-1, col, 'up'],
    [row+1, col, 'down'],
    [row, col-1, 'left'],
    [row, col+1, 'right']
  ])

  for(let neighbor of neighbors){
    const [nextRow,nextCol,direction] = neighbor
    
    //for non existing neighbors
    if(nextRow < 0 || nextRow >= cellsVertical || nextCol < 0 || nextCol >= cellsHorizontal) continue

    //if already visited
    if(grid[nextRow][nextCol]) continue

    //updating horizontal & veryical walls
    if(direction === 'up'){
      horizontals[row-1][col] = true
    }else if(direction === 'down'){
      horizontals[row][col] = true
    }else if(direction === 'left'){
      verticals[row][col-1] = true
    }else if(direction === 'right'){
      verticals[row][col] = true
    }
    stepThroughCell(nextRow,nextCol)
  }
};
stepThroughCell(startRow,startCol)

//creating Horizontal walls
horizontals.forEach((row,rowIdx) => {
  row.forEach((open,colIdx) => {
    if(open) return
    const hWall = Bodies.rectangle(
      colIdx * unitLengthX + unitLengthX/2,
      rowIdx * unitLengthY + unitLengthY,
      unitLengthX,
      5,
      {
        label : 'wall',
        isStatic : true,
        render : {
          fillStyle : 'red'
        }
      }
    );
    World.add(world,hWall)
  });
});

//creating Vertical walls
verticals.forEach((row,rowIdx) => {
  row.forEach((open,colIdx) => {
    if(open) return
    const vWall = Bodies.rectangle(
      colIdx * unitLengthX + unitLengthX,
      rowIdx * unitLengthY + unitLengthY/2,
      5,
      unitLengthY,
      {
        label : 'wall',
        isStatic : true,
        render : {
          fillStyle : 'red'
        }
      }
    )
    World.add(world,vWall)
  })
})

//creating Goal
const goal = Bodies.rectangle(
  width - unitLengthX/2,
  height - unitLengthY/2,
  0.7 * unitLengthX,
  0.7 * unitLengthY,
  {
    label : 'goal',
    isStatic : true,
    render : {
      fillStyle : 'green'
    }
  }
)
World.add(world,goal)

//creating Ball
const ballRadius = Math.min(unitLengthX,unitLengthY) / 3
const ball = Bodies.circle(
  unitLengthX/2,
  unitLengthY/2,
  ballRadius,
  {
    label : 'ball',
    render : {
      fillStyle : 'blue'
    }
  }
)
World.add(world,ball)

//Adding keypress event
document.addEventListener('keydown',(event) => {
  const code = event.keyCode
  const {x,y} = ball.velocity
  if(code === 38){
    Body.setVelocity(ball,{x,y:y-5})
  }else if(code === 40){
    Body.setVelocity(ball,{x,y:y+5})
  }else if(code === 37){
    Body.setVelocity(ball,{x:x-5,y})
  }else if(code === 39){
    Body.setVelocity(ball,{x:x+5,y})
  }
})

//Detecting win
Events.on(engine,'collisionStart',(event) => {
  event.pairs.forEach(collision => {
    const labels = ['ball','goal'];
    if(labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)){
      document.querySelector('.winner').classList.remove('hidden');
      world.gravity.y = 1
      world.bodies.forEach(body => {
        if(body.label === 'wall'){
          Body.setStatic(body,false)
        }
      })
    }
  })
})
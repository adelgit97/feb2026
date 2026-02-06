/*************************
 * CONFIG & COLOR PALETTE
 *************************/
const CONFIG = {
  canvasWidth: 500,
  canvasHeight: 550,
  gravity: 0.6,
  jumpStrength: -10,
  pipeWidth: 60,
  pipeGap: 150,
  pipeDistance: 250,
  totalPipes: 20,
  velocityX: 2,
  scoreMessageDelay: 500, // ms

};

// WIN WALL
CONFIG.winWall = {
  width: 200,
  height: CONFIG.canvasHeight, // full height
  color: "rgba(255,255,255,0.3)", // semi-transparent
  borderColor: "#000",
  borderStyle: "2px dotted",
  message: "fine you win... bye :("
};


const pipe_rim = new Image();
pipe_rim.src = "Mario_pipe.png";

const pipe_body = new Image();
pipe_body.src = "pipe_body.png";

const carimg = new Image();
carimg.src = "car-solid.png";

const bgImg = new Image();
bgImg.src = "sky2.png";

let deathCount = 0;

const DEATH_MESSAGES = [
  "Oof, maybe just quit go on the date",
  "Isn't this game harder than saying yes? 😉",
  "You're really stubborn… just like your date! 😈",
  "Come on, quit playing and enjoy the day 😜",
  "Have you tried idk jumping... ",
  "Another crash… maybe take a hint? ❤️",
  "This car can’t save you, only I can 😏",
  "Are you avoiding the date, or just bad at jumping? 😅",
  "Wow, again? Maybe the date will be easier than this 😈",
  "Keep going? Or just admit defeat and join me 😌",
  "Really now, that bad huh?",
  "Well, I am almost out of messages. Should have integrated an AI bot you're so stubborn!",
  "And with a premium subscription at this rate…",
  "Yeah yeah bla bla, still going… snarky message… bla bla",
  "Wow, again? Nahhh I am out. No more messages, enjoy the pain 😛",
  "😛",
  "😛",
  "....",
  "I will just loop the messages before the browser is out of memory 😅"
];



let deathMessageIndex = 0;
let gameState = "welcome"; 

/*************************
 * ELEMENTS
 *************************/
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const jumpBtn = document.getElementById('jump-btn');
const messageEl = document.getElementById('message');

canvas.width = CONFIG.canvasWidth;
canvas.height = CONFIG.canvasHeight;

/*************************
 * GAME STATE
 *************************/
let bird, pipes, score, gameOver, gameStarted;
let lastMessageTime = 0;

function initGame() {
  bird = { x: 80, y: CONFIG.canvasHeight/2, radius: 15, velocity: 0 };
  pipes = [];
  score = 0;
  gameOver = false;
  lastMessageTime = 0;
  gameStarted = false;

  for (let i = 0; i < CONFIG.totalPipes; i++) {
    const topHeight = 50 + Math.random() * (CONFIG.canvasHeight - CONFIG.pipeGap - 100);
    pipes.push({
      x: CONFIG.canvasWidth + i * CONFIG.pipeDistance,
      top: topHeight,
      bottom: CONFIG.canvasHeight - topHeight - CONFIG.pipeGap,
      passed: false
    });
  }
    // Win wall position (right after last pipe)
    CONFIG.winWall.x = pipes[pipes.length - 1].x + CONFIG.pipeDistance;
    CONFIG.winWall.y = 0;


  messageEl.textContent = "Press Jump btn / Space bar / touch game screen(phone) to Start!";
  draw(); // draw initial state
}

/*************************
 * DRAW FUNCTIONS
 *************************/

function drawBird() {

  //circle
  // ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bird-color'); ctx.beginPath();
  // ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI*2); 
  // ctx.fill();

  //or image
  const imgWidth = bird.radius * 2; 
  const imgHeight = bird.radius * 2;

   const visualRadius = bird.radius * 2;
  const size = visualRadius * 2;

  ctx.drawImage(
    carimg,
    bird.x - visualRadius, 
    bird.y - visualRadius, 
    size,
    size
  );

}


function drawPipes() {
  const rimHeight = 40; // fixed rim size

  pipes.forEach(pipe => {
    // --- TOP PIPE ---
    const topBodyHeight = pipe.top - rimHeight;

    // Draw top body (from canvas top down to start of rim)
    ctx.drawImage(
      pipe_body,
      pipe.x,
      0,
      CONFIG.pipeWidth,
      topBodyHeight
    );

    // Draw top rim at **bottom of top pipe** (above gap), flipped
    ctx.save();
    ctx.translate(pipe.x + CONFIG.pipeWidth / 2, topBodyHeight + rimHeight / 2);
    ctx.scale(1, -1); // flip vertically
    ctx.drawImage(
      pipe_rim,
      -CONFIG.pipeWidth / 2,
      -rimHeight / 2,
      CONFIG.pipeWidth,
      rimHeight
    );
    ctx.restore();

    // --- BOTTOM PIPE ---
    const bottomBodyHeight = pipe.bottom - rimHeight;

    // Draw bottom rim at top of bottom pipe (below gap)
    ctx.drawImage(
      pipe_rim,
      pipe.x,
      CONFIG.canvasHeight - pipe.bottom,
      CONFIG.pipeWidth,
      rimHeight
    );

    // Draw bottom body below rim
    ctx.drawImage(
      pipe_body,
      pipe.x,
      CONFIG.canvasHeight - pipe.bottom + rimHeight,
      CONFIG.pipeWidth,
      bottomBodyHeight
    );
  });
}


function drawScore() {
   ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--score-color') || "#000";
  ctx.font = "24px Arial";
  ctx.textAlign = "left"; // make sure it's left-aligned
  ctx.textBaseline = "top"; // align top
  ctx.fillText("Score: " + score + "/"+ CONFIG.totalPipes, 15, 15); // 15px padding from top-left
}

/*************************
 * UPDATE GAME
 *************************/
function update() {
  if (gameState !== "playing") return;

  if (!gameStarted || gameOver) return;

  // Bird physics
  bird.velocity += CONFIG.gravity;
  bird.y += bird.velocity;

  // Move pipes and check collisions
  pipes.forEach(pipe => {
    pipe.x -= CONFIG.velocityX;

    // Score
    if (!pipe.passed && bird.x > pipe.x + CONFIG.pipeWidth) {
      score++;
      pipe.passed = true;

    //   const now = Date.now();
    //   if (now - lastMessageTime > CONFIG.scoreMessageDelay) {
    //     const msg = CONFIG.messages[Math.floor(Math.random() * CONFIG.messages.length)];
    //     messageEl.textContent = msg;
    //     lastMessageTime = now;
    //   }
    }

    // Collision with pipes
    if (bird.x + bird.radius > pipe.x &&
        bird.x - bird.radius < pipe.x + CONFIG.pipeWidth &&
        (bird.y - bird.radius < pipe.top || bird.y + bird.radius > CONFIG.canvasHeight - pipe.bottom)) {
      endGame();
    }
  });

  // Move win wall with pipes (scrolling effect)
  CONFIG.winWall.x -= CONFIG.velocityX;

  // Win detection
  if (bird.x + bird.radius > CONFIG.winWall.x) {
    gameOver = true;
    messageEl.textContent = `you won... I guess. Here is your score, ${score}. Hope it was worth it`;
  }

  // Collision with canvas top/bottom
  if (bird.y + bird.radius > CONFIG.canvasHeight || bird.y - bird.radius < 0) {
    endGame();
  }
}

function drawWinWall() {
  ctx.fillStyle = CONFIG.winWall.color;
  ctx.fillRect(CONFIG.winWall.x, CONFIG.winWall.y, CONFIG.winWall.width, CONFIG.canvasHeight);

  ctx.strokeStyle = CONFIG.winWall.borderColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([6,6]); // dotted border
  ctx.strokeRect(CONFIG.winWall.x, CONFIG.winWall.y, CONFIG.winWall.width, CONFIG.canvasHeight);
  ctx.setLineDash([]);

  // draw message centered
  ctx.fillStyle = "#000";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(CONFIG.winWall.message, CONFIG.winWall.x + CONFIG.winWall.width/2, CONFIG.canvasHeight/2);
}

function drawBackground() {
  ctx.drawImage(bgImg, 0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
}
function drawDeaths() {
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--score-color') || "#fff";
  ctx.font = "18px Arial";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(`Deaths: ${deathCount}`, CONFIG.canvasWidth - 15, 15);
}


/*************************
 * DRAW GAME
 *************************/
function draw() {
  ctx.clearRect(0,0,CONFIG.canvasWidth,CONFIG.canvasHeight);
  drawBackground();
  drawPipes();
  drawBird();
  drawScore();
  drawDeaths(); 
  drawWinWall(); // <--- new
}
function getNextDeathMessage() {
  const msg = DEATH_MESSAGES[deathMessageIndex];
  deathMessageIndex = (deathMessageIndex + 1) % DEATH_MESSAGES.length;
  return msg;
}

/*************************
 * GAME LOOP
 *************************/
function loop() {
  update();
  draw();
  if (gameStarted && !gameOver) requestAnimationFrame(loop);
}

/*************************
 * GAME CONTROL
 *************************/
function jump() {  
  if (gameState !== "playing") return;


  if (!gameStarted) {
    gameStarted = true;
    messageEl.textContent = "";
   document.getElementById("death-modal").classList.add("hidden");
    loop();
  }

  if (gameOver) {
    document.getElementById("death-modal").classList.add("hidden");
    initGame();
    gameStarted = true;
    gameState = "playing";
    messageEl.textContent = "";
    loop();
  }

  bird.velocity = CONFIG.jumpStrength;
}

function endGame() {
//   gameOver = true;
   messageEl.textContent = `Game Over! Score: ${score} - Press Jump btn / Space bar / touch game screen(phone) to Restart`;
    gameOver = true;
  deathCount++;

  const modal = document.getElementById("death-modal");
  const msgEl = document.getElementById("death-message");

  msgEl.textContent = getNextDeathMessage();
  modal.classList.remove("hidden");
}

const modal = document.getElementById("death-modal");
const giveUpBtn = document.getElementById("give-up-btn");
const keepGoingBtn = document.getElementById("keep-going-btn");

function dismissModal() {
  modal.classList.add("hidden");
}

//giveUpBtn.addEventListener("click", dismissModal); // end screen also 

giveUpBtn.addEventListener("click", () => {
  dismissModal();
  showEndScreen();
});


keepGoingBtn.addEventListener("click", dismissModal);

/*************************
 * EVENT LISTENERS
 *************************/
document.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});

jumpBtn.addEventListener("click", jump);

/*************************
 * INITIAL STATE
 *************************/
initGame();


const welcomeScreen = document.getElementById("welcome-screen");
const optionCurious = document.getElementById("option-curious");
const optionPlay = document.getElementById("option-play");

optionCurious.addEventListener("click", () => {
  
  showEndScreen();
});

optionPlay.addEventListener("click", () => {
  welcomeScreen.style.display = "none";
  const modal = document.getElementById("death-modal");
  const msgEl = document.getElementById("death-message");

  msgEl.textContent = "Not so easy buddy 😈.";
  modal.classList.remove("hidden");
  gameState = "playing";
});

function showEndScreen() {
  gameState = "end";

  const welcome = document.getElementById("welcome-screen");
  welcome.style.display = "flex";

  // Hide buttons
  document.querySelector(".welcome-actions").style.display = "none";
  
  const imageElement =  document.getElementById("welcomeimg");

  // Set the new source (can be a relative path or an absolute URL)
  imageElement.src = "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExenNqNDJmdjRuZHNpM29rMnQ2OWYzdHc3OWNzaWZvZTA0bmNwcWF5NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/HHzBaXsra2MHciRNQr/giphy.gif";

  
  // Change text (optional but recommended)

  welcome.querySelector("p").textContent =
    "See you at 1 pm dear ❤️";
}

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  jump();
}, { passive: false });
canvas.addEventListener("click", e => {
  e.preventDefault();
  jump();
}, { passive: false });

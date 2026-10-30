const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

// إعدادات اللعبة
let score = 0;
let highScore = localStorage.getItem('brick_breaker_highscore') || 0;
highScoreEl.innerText = highScore;

let gameOver = false;
let gameWon = false;

// إعدادات المضرب (Paddle)
const paddle = {
    width: 100,
    height: 15,
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    speed: 7,
    dx: 0
};

// إعدادات الكرة (Ball)
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 45,
    radius: 8,
    speed: 5,
    dx: 4,
    dy: -4
};

// إعدادات الطوب (Bricks)
const brickRowCount = 5;
const brickColumnCount = 6;
const brickPadding = 10;
const brickOffsetTop = 40;
const brickOffsetLeft = 20;
const brickWidth = (canvas.width - (brickOffsetLeft * 2) - (brickPadding * (brickColumnCount - 1))) / brickColumnCount;
const brickHeight = 20;

const brickColors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8'];

let bricks = [];

function createBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1, color: brickColors[r] };
        }
    }
}

// التحكم عبر الكيبورد
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Right') paddle.dx = paddle.speed;
    else if (e.key === 'ArrowLeft' || e.key === 'Left') paddle.dx = -paddle.speed;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'ArrowLeft' || e.key === 'Left') {
        paddle.dx = 0;
    }
});

// التحكم عبر اللمس والماوس
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
});

canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.touches[0].clientX - rect.left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
    e.preventDefault();
}, { passive: false });

// رسم المضرب
function drawPaddle() {
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.closePath();
}

// رسم الكرة
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.closePath();
}

// رسم الطوب
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                ctx.beginPath();
                ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 4);
                ctx.fillStyle = bricks[c][r].color;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// فحص التصادم مع الطوب
function collisionDetection() {
    let activeBricks = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                activeBricks++;
                if (
                    ball.x > b.x &&
                    ball.x < b.x + brickWidth &&
                    ball.y > b.y &&
                    ball.y < b.y + brickHeight
                ) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    scoreEl.innerText = score;

                    if (score > highScore) {
                        highScore = score;
                        highScoreEl.innerText = highScore;
                        localStorage.setItem('brick_breaker_highscore', highScore);
                    }
                }
            }
        }
    }

    if (activeBricks === 0 && !gameWon) {
        gameWon = true;
        endGame(true);
    }
}

// تحديث حركة العناصر
function move() {
    // تحريك المضرب
    paddle.x += paddle.dx;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;

    // تحريك الكرة
    ball.x += ball.dx;
    ball.y += ball.dy;

    // التصادم مع الجدران الجانبية
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }

    // التصادم مع السقف
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }

    // التصادم مع المضرب
    if (
        ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
    ) {
        // تسريع الكرة قليلاً وزيادة الزاوية
        ball.dy = -ball.speed;
        let collidePoint = ball.x - (paddle.x + paddle.width / 2);
        ball.dx = collidePoint * 0.15;
    }

    // السقوط في الأسفل (خسارة)
    if (ball.y + ball.radius > canvas.height) {
        endGame(false);
    }
}

// إنهاء اللعبة
function endGame(isWin) {
    gameOver = true;
    overlay.classList.remove('hidden');
    if (isWin) {
        overlayTitle.innerText = "🎉 مبروك! فزت باللعبة";
        overlayTitle.style.color = "#4ade80";
    } else {
        overlayTitle.innerText = "💥 انتهت اللعبة!";
        overlayTitle.style.color = "#f43f5e";
    }
    finalScoreEl.innerText = `مجموع نقاطك: ${score}`;
}

// اعادة التشغيل
function resetGame() {
    score = 0;
    scoreEl.innerText = score;
    gameOver = false;
    gameWon = false;
    paddle.x = canvas.width / 2 - 50;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 45;
    ball.dx = 4;
    ball.dy = -4;
    createBricks();
    overlay.classList.add('hidden');
    draw();
}

// الحلقة الرئيسية للعبة (Game Loop)
function draw() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();
    move();

    requestAnimationFrame(draw);
}

restartBtn.addEventListener('click', resetGame);

// بدء اللعبة
createBricks();
draw();

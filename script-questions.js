const questionText = document.getElementById('question-text');
const questionImage = document.getElementById('question-image');
const optionsContainer = document.getElementById('options-container');
const scoreEl = document.getElementById('score');
const feedbackEl = document.getElementById('feedback');
const questionTimerCircleText = document.getElementById(
  'question-timer-circle-text'
);
const endGameBtn = document.getElementById('end-game-btn');
const qrImage = document.getElementById('qr-image');

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let questionTimeLeft = 20;
let questionTimerInterval;
let acceptingAnswers = false;

/**
 * Utility to show a centered feedback "card" overlay with an icon.
 * isCorrect: boolean - true for correct (green check), false for incorrect (red X)
 * message: string - text to display
 * duration: ms to auto-hide (optional, default 1500)
 */
function showFeedbackCard(isCorrect, message, duration = 2000) {
  const checkSvg =
    '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const crossSvg =
    '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const color = isCorrect ? '#28a745' : '#dc3545';
  const cardHtml = `
    <div class="feedback-card" role="status" aria-live="polite" style="
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255,255,255,0.98);
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.18);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 520px;
    justify-content: center;
    z-index: 9999;
    ">
    <div class="feedback-icon" style="color: ${color}; display:flex; align-items:center; justify-content:center;">
    ${isCorrect ? checkSvg : crossSvg}
    </div>
    <div class="feedback-text" style="font-weight: 600; color: #222; font-size: 26px;">
    ${message}
    </div>
    </div>
  `;

  feedbackEl.innerHTML = cardHtml;

  if (duration > 0) {
    setTimeout(() => {
      feedbackEl.innerHTML = '';
    }, duration);
  }
}

async function loadQuestions() {
  try {
    const response = await fetch('assets/data/questions-level-1.json');
    questions = await response.json();
  } catch (error) {
    console.error(error);
    showFeedbackCard(false, 'Error al cargar las preguntas.', 3000);
  }
}

function startGame() {
  score = 0;
  currentQuestionIndex = 0;
  scoreEl.textContent = score;
  loadQuestion();
  startQuestionTimer();
  acceptingAnswers = true;
}

function startQuestionTimer() {
  questionTimeLeft = 20;
  questionTimerCircleText.textContent = questionTimeLeft;

  if (questionTimerInterval) {
    clearInterval(questionTimerInterval);
  }

  questionTimerInterval = setInterval(() => {
    questionTimeLeft--;
    questionTimerCircleText.textContent = questionTimeLeft;
    if (questionTimeLeft <= 0) {
      clearInterval(questionTimerInterval);
      acceptingAnswers = false;
      showFeedbackCard(false, 'Tiempo agotado!', 2500);
      setTimeout(() => {
        nextQuestion();
      }, 1500);
    }
  }, 1000);
}

function loadQuestion() {
  if (currentQuestionIndex >= questions.length) {
    endGame();
    return;
  }

  const currentQuestion = questions[currentQuestionIndex];
  questionText.textContent = currentQuestion.question;
  questionImage.src = currentQuestion.image;
  questionImage.alt = currentQuestion.alt || 'Imagen de la pregunta';

  qrImage.src = currentQuestion.qr_code;
  qrImage.alt = `Código QR para la pregunta ${currentQuestion.id}`;

  optionsContainer.innerHTML = '';
  currentQuestion.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.classList.add('option-btn');
    button.textContent = option;
    button.addEventListener('click', () => selectAnswer(index));
    optionsContainer.appendChild(button);
  });

  feedbackEl.innerHTML = '';
  acceptingAnswers = true;
}

function selectAnswer(selectedIndex) {
  if (!acceptingAnswers) return;
  acceptingAnswers = false;

  const currentQuestion = questions[currentQuestionIndex];
  const correctIndex = currentQuestion.answer;

  const buttons = optionsContainer.querySelectorAll('button');
  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === correctIndex) {
      button.classList.add('correct');
    } else if (index === selectedIndex) {
      button.classList.add('incorrect');
    }
  });

  if (selectedIndex === correctIndex) {
    score++;
    scoreEl.textContent = score;
    showFeedbackCard(true, '¡Correcto!', 1500);
  } else {
    showFeedbackCard(false, 'Incorrecto.', 6500);
  }

  clearInterval(questionTimerInterval);

  setTimeout(() => {
    nextQuestion();
  }, 1500);
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex >= questions.length) {
    endGame();
  } else {
    loadQuestion();
    startQuestionTimer();
  }
}

function endGame() {
  clearInterval(questionTimerInterval);
  acceptingAnswers = false;
  localStorage.setItem('finalScore', score);
  window.location.href = 'conclusion.html';
}

const questionTimerCircle = document.getElementById('question-timer-circle');

questionTimerCircle.addEventListener('click', () => {
  endGame();
});

questionTimerCircle.addEventListener('keypress', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    endGame();
  }
});

window.addEventListener('load', async () => {
  await loadQuestions();
  startGame();
});

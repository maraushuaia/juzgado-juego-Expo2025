const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");
const questionText = document.getElementById("question-text");
const questionImage = document.getElementById("question-image");
const optionsContainer = document.getElementById("options-container");
const mainTimerEl = document.getElementById("main-timer");
const scoreEl = document.getElementById("score");
const feedbackEl = document.getElementById("feedback");
const finalScoreEl = document.getElementById("final-score");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let mainTimeLeft = 150;
let questionTimeLeft = 15;
let mainTimerInterval;
let questionTimerInterval;
let acceptingAnswers = false;

async function loadQuestions() {
  try {
    const response = await fetch("assets/data/questions.json");
    questions = await response.json();
  } catch (error) {
    alert("Error al cargar las preguntas.");
    console.error(error);
  }
}

function startGame() {
  score = 0;
  currentQuestionIndex = 0;
  mainTimeLeft = 150;
  questionTimeLeft = 15;
  scoreEl.textContent = `Puntaje: ${score}`;
  mainTimerEl.textContent = `${mainTimeLeft}s`;
  startScreen.classList.remove("active");
  endScreen.classList.remove("active");
  gameScreen.classList.add("active");
  loadQuestion();
  startMainTimer();
  startQuestionTimer();
}

function startMainTimer() {
  mainTimerInterval = setInterval(() => {
    mainTimeLeft--;
    mainTimerEl.textContent = `${mainTimeLeft}s`;
    if (mainTimeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function startQuestionTimer() {
  questionTimeLeft = 15;
  // Update textual timer (keeps backward compatibility)
  questionTimerEl.textContent = `Pregunta: ${questionTimeLeft}s`;

  // Animate a circular SVG timer (expects an SVG circle with id="question-timer-circle"
  // and a text element with id="question-timer-circle-text" in the DOM)
  const QUESTION_DURATION = 15;
  // Ensure we always reset to the full duration when starting
  questionTimeLeft = QUESTION_DURATION;

  const questionTimerCircleText = document.getElementById(
    "question-timer-circle-text"
  );
  const questionTimerCircle = document.getElementById("question-timer-circle");

  if (questionTimerCircleText) {
    questionTimerCircleText.textContent = questionTimeLeft;
  }
  if (questionTimerCircle) {
    // Initialize circle stroke for animation
    const radius = questionTimerCircle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    questionTimerCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    // Start with full circle (no offset)
    questionTimerCircle.style.strokeDashoffset = 0;
    // Smooth linear transition per second
    questionTimerCircle.style.transition = "stroke-dashoffset 1s linear";
    // store circumference for later use
    questionTimerCircle.dataset.circumference = circumference;
  }

  if (questionTimerInterval) {
    clearInterval(questionTimerInterval);
  }

  questionTimerInterval = setInterval(() => {
    questionTimeLeft--;
    // Update textual timer
    questionTimerEl.textContent = `Pregunta: ${questionTimeLeft}s`;
    // Update circle text
    if (questionTimerCircleText) {
      questionTimerCircleText.textContent = questionTimeLeft;
    }
    // Update circle stroke offset to reflect remaining time
    if (questionTimerCircle && questionTimerCircle.dataset.circumference) {
      const circumference = Number(questionTimerCircle.dataset.circumference);
      const percent = Math.max(0, questionTimeLeft) / QUESTION_DURATION;
      const offset = circumference * (1 - percent);
      questionTimerCircle.style.strokeDashoffset = offset;
    }

    if (questionTimeLeft <= 0) {
      clearInterval(questionTimerInterval);
      // Show incorrect feedback for timeout
      if (typeof showFeedback === "function") {
        showFeedback(false);
      }
      nextQuestion();
    }
  }, 1000);
}

function loadQuestion() {
  acceptingAnswers = true;
  feedbackEl.textContent = "";
  const currentQuestion = questions[currentQuestionIndex];
  questionText.textContent = currentQuestion.questionText;
  questionImage.src = currentQuestion.imagePath;
  questionImage.alt = `Imagen pregunta ${currentQuestionIndex + 1}`;
  optionsContainer.innerHTML = "";

  // Start/reset the question timer whenever a new question is loaded
  // This ensures startGame and nextQuestion (which call loadQuestion) will start the timer.
  if (typeof startQuestionTimer === "function") {
    startQuestionTimer();
  }

  currentQuestion.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.classList.add("option-btn");
    button.textContent = option;
    button.dataset.index = index;
    button.addEventListener("click", selectAnswer);
    optionsContainer.appendChild(button);
  });
}

function selectAnswer(e) {
  if (!acceptingAnswers) return;
  acceptingAnswers = false;
  clearInterval(questionTimerInterval);

  const selectedBtn = e.target;
  const selectedIndex = parseInt(selectedBtn.dataset.index);
  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex;

  if (isCorrect) {
    score++;
    scoreEl.textContent = `Puntaje: ${score}`;
  }

  Array.from(optionsContainer.children).forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === currentQuestion.correctAnswerIndex) {
      btn.classList.add("correct");
    } else if (btn === selectedBtn && !isCorrect) {
      btn.classList.add("incorrect");
    }
  });

  showFeedback(isCorrect);

  setTimeout(() => {
    nextQuestion();
  }, 1500);
}

function showFeedback(isCorrect) {
  if (isCorrect) {
    feedbackEl.textContent = "¡Correcto!";
    feedbackEl.className = "feedback correct show";
  } else {
    feedbackEl.textContent = "¡Incorrecto!";
    feedbackEl.className = "feedback incorrect show";
  }

  setTimeout(() => {
    feedbackEl.classList.remove("show");
  }, 1500);
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex >= questions.length || mainTimeLeft <= 0) {
    endGame();
  } else {
    loadQuestion();
    startQuestionTimer();
  }
}

function endGame() {
  clearInterval(mainTimerInterval);
  clearInterval(questionTimerInterval);
  gameScreen.classList.remove("active");
  endScreen.classList.add("active");
  finalScoreEl.textContent = `Tu puntaje es ${score} de ${questions.length}`;
}

startBtn.addEventListener("click", async () => {
  await loadQuestions();
  startGame();
});

restartBtn.addEventListener("click", () => {
  startScreen.classList.add("active");
  endScreen.classList.remove("active");
});

const endGameBtn = document.getElementById("end-game-btn");

endGameBtn.addEventListener("click", () => {
  clearInterval(mainTimerInterval);
  clearInterval(questionTimerInterval);

  score = 0;
  currentQuestionIndex = 0;
  mainTimeLeft = 90;
  questionTimeLeft = 9;

  gameScreen.classList.remove("active");
  endScreen.classList.remove("active");
  startScreen.classList.add("active");
});

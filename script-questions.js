// Mejorar estilos del texto de feedback para respuestas incorrectas

const questionText = document.getElementById("question-text");
const questionImage = document.getElementById("question-image");
const optionsContainer = document.getElementById("options-container");
const scoreEl = document.getElementById("score");
const feedbackEl = document.getElementById("feedback");
const questionTimerCircleText = document.getElementById(
  "question-timer-circle-text"
);
const endGameBtn = document.getElementById("end-game-btn");
const qrImage = document.getElementById("qr-image");
// Nuevo elemento para el overlay de atenuación y el confeti/lluvia
const screenOverlay = document.getElementById("screen-overlay");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let questionTimeLeft = 20;
let questionTimerInterval;
let acceptingAnswers = false;

// Rutas a las imágenes de feedback
const CORRECT_IMAGE_PATH = "/assets/images-logos/imagen-feliz.png";
const INCORRECT_IMAGE_PATH = "/assets/images-logos/imagen-triste.png";

/**
 * Utility to show a centered feedback "card" overlay with an image and message.
 * isCorrect: boolean - true for correct (happy image, confetti), false for incorrect (sad image, dim screen, rain)
 * message: string - text to display (optional, mainly for showing the correct answer on incorrect)
 * duration: ms to auto-hide (optional, default 2000)
 */
function showFeedbackCard(isCorrect, message = "", duration = 6000) {
  // Limpiar cualquier efecto anterior
  screenOverlay.className = "screen-overlay";
  feedbackEl.innerHTML = "";

  // 1. Aplicar efectos de pantalla según el resultado
  if (isCorrect) {
    // Guirnaldas/Confeti
    screenOverlay.classList.add("confetti-effect");
  } else {
    // Atenuar la pantalla y efecto de lluvia
    screenOverlay.classList.add("dim-screen");
    screenOverlay.classList.add("rain-effect");
  }

  // 2. Crear el contenido de la tarjeta de feedback
  const imagePath = isCorrect ? CORRECT_IMAGE_PATH : INCORRECT_IMAGE_PATH;
  const altText = isCorrect
    ? "Icono de respuesta correcta"
    : "Icono de respuesta incorrecta";

  // Contenido adicional para la versión incorrecta
  const messageHtml = message
    ? `<div class="feedback-text-message" style="
         font-weight: 700; 
         color: #d32f2f; 
         font-size: 24px; 
         text-align: center; 
         margin-top: 16px;
         text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
         background: rgba(255,255,255,0.9);
         padding: 12px 20px;
         border-radius: 8px;
         border: 3px solid #d32f2f;
         box-shadow: 0 4px 12px rgba(211,47,47,0.2);
         max-width: 90%;
         line-height: 1.4;
       ">
         ${message}
       </div>`
    : "";

  const cardHtml = `
    <div class="feedback-card" role="status" aria-live="polite" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(237, 221, 83, 1);
      padding: 20px 30px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      min-width: 300px; 
      justify-content: center;
      z-index: 9999;
    ">
      <div class="feedback-image" style="width: 720px; height: 720px;">
        <img src="${imagePath}" alt="${altText}" style="width: 100%; height: 100%; object-fit: contain;">
      </div>
      ${messageHtml} 
    </div>
  `;

  feedbackEl.innerHTML = cardHtml;

  // 3. Ocultar la tarjeta y remover los efectos
  if (duration > 0) {
    setTimeout(() => {
      feedbackEl.innerHTML = "";
      screenOverlay.className = "screen-overlay"; // Limpia todos los efectos
    }, duration);
  }
}

async function loadQuestions() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const levelFile =
      urlParams.get("level") || "assets/data/questions-level-1.json";
    const response = await fetch(levelFile);
    questions = await response.json();
  } catch (error) {
    console.error(error);
    showFeedbackCard(false, "Error al cargar las preguntas.", 3000);
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
      showFeedbackCard(false, "¡Tiempo agotado!", 2500);
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
  questionImage.alt = currentQuestion.alt || "Imagen de la pregunta";

  qrImage.src = currentQuestion.qr_code;
  qrImage.alt = `Código QR para la pregunta ${currentQuestion.id}`;

  optionsContainer.innerHTML = "";
  currentQuestion.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.classList.add("option-btn");
    button.textContent = option;
    button.addEventListener("click", () => selectAnswer(index));
    optionsContainer.appendChild(button);
  });

  feedbackEl.innerHTML = "";
  screenOverlay.className = "screen-overlay"; // Asegurar que no hay efectos al cargar
  acceptingAnswers = true;
}

function selectAnswer(selectedIndex) {
  if (!acceptingAnswers) return;
  acceptingAnswers = false;

  const currentQuestion = questions[currentQuestionIndex];
  const correctIndex = currentQuestion.answer;
  const correctAnswerText = currentQuestion.options[correctIndex];

  const buttons = optionsContainer.querySelectorAll("button");
  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === correctIndex) {
      button.classList.add("correct");
    } else if (index === selectedIndex) {
      button.classList.add("incorrect");
    }
  });

  const durationCorrect = 2500; // Aumentamos la duración para disfrutar el confeti
  const durationIncorrect = 6500;
  let delayBeforeNext;

  if (selectedIndex === correctIndex) {
    score++;
    scoreEl.textContent = score;
    // Efecto Confeti
    showFeedbackCard(true, "", durationCorrect);
    delayBeforeNext = durationCorrect;
  } else {
    // Efecto Dim Screen + Lluvia + Respuesta Correcta
    const message = `La respuesta correcta era:<br><span style="font-weight: 800; font-size: 30px; color: #d32f2f;">${correctAnswerText}</span>`;
    showFeedbackCard(false, message, durationIncorrect);
    delayBeforeNext = durationIncorrect;
  }

  clearInterval(questionTimerInterval);

  setTimeout(() => {
    nextQuestion();
  }, delayBeforeNext);
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
  localStorage.setItem("finalScore", score);
  window.location.href = "conclusion.html";
}

const questionTimerCircle = document.getElementById("question-timer-circle");

questionTimerCircle.addEventListener("click", () => {
  endGame();
});

questionTimerCircle.addEventListener("keypress", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    endGame();
  }
});

// Función para establecer el fondo según el nivel seleccionado
function setBackgroundByLevel() {
  const urlParams = new URLSearchParams(window.location.search);
  const levelFile =
    urlParams.get("level") || "assets/data/questions-level-1.json";

  // Determinar el nivel basado en el archivo de preguntas
  let backgroundImage;
  if (levelFile.includes("level-1")) {
    backgroundImage = "/assets/images-logos/imagen-back-game-inicial.webp";
  } else if (levelFile.includes("level-2")) {
    backgroundImage = "/assets/images-logos/imagen-back-game-medio.webp";
  } else {
    // Fallback a la imagen del nivel inicial
    backgroundImage = "/assets/images-logos/imagen-back-game-inicial.webp";
  }

  // Aplicar la imagen de fondo al body
  document.body.style.backgroundImage = `url('${backgroundImage}')`;
  console.log(
    `Fondo establecido para nivel: ${levelFile} -> ${backgroundImage}`
  );
}

window.addEventListener("load", async () => {
  setBackgroundByLevel(); // Establecer el fondo según el nivel
  await loadQuestions();
  startGame();
});

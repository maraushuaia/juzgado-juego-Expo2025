// ==========================================================
// DECLARACIÓN DE VARIABLES Y ELEMENTOS
// ==========================================================

const questionText = document.getElementById("question-text");
const questionImage = document.getElementById("question-image");
const optionsContainer = document.getElementById("options-container");
const scoreEl = document.getElementById("score");
const feedbackEl = document.getElementById("feedback");
const questionTimerCircleText = document.getElementById(
  "question-timer-circle-text"
);
const qrImage = document.getElementById("qr-image");
// Elemento para el overlay de atenuación y efectos
const screenOverlay = document.getElementById("screen-overlay");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let questionTimeLeft = 30;
let questionTimerInterval;
let acceptingAnswers = false;

// Rutas a las imágenes de feedback
const CORRECT_IMAGE_PATH = "/assets/images-logos/imagen-feliz.png";
const INCORRECT_IMAGE_PATH = "/assets/images-logos/imagen-triste.png";

// ==========================================================
// FUNCIONES DE UTILIDAD Y FEEDBACK
// ==========================================================

/**
 * Utility to show a centered feedback "card" overlay with an image and message.
 * Utiliza las clases CSS: .feedback-card, .feedback-image, .feedback-text-message
 */
function showFeedbackCard(isCorrect, message = "", duration = 4000) {
  // Limpiar cualquier efecto anterior
  screenOverlay.className = "screen-overlay";
  feedbackEl.innerHTML = "";

  // 1. Aplicar efectos de pantalla según el resultado
  if (isCorrect) {
    screenOverlay.classList.add("dim-screen");
    screenOverlay.classList.add("confetti-effect");
    createConfetti();
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

  // Contenido adicional para la versión incorrecta (usa la clase CSS .feedback-text-message)
  const messageHtml = message
    ? `<div class="feedback-text-message">
             ${message}
           </div>`
    : "";

  const cardHtml = `
      <div class="feedback-card" role="status" aria-live="polite">
        <div class="feedback-image">
          <img src="${imagePath}" alt="${altText}">
        </div>
        ${messageHtml}
      </div>
    `;

  feedbackEl.innerHTML = cardHtml;

  // 3. Ocultar la tarjeta y remover los efectos
  if (duration > 0) {
    setTimeout(() => {
      feedbackEl.innerHTML = "";
      screenOverlay.className = "screen-overlay";

      // Eliminar cualquier confeti que pudiera quedar en el DOM
      const existingConfetti = screenOverlay.querySelectorAll(".confetti");
      existingConfetti.forEach((confetti) => confetti.remove());
    }, duration);
  }
}

/**
 * Función para crear elementos confeti dinámicamente con efecto de ráfagas
 */
function createConfetti() {
  // Limpiar confeti anterior
  const existingConfetti = screenOverlay.querySelectorAll(".confetti");
  existingConfetti.forEach((confetti) => confetti.remove());

  // Crear múltiples ráfagas
  for (let burst = 0; burst < 6; burst++) {
    setTimeout(() => {
      createBurst(screenOverlay, burst);
    }, burst * 150);
  }
}

function createBurst(container, burstIndex) {
  const particleCount = 30;

  for (let i = 0; i < particleCount; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";

    // Posición inicial aleatoria
    const isLeft = Math.random() < 0.5;
    const startX = isLeft
      ? Math.random() * 20 + 10 // 10-30% desde la izquierda
      : Math.random() * 20 + 70; // 70-90% desde la izquierda

    const startY = Math.random() * 20 + 10; // 10-30% desde arriba

    confetti.style.left = startX + "%";
    confetti.style.top = startY + "%";

    // Añadir clase de animación
    confetti.classList.add(isLeft ? "left-burst" : "right-burst");

    // Delay aleatorio para efecto más natural
    confetti.style.animationDelay = Math.random() * 0.5 + "s";

    // Duración aleatoria
    confetti.style.animationDuration = Math.random() * 1 + 2.5 + "s";

    container.appendChild(confetti);

    // Activar animación
    setTimeout(() => {
      confetti.classList.add("active");
    }, 10);
  }
}

// ==========================================================
// FUNCIONES DE JUEGO (CARGA, TIEMPO, RESPUESTA)
// ==========================================================

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
  questionTimeLeft = 30;
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

  // qrImage.src = currentQuestion.qr_code;
  // qrImage.alt = `Código QR para la pregunta ${currentQuestion.id}`;

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

  // Guardar la respuesta del usuario en el objeto de la pregunta (para el envío en endGame)
  currentQuestion.userAnswer = selectedIndex;

  const buttons = optionsContainer.querySelectorAll("button");
  buttons.forEach((button, index) => {
    button.disabled = true;
    if (index === correctIndex) {
      button.classList.add("correct");
    } else if (index === selectedIndex) {
      button.classList.add("incorrect");
    }
  });

  const durationCorrect = 2500;
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
    const message = `La respuesta correcta era:<br><span class="feedback-text-message-correct-answer">${correctAnswerText}</span>`;
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

// ==========================================================
// FUNCIÓN DE FINALIZACIÓN Y MODAL (ACTUALIZADA)
// ==========================================================

function endGame() {
  acceptingAnswers = false;
  localStorage.setItem("finalScore", score);

  // Contenido del modal (¡ACTUALIZADO CON .form-row y .form-column!)
  const modalHtml = `
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title">DATOS DEL JUGADOR</h2>
            
            <label for="player-name">Nombre:</label>
            <input type="text" id="player-name" name="player-name" required />
            
            <div class="form-row">
                <div class="form-column">
                    <label for="player-age">Edad:</label>
                    <input type="number" id="player-age" name="player-age" min="1" max="120" required />
                </div>
                
                <div class="form-column">
                    <label for="player-gender">Género:</label>
                    <select id="player-gender" name="player-gender" required>
                        <option value="">Seleccione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                        <option value="Prefiero no decir">Prefiero no decir</option>
                    </select>
                </div>
            </div>
            <label for="player-school">Escuela:</label>
            <input type="text" id="player-school" name="player-school" required />
            
            <div class="modal-actions">
                <button id="submit-player-data">Enviar</button>                
            </div>
        </div>
    `;

  // Crear o reutilizar overlay (utiliza el ID #modal-overlay del CSS)
  let overlay = document.getElementById("modal-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "modal-overlay";
    document.body.appendChild(overlay);
  }

  // Ocultar #feedback si existe para que no bloquee la interacción del modal
  const feedbackEl = document.getElementById("feedback");
  if (feedbackEl) {
    feedbackEl.style.display = "none";
  }

  // El #modal-overlay obtendrá sus estilos de CSS.
  overlay.style.display = "flex";

  const contentWrapper = document.createElement("div");
  contentWrapper.innerHTML = modalHtml;

  // Colocar el contenido en el overlay
  overlay.innerHTML = "";
  overlay.appendChild(contentWrapper.firstElementChild);

  // Para accesibilidad, mover el foco al primer campo
  const firstInput = overlay.querySelector("#player-name");
  if (firstInput) {
    firstInput.focus();
  }

  // Los botones submit/skip deben ser re-obtenidos ya que se inyectaron de nuevo
  const submitBtn = document.getElementById("submit-player-data");
  const skipBtn = document.getElementById("skip-player-data");

  const closeAndFinish = () => {
    // Al cerrar, reestablece el display del overlay
    overlay.style.display = "none";
    overlay.innerHTML = "";

    // Vuelve a mostrar el feedback (por si se necesita)
    if (feedbackEl) {
      feedbackEl.style.display = "";
    }

    window.location.href = "conclusion.html";
  };

  submitBtn.addEventListener("click", () => {
    const name = document.getElementById("player-name").value.trim();
    const ageVal = document.getElementById("player-age").value;
    const age = ageVal ? parseInt(ageVal, 10) : null;
    const gender = document.getElementById("player-gender").value;
    const school = document.getElementById("player-school").value.trim();

    if (!name || !age || !gender || !school) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    const playerData = { name, age, gender, school, score };

    // Recolectar las respuestas del jugador
    const playerAnswers = questions.map((q, index) => {
      const given = q.userAnswer ?? null;
      const correct =
        typeof q.answer !== "undefined" ? q.answer === given : null;
      return {
        questionId: q.id ?? index + 1,
        answerGiven: given,
        correct: correct,
      };
    });

    // Enviar datos al backend
    fetch("save_player_data.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playerData, playerAnswers }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data && data.success) {
          alert("Gracias por jugar. Sus datos han sido registrados.");
          closeAndFinish();
        } else {
          alert("Error al guardar los datos. Intente nuevamente.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error de conexión. Intente nuevamente.");
      });
  });

  skipBtn.addEventListener("click", () => {
    closeAndFinish();
  });
}

// ==========================================================
// LISTENERS Y CONFIGURACIÓN INICIAL
// ==========================================================

const questionTimerCircle = document.getElementById("question-timer-circle");

// Asegúrate de que este elemento exista en tu HTML, si no, estos listeners darán error.
if (questionTimerCircle) {
  questionTimerCircle.addEventListener("click", () => {
    endGame();
  });

  questionTimerCircle.addEventListener("keypress", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      endGame();
    }
  });
}

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

// Mejorar estilos del texto de feedback para respuestas incorrectas

const questionText = document.getElementById("question-text");
const questionImage = document.getElementById("question-image");
const optionsContainer = document.getElementById("options-container");
const scoreEl = document.getElementById("score");
const feedbackEl = document.getElementById("feedback");
const questionTimerCircleText = document.getElementById(
  "question-timer-circle-text"
);
const endGameBtn = document.getElementById("end-game-btn"); // Parece no usarse, considera eliminar si no es necesario.
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
const INCORRECT_IMAGE_PATH = "/assets/images-logos/imagen-triste.png"; // Corregido: .wep a .webp

/**
 * Utility to show a centered feedback "card" overlay with an image and message.
 * isCorrect: boolean - true for correct (happy image, confetti), false for incorrect (sad image, dim screen, rain)
 * message: string - text to display (optional, mainly for showing the correct answer on incorrect)
 * duration: ms to auto-hide (optional, default 2000)
 */
function showFeedbackCard(isCorrect, message = "", duration = 4000) {
  // Limpiar cualquier efecto anterior
  screenOverlay.className = "screen-overlay";
  feedbackEl.innerHTML = "";

  // 1. Aplicar efectos de pantalla según el resultado
  if (isCorrect) {
    // Guirnaldas/Confeti
    screenOverlay.classList.add("dim-screen"); // Atenuar el fondo
    screenOverlay.classList.add("confetti-effect");
    // Crear los elementos de confeti dinámicamente
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
  const particleCount = 20;

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
  acceptingAnswers = false;
  localStorage.setItem("finalScore", score);

  // Reemplazamos el formulario embebido por un modal centrado para mejorar la visibilidad
  const modalHtml = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">Datos del jugador</h2>
      <label for="player-name">Nombre:</label>
      <input type="text" id="player-name" name="player-name" required />
      <label for="player-age">Edad:</label>
      <input type="number" id="player-age" name="player-age" min="1" max="120" required />
      <label for="player-gender">Género:</label>
      <select id="player-gender" name="player-gender" required>
        <option value="">Seleccione...</option>
        <option value="Masculino">Masculino</option>
        <option value="Femenino">Femenino</option>
        <option value="Otro">Otro</option>
        <option value="Prefiero no decir">Prefiero no decir</option>
      </select>
      <label for="player-school">Escuela:</label>
      <input type="text" id="player-school" name="player-school" required />
      <div class="modal-actions" style="margin-top:12px;">
        <button id="submit-player-data">Enviar</button>
        <button id="skip-player-data">Omitir</button>
      </div>
    </div>
  `;

  // Crear o reutilizar overlay/modal (guardamos en la variable 'overlay' para mantener compatibilidad con el código siguiente)
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

  // Estilos del overlay/modal (centra el contenido)
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.6)",
    zIndex: "11000",
    padding: "20px",
    overflowY: "auto",
  });

  // Estilos mínimos para el contenido del modal para que se vea como diálogo
  // (se colocan en línea para no depender de CSS externo; pueden adaptarse si hay stylesheet)
  const contentWrapper = document.createElement("div");
  contentWrapper.innerHTML = modalHtml;
  Object.assign(contentWrapper.firstElementChild.style, {
    background: "#fff",
    color: "#000",
    padding: "20px",
    borderRadius: "8px",
    maxWidth: "480px",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
  });

  // Reemplazar el innerHTML del overlay por el contenido ya estilizado
  overlay.innerHTML = "";
  overlay.appendChild(contentWrapper.firstElementChild);

  // Para accesibilidad, mover el foco al primer campo
  const firstInput = overlay.querySelector("#player-name");
  if (firstInput) {
    firstInput.focus();
  }

  // Asegurar que el overlay sea visible
  overlay.style.display = "flex";

  const submitBtn = document.getElementById("submit-player-data");
  const skipBtn = document.getElementById("skip-player-data");

  const closeAndFinish = () => {
    overlay.style.display = "none";
    overlay.innerHTML = "";
    // Redirigir a la página de conclusión para mostrar resultados o leaderboard
    window.location.href = "conclusion.html";
    // Redirigir a la página de conclusión para mostrar resultados o leaderboard
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

    // Preparar respuestas para enviar
    // Se intenta obtener la respuesta del jugador desde `selectedAnswer` o `userAnswer`
    // NOTA: Para que esto funcione, necesitas guardar la respuesta del usuario en el objeto de la pregunta
    // cuando se selecciona la respuesta en `selectAnswer`. Por ejemplo:
    // `questions[currentQuestionIndex].userAnswer = selectedIndex;`
    const playerAnswers = questions.map((q, index) => {
      const given = q.userAnswer ?? null; // Asumiendo que guardaste la respuesta en `userAnswer`
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

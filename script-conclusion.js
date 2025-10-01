// La duración que quieres que se muestre la pantalla (en milisegundos)
const DURACION_PANTALLA_MS = 10000; 

// Función para reiniciar el juego
const reiniciarJuego = () => {
  // Opcional: limpiar la puntuación guardada
  localStorage.removeItem("finalScore"); 
  window.location.href = "index.html";
};

// 1. Agregar el evento al botón de "Jugar de Nuevo"
document.getElementById("restart-btn").addEventListener("click", reiniciarJuego);

// 2. Lógica para la carga inicial y el temporizador de redirección
window.addEventListener("load", () => {
  // Mostrar el puntaje final
  const finalScore = localStorage.getItem("finalScore") || 0;
  document.getElementById(
    "final-score"
  ).textContent = `Tu puntaje final es: ${finalScore}`;

  // Iniciar el temporizador de 30 segundos
  // Después de 30,000 milisegundos (30 segundos), se ejecutará la función reiniciarJuego
  setTimeout(reiniciarJuego, DURACION_PANTALLA_MS);
  
  // Opcional: También puedes mostrar un mensaje de cuenta regresiva al usuario si lo deseas
  // Esto es para que el usuario sepa que la redirección es automática.
  console.log(`La pantalla se cerrará automáticamente en ${DURACION_PANTALLA_MS / 1000} segundos.`);
});
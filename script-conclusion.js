document.getElementById("restart-btn").addEventListener("click", () => {
  window.location.href = "index.html";
});

window.addEventListener("load", () => {
  const finalScore = localStorage.getItem("finalScore") || 0;
  document.getElementById(
    "final-score"
  ).textContent = `Tu puntaje final es: ${finalScore}`;
});

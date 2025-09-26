document.getElementById("level-1").addEventListener("click", () => {
  selectLevel("/assets/data/questions-level-1.json");
});

document.getElementById("level-2").addEventListener("click", () => {
  selectLevel("/assets/data/questions-level-2.json");
});

function selectLevel(levelFile) {
  window.location.href = `questions.html?level=${levelFile}`;
}

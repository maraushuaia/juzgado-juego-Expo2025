<?php
// save_player_data.php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Configuración de conexión a la base de datos
$host = 'localhost';
$dbname = 'juzgado_db';
$user = 'root';
$password = '';

// Conectar a la base de datos
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos']);
    exit;
}

// Leer datos JSON recibidos
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['playerData']) || !isset($input['playerAnswers'])) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
    exit;
}

$playerData = $input['playerData'];
$playerAnswers = $input['playerAnswers'];

// Validar datos mínimos
if (empty($playerData['name']) || empty($playerData['age']) || empty($playerData['gender']) || empty($playerData['school'])) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos del jugador']);
    exit;
}

// Insertar datos del jugador
try {
    $stmt = $pdo->prepare("INSERT INTO players (name, age, gender, school, created_at) VALUES (?, ?, ?, ?, NOW())");
    $stmt->execute([$playerData['name'], $playerData['age'], $playerData['gender'], $playerData['school']]);
    $playerId = $pdo->lastInsertId();

    // Insertar respuestas
    $stmtAnswer = $pdo->prepare("INSERT INTO answers (player_id, question_id, answer_given, correct, answered_at) VALUES (?, ?, ?, ?, NOW())");
    foreach ($playerAnswers as $answer) {
        $questionId = $answer['questionId'];
        $answerGiven = $answer['answerGiven'];
        $correct = $answer['correct'] ? 1 : 0;
        $stmtAnswer->execute([$playerId, $questionId, $answerGiven, $correct]);
    }

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error al guardar los datos']);
}

?>

<?php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$movie_id = (int)($data['id'] ?? 0);

$stmt = $pdo->prepare("DELETE FROM user_movies WHERE id = ? AND user_id = ?");
if ($stmt->execute([$movie_id, $_SESSION['user_id']])) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Delete failed']);
}
?>
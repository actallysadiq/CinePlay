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
$title = trim($data['title'] ?? '');
$genre = trim($data['genre'] ?? '');
$year = (int)($data['year'] ?? 0);
$rating = (float)($data['rating'] ?? 0);
$poster = trim($data['poster'] ?? '');
$description = trim($data['description'] ?? '');

// Verify ownership
$check = $pdo->prepare("SELECT id FROM user_movies WHERE id = ? AND user_id = ?");
$check->execute([$movie_id, $_SESSION['user_id']]);
if (!$check->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Movie not found or access denied']);
    exit;
}

$stmt = $pdo->prepare("UPDATE user_movies SET movie_title = ?, movie_genre = ?, movie_year = ?, movie_rating = ?, movie_poster = ?, movie_description = ? WHERE id = ?");
if ($stmt->execute([$title, $genre, $year, $rating, $poster, $description, $movie_id])) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Update failed']);
}
?>
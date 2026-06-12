<?php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$title = trim($data['title'] ?? '');
$genre = trim($data['genre'] ?? '');
$year = (int)($data['year'] ?? 0);
$rating = (float)($data['rating'] ?? 0);
$poster = trim($data['poster'] ?? '');
$description = trim($data['description'] ?? '');

if (empty($title)) {
    echo json_encode(['success' => false, 'message' => 'Title is required']);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO user_movies (user_id, movie_title, movie_genre, movie_year, movie_rating, movie_poster, movie_description) VALUES (?, ?, ?, ?, ?, ?, ?)");
if ($stmt->execute([$_SESSION['user_id'], $title, $genre, $year, $rating, $poster, $description])) {
    echo json_encode(['success' => true, 'movie_id' => $pdo->lastInsertId()]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to add movie']);
}
?>
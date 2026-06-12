<?php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];
$stmt = $pdo->prepare("SELECT id, movie_title, movie_genre, movie_year, movie_rating, movie_poster, movie_description FROM user_movies WHERE user_id = ? ORDER BY added_at DESC");
$stmt->execute([$user_id]);
$movies = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'movies' => $movies]);
?>
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

try {
    // Note: Make sure there are exactly 7 question marks in the VALUES section!
    $stmt = $pdo->prepare("INSERT INTO user_movies (user_id, movie_title, movie_genre, movie_year, movie_rating, movie_poster, movie_description) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    // Execute handles the array safely
    $stmt->execute([$_SESSION['user_id'], $title, $genre, $year, $rating, $poster, $description]);
    
    // Success! Send back the ID of the newly added movie
    echo json_encode(['success' => true, 'movie_id' => $pdo->lastInsertId()]);

} catch (PDOException $e) {
    // If the database crashes, this catches it and sends the exact error to your console
    echo json_encode([
        'success' => false, 
        'message' => 'Failed to add movie', 
        'database_error' => $e->getMessage()
    ]);
}
?>
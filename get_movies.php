<?php
session_start();
header('Content-Type: application/json');
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    // 1. Prepare the query (Trailing "OR" has been removed!)
    // I also added "ORDER BY id DESC" so your newest movies show up first!
    $stmt = $pdo->prepare("SELECT id, movie_title, movie_genre, movie_year, movie_rating, movie_poster, movie_description FROM user_movies WHERE user_id = ? ORDER BY id DESC");
    
    // 2. Execute and fetch
    $stmt->execute([$user_id]);
    $movies = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Send the clean array back to your JavaScript
    echo json_encode(['success' => true, 'movies' => $movies]);

} catch (PDOException $e) {
    // Catch any future database crashes gracefully
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
?>
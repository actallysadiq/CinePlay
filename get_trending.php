<?php
header('Content-Type: application/json');
$api_url = 'https://api.sampleapis.com/movies/drama';
$response = file_get_contents($api_url);
if ($response === false) {
    echo json_encode([]);
} else {
    $movies = json_decode($response, true);
    // return first 12 as trending
    echo json_encode(array_slice($movies, 0, 12));
}
?>
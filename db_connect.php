<?php
$host = 'sql207.infinityfree.com';
$dbname = 'if0_42191567_cineplay';
$username = 'if0_42191567';
$password = 'Sadiq1384';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}
?>
<?php
session_start();

header('Content-Type: application/json');
require_once 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all fields']);
    exit;
}

try {
    // 1. Find the user by email
    $stmt = $pdo->prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. Verify the password hash against what they typed
    if ($user && password_verify($password, $user['password_hash'])) {
        
        // Officially log them in on the backend!
        $_SESSION['user_id'] = $user['id']; 

        // Remove the hash from the array before sending user data back to the frontend
        unset($user['password_hash']);
        
        echo json_encode(['success' => true, 'message' => 'Login successful', 'user' => $user]);
    } else {
        // If the password is wrong, tell the frontend!
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
    }
} catch (PDOException $e) {
    // If the database crashes, catch the error!
    echo json_encode(['success' => false, 'message' => 'Database error', 'database_error' => $e->getMessage()]);
}
?>
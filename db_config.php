<?php
// Database configuration
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_port = getenv('DB_PORT') ?: '5432';
$db_name = getenv('DB_NAME') ?: 'postgres';
$db_user = getenv('DB_USER') ?: 'postgres';
$db_password = getenv('DB_PASSWORD') ?: 'postgres';

$dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;user=$db_user;password=$db_password";

try {
    $pdo = new PDO($dsn);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}
?>

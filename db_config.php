<?php
// Database configuration using standard Postgres environment variables
$db_host = getenv('PGHOST') ?: 'localhost';
$db_port = getenv('PGPORT') ?: '5432';
$db_name = getenv('POSTGRES_DB') ?: 'postgres';
$db_user = getenv('PGUSER') ?: 'postgres';
$db_password = getenv('PGPASSWORD') ?: 'postgres';

$dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;user=$db_user;password=$db_password";

try {
    $pdo = new PDO($dsn);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}
?>

<?php
// Database configuration using DATABASE_URL or individual Postgres environment variables
$database_url = getenv('DATABASE_URL');

if ($database_url) {
    // Use DATABASE_URL if available
    $dsn = str_replace('postgresql://', 'pgsql:', $database_url);
} else {
    // Fall back to individual variables
    $db_host = getenv('PGHOST') ?: 'localhost';
    $db_port = getenv('PGPORT') ?: '5432';
    $db_name = getenv('POSTGRES_DB') ?: 'postgres';
    $db_user = getenv('PGUSER') ?: 'postgres';
    $db_password = getenv('PGPASSWORD') ?: 'klSVuOHVaYdHeIUKvFdbxJpRjLBUVIwT';

    $dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;user=$db_user;password=$db_password";
}

try {
    $pdo = new PDO($dsn);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}
?>

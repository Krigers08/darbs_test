<?php

header('Content-Type: application/json');

require 'db_config.php';

try {
    $sql = 'SELECT * FROM Products ORDER BY ProductID';
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($products);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database query failed: ' . $e->getMessage()]);
}
?>
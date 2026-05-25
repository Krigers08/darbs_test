<?php

header('Content-Type: application/json');

$productsFile = __DIR__ . '/praksei/json/Products.json';

if (!file_exists($productsFile)) {
    http_response_code(404);
    echo json_encode(['error' => 'Products file not found']);
    exit;
}

$products = json_decode(file_get_contents($productsFile), true);

if ($products === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to parse products data']);
    exit;
}

echo json_encode($products);
?>
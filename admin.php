<?php
require 'db_config.php';

$tables = [
    'Categories', 'Suppliers', 'Products', 'Customers', 'Regions', 
    'Territories', 'Employees', 'EmployeeTerritories', 'Shippers', 
    'Orders', 'OrderDetails', 'CustomerCustomerDemo', 'CustomerDemographics'
];

$selected_table = $_GET['table'] ?? '';
$data = [];
$columns = [];
$error = '';

if ($selected_table && in_array($selected_table, $tables)) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM $selected_table LIMIT 100");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!empty($data)) {
            $columns = array_keys($data[0]);
        }
    } catch (PDOException $e) {
        $error = "Error: " . $e->getMessage();
    }
}

// Handle delete
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete') {
    $table = $_POST['table'] ?? '';
    $pk_col = $_POST['pk_col'] ?? '';
    $pk_val = $_POST['pk_val'] ?? '';
    
    if ($table && in_array($table, $tables) && $pk_col && $pk_val) {
        try {
            $stmt = $pdo->prepare("DELETE FROM $table WHERE $pk_col = ?");
            $stmt->execute([$pk_val]);
            header("Location: ?table=$table&success=deleted");
            exit;
        } catch (PDOException $e) {
            $error = "Delete failed: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Data Management</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
        select, input, button { padding: 8px; font-size: 14px; }
        button { background: #007bff; color: white; border: none; cursor: pointer; }
        button:hover { background: #0056b3; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        tr:hover { background: #f9f9f9; }
        .error { color: red; padding: 10px; background: #ffe6e6; border-radius: 4px; }
        .success { color: green; padding: 10px; background: #e6ffe6; border-radius: 4px; }
        .controls { margin-bottom: 20px; }
        .delete-btn { background: #dc3545; font-size: 12px; padding: 4px 8px; }
        .delete-btn:hover { background: #c82333; }
        .row-count { color: #666; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>Database Management</h1>
    
    <?php if (isset($_GET['success'])): ?>
        <div class="success">✓ Record deleted successfully</div>
    <?php endif; ?>
    
    <?php if ($error): ?>
        <div class="error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    
    <div class="controls">
        <label>Select Table:</label>
        <select onchange="window.location='?table=' + this.value">
            <option value="">-- Choose a table --</option>
            <?php foreach ($tables as $table): ?>
                <option value="<?= $table ?>" <?= $selected_table === $table ? 'selected' : '' ?>>
                    <?= $table ?>
                </option>
            <?php endforeach; ?>
        </select>
    </div>
    
    <?php if ($selected_table): ?>
        <h2><?= htmlspecialchars($selected_table) ?></h2>
        <div class="row-count">Total records shown: <?= count($data) ?></div>
        
        <?php if (!empty($data)): ?>
            <table>
                <thead>
                    <tr>
                        <?php foreach ($columns as $col): ?>
                            <th><?= htmlspecialchars($col) ?></th>
                        <?php endforeach; ?>
                        <th style="width: 80px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($data as $row): ?>
                        <tr>
                            <?php foreach ($columns as $col): ?>
                                <td><?= htmlspecialchars(substr($row[$col] ?? '', 0, 50)) ?></td>
                            <?php endforeach; ?>
                            <td>
                                <form method="POST" style="margin: 0;" onsubmit="return confirm('Delete this record?');">
                                    <input type="hidden" name="action" value="delete">
                                    <input type="hidden" name="table" value="<?= $selected_table ?>">
                                    <input type="hidden" name="pk_col" value="<?= $columns[0] ?>">
                                    <input type="hidden" name="pk_val" value="<?= $row[$columns[0]] ?>">
                                    <button type="submit" class="delete-btn">Delete</button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php else: ?>
            <p>No data found in this table.</p>
        <?php endif; ?>
    <?php endif; ?>
</body>
</html>

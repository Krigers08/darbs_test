<?php
require 'db_config.php';

// Create tables
$sql = <<<SQL
-- Categories
CREATE TABLE IF NOT EXISTS Categories (
    CategoryID INTEGER PRIMARY KEY,
    CategoryName VARCHAR(15) NOT NULL,
    Description TEXT
);

-- Suppliers
CREATE TABLE IF NOT EXISTS Suppliers (
    SupplierID INTEGER PRIMARY KEY,
    CompanyName VARCHAR(40) NOT NULL,
    ContactName VARCHAR(30),
    ContactTitle VARCHAR(30),
    Address VARCHAR(60),
    City VARCHAR(15),
    Region VARCHAR(15),
    PostalCode VARCHAR(10),
    Country VARCHAR(15),
    Phone VARCHAR(24),
    Fax VARCHAR(24)
);

-- Products
CREATE TABLE IF NOT EXISTS Products (
    ProductID INTEGER PRIMARY KEY,
    ProductName VARCHAR(40) NOT NULL,
    SupplierID INTEGER REFERENCES Suppliers(SupplierID),
    CategoryID INTEGER REFERENCES Categories(CategoryID),
    QuantityPerUnit VARCHAR(20),
    UnitPrice DECIMAL(10,2),
    UnitsInStock SMALLINT,
    UnitsOnOrder SMALLINT,
    ReorderLevel SMALLINT,
    Discontinued SMALLINT
);

-- Regions
CREATE TABLE IF NOT EXISTS Regions (
    RegionID INTEGER PRIMARY KEY,
    RegionDescription VARCHAR(50) NOT NULL
);

-- Territories
CREATE TABLE IF NOT EXISTS Territories (
    TerritoryID VARCHAR(20) PRIMARY KEY,
    TerritoryDescription VARCHAR(50) NOT NULL,
    RegionID INTEGER REFERENCES Regions(RegionID)
);

-- Employees
CREATE TABLE IF NOT EXISTS Employees (
    EmployeeID INTEGER PRIMARY KEY,
    LastName VARCHAR(20) NOT NULL,
    FirstName VARCHAR(10) NOT NULL,
    Title VARCHAR(30),
    TitleOfCourtesy VARCHAR(25),
    BirthDate DATE,
    HireDate DATE,
    Address VARCHAR(60),
    City VARCHAR(15),
    Region VARCHAR(15),
    PostalCode VARCHAR(10),
    Country VARCHAR(15),
    HomePhone VARCHAR(24),
    Extension VARCHAR(4),
    Photo BYTEA,
    Notes TEXT,
    ReportsTo INTEGER REFERENCES Employees(EmployeeID),
    PhotoPath VARCHAR(255)
);

-- EmployeeTerritories
CREATE TABLE IF NOT EXISTS EmployeeTerritories (
    EmployeeID INTEGER REFERENCES Employees(EmployeeID),
    TerritoryID VARCHAR(20) REFERENCES Territories(TerritoryID),
    PRIMARY KEY (EmployeeID, TerritoryID)
);

-- Customers
CREATE TABLE IF NOT EXISTS Customers (
    CustomerID VARCHAR(5) PRIMARY KEY,
    CompanyName VARCHAR(40) NOT NULL,
    ContactName VARCHAR(30),
    ContactTitle VARCHAR(30),
    Address VARCHAR(60),
    City VARCHAR(15),
    Region VARCHAR(15),
    PostalCode VARCHAR(10),
    Country VARCHAR(15),
    Phone VARCHAR(24),
    Fax VARCHAR(24)
);

-- Shippers
CREATE TABLE IF NOT EXISTS Shippers (
    ShipperID INTEGER PRIMARY KEY,
    CompanyName VARCHAR(40) NOT NULL,
    Phone VARCHAR(24)
);

-- Orders
CREATE TABLE IF NOT EXISTS Orders (
    OrderID INTEGER PRIMARY KEY,
    CustomerID VARCHAR(5) REFERENCES Customers(CustomerID),
    EmployeeID INTEGER REFERENCES Employees(EmployeeID),
    OrderDate DATE,
    RequiredDate DATE,
    ShippedDate DATE,
    ShipVia INTEGER REFERENCES Shippers(ShipperID),
    Freight DECIMAL(10,2),
    ShipName VARCHAR(40),
    ShipAddress VARCHAR(60),
    ShipCity VARCHAR(15),
    ShipRegion VARCHAR(15),
    ShipPostalCode VARCHAR(10),
    ShipCountry VARCHAR(15)
);

-- OrderDetails
CREATE TABLE IF NOT EXISTS OrderDetails (
    OrderID INTEGER REFERENCES Orders(OrderID),
    ProductID INTEGER REFERENCES Products(ProductID),
    UnitPrice DECIMAL(10,2),
    Quantity SMALLINT,
    Discount REAL,
    PRIMARY KEY (OrderID, ProductID)
);

-- CustomerCustomerDemo
CREATE TABLE IF NOT EXISTS CustomerCustomerDemo (
    CustomerID VARCHAR(5) REFERENCES Customers(CustomerID),
    CustomerTypeID VARCHAR(10),
    PRIMARY KEY (CustomerID, CustomerTypeID)
);

-- CustomerDemographics
CREATE TABLE IF NOT EXISTS CustomerDemographics (
    CustomerTypeID VARCHAR(10) PRIMARY KEY,
    CustomerDesc TEXT
);
SQL;

// Execute table creation
$statements = array_filter(array_map('trim', explode(';', $sql)));
foreach ($statements as $statement) {
    if (!empty($statement)) {
        try {
            $pdo->exec($statement);
        } catch (PDOException $e) {
            echo "Note: " . $e->getMessage() . "\n";
        }
    }
}

echo "Tables created successfully!\n";

// Load CSV files
$csvFiles = [
    'Categories.csv' => 'Categories',
    'Suppliers.csv' => 'Suppliers',
    'Products.csv' => 'Products',
    'Regions.csv' => 'Regions',
    'Territories.csv' => 'Territories',
    'Employees.csv' => 'Employees',
    'EmployeeTerritories.csv' => 'EmployeeTerritories',
    'Customers.csv' => 'Customers',
    'Shippers.csv' => 'Shippers',
    'Orders.csv' => 'Orders',
    'Order Details.csv' => 'OrderDetails',
    'CustomerCustomerDemo.csv' => 'CustomerCustomerDemo',
    'CustomerDemographics.csv' => 'CustomerDemographics'
];

foreach ($csvFiles as $csvFile => $tableName) {
    $filePath = __DIR__ . "/praksei/csv/$csvFile";
    
    if (!file_exists($filePath)) {
        echo "Warning: $csvFile not found\n";
        continue;
    }
    
    loadCSVToTable($pdo, $filePath, $tableName);
    echo "Loaded $csvFile into $tableName\n";
}

function loadCSVToTable($pdo, $filePath, $tableName) {
    $file = fopen($filePath, 'r');
    $headers = fgetcsv($file);
    
    // Clear existing data
    $pdo->exec("TRUNCATE TABLE $tableName CASCADE");
    
    $placeholders = implode(',', array_fill(0, count($headers), '?'));
    $columns = implode(',', array_map(function($h) { 
        return '"' . str_replace(' ', '', $h) . '"'; 
    }, $headers));
    
    $stmt = $pdo->prepare("INSERT INTO $tableName ($columns) VALUES ($placeholders)");
    
    while (($row = fgetcsv($file)) !== false) {
        if (count($row) === count($headers)) {
            $stmt->execute($row);
        }
    }
    
    fclose($file);
}

echo "\nDatabase setup complete!\n";
?>

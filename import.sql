-- Drop existing tables
DROP TABLE IF EXISTS OrderDetails CASCADE;
DROP TABLE IF EXISTS Orders CASCADE;
DROP TABLE IF EXISTS EmployeeTerritories CASCADE;
DROP TABLE IF EXISTS Employees CASCADE;
DROP TABLE IF EXISTS Territories CASCADE;
DROP TABLE IF EXISTS Regions CASCADE;
DROP TABLE IF EXISTS Products CASCADE;
DROP TABLE IF EXISTS Suppliers CASCADE;
DROP TABLE IF EXISTS Categories CASCADE;
DROP TABLE IF EXISTS Shippers CASCADE;
DROP TABLE IF EXISTS Customers CASCADE;
DROP TABLE IF EXISTS CustomerDemographics CASCADE;
DROP TABLE IF EXISTS CustomerCustomerDemo CASCADE;

-- Create tables
CREATE TABLE Categories (
    CategoryID INTEGER PRIMARY KEY,
    CategoryName VARCHAR(15) NOT NULL,
    Description TEXT
);

CREATE TABLE Suppliers (
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

CREATE TABLE Products (
    ProductID INTEGER PRIMARY KEY,
    ProductName VARCHAR(40) NOT NULL,
    SupplierID INTEGER,
    CategoryID INTEGER,
    QuantityPerUnit VARCHAR(20),
    UnitPrice DECIMAL(10,2),
    UnitsInStock SMALLINT,
    UnitsOnOrder SMALLINT,
    ReorderLevel SMALLINT,
    Discontinued SMALLINT
);

CREATE TABLE Customers (
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

CREATE TABLE Regions (
    RegionID INTEGER PRIMARY KEY,
    RegionDescription VARCHAR(50) NOT NULL
);

CREATE TABLE Territories (
    TerritoryID VARCHAR(20) PRIMARY KEY,
    TerritoryDescription VARCHAR(50) NOT NULL,
    RegionID INTEGER
);

CREATE TABLE Employees (
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
    Notes TEXT,
    ReportsTo INTEGER,
    PhotoPath VARCHAR(255)
);

CREATE TABLE EmployeeTerritories (
    EmployeeID INTEGER,
    TerritoryID VARCHAR(20),
    PRIMARY KEY (EmployeeID, TerritoryID)
);

CREATE TABLE Shippers (
    ShipperID INTEGER PRIMARY KEY,
    CompanyName VARCHAR(40) NOT NULL,
    Phone VARCHAR(24)
);

CREATE TABLE Orders (
    OrderID INTEGER PRIMARY KEY,
    CustomerID VARCHAR(5),
    EmployeeID INTEGER,
    OrderDate DATE,
    RequiredDate DATE,
    ShippedDate DATE,
    ShipVia INTEGER,
    Freight DECIMAL(10,2),
    ShipName VARCHAR(40),
    ShipAddress VARCHAR(60),
    ShipCity VARCHAR(15),
    ShipRegion VARCHAR(15),
    ShipPostalCode VARCHAR(10),
    ShipCountry VARCHAR(15)
);

CREATE TABLE OrderDetails (
    OrderID INTEGER,
    ProductID INTEGER,
    UnitPrice DECIMAL(10,2),
    Quantity SMALLINT,
    Discount REAL,
    PRIMARY KEY (OrderID, ProductID)
);

CREATE TABLE CustomerCustomerDemo (
    CustomerID VARCHAR(5),
    CustomerTypeID VARCHAR(10),
    PRIMARY KEY (CustomerID, CustomerTypeID)
);

CREATE TABLE CustomerDemographics (
    CustomerTypeID VARCHAR(10) PRIMARY KEY,
    CustomerDesc TEXT
);

-- Disable foreign key constraints for import
SET session_replication_role = 'replica';

-- Import data from CSV files
\COPY Categories FROM './praksei/csv/Categories.csv' WITH (FORMAT CSV, HEADER TRUE);
\COPY Suppliers(SupplierID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax) FROM './praksei/csv/Suppliers.csv' WITH (FORMAT CSV, HEADER TRUE);
\COPY Products FROM './praksei/csv/Products.csv' WITH (FORMAT CSV, HEADER TRUE);
\COPY Regions FROM './praksei/csv/Regions.csv' WITH (FORMAT CSV, HEADER TRUE);
\COPY Territories FROM './praksei/csv/Territories.csv' WITH (FORMAT CSV, HEADER TRUE);
\COPY Employees(EmployeeID, LastName, FirstName, Title, TitleOfCourtesy, BirthDate, HireDate, Address, City, Region, PostalCode, Country, HomePhone, Extension, Notes, ReportsTo, PhotoPath) FROM './praksei/csv/Employees.csv' WITH (FORMAT CSV, HEADER TRUE);
\COPY EmployeeTerritories FROM './praksei/csv/EmployeeTerritories.csv' WITH (FORMAT CSV, HEADER TRUE);
\COPY Customers FROM './praksei/csv/Customers.csv' WITH (FORMAT CSV, HEADER TRUE);
\COPY Shippers FROM './praksei/csv/Shippers.csv' WITH (FORMAT CSV, HEADER TRUE);
\COPY Orders FROM './praksei/csv/Orders.csv' WITH (FORMAT CSV, HEADER TRUE);
\COPY OrderDetails FROM './praksei/csv/Order Details.csv' WITH (FORMAT CSV, HEADER TRUE);
\COPY CustomerCustomerDemo FROM './praksei/csv/CustomerCustomerDemo.csv' WITH (FORMAT CSV, HEADER TRUE);
\COPY CustomerDemographics FROM './praksei/csv/CustomerDemographics.csv' WITH (FORMAT CSV, HEADER TRUE);

-- Re-enable foreign key constraints
SET session_replication_role = 'origin';

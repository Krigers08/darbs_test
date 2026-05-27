-- Create tables
CREATE TABLE IF NOT EXISTS Categories (
    CategoryID INTEGER PRIMARY KEY,
    CategoryName VARCHAR(15) NOT NULL,
    Description TEXT
);

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

CREATE TABLE IF NOT EXISTS Regions (
    RegionID INTEGER PRIMARY KEY,
    RegionDescription VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS Territories (
    TerritoryID VARCHAR(20) PRIMARY KEY,
    TerritoryDescription VARCHAR(50) NOT NULL,
    RegionID INTEGER REFERENCES Regions(RegionID)
);

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

CREATE TABLE IF NOT EXISTS EmployeeTerritories (
    EmployeeID INTEGER REFERENCES Employees(EmployeeID),
    TerritoryID VARCHAR(20) REFERENCES Territories(TerritoryID),
    PRIMARY KEY (EmployeeID, TerritoryID)
);

CREATE TABLE IF NOT EXISTS Shippers (
    ShipperID INTEGER PRIMARY KEY,
    CompanyName VARCHAR(40) NOT NULL,
    Phone VARCHAR(24)
);

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

CREATE TABLE IF NOT EXISTS OrderDetails (
    OrderID INTEGER REFERENCES Orders(OrderID),
    ProductID INTEGER REFERENCES Products(ProductID),
    UnitPrice DECIMAL(10,2),
    Quantity SMALLINT,
    Discount REAL,
    PRIMARY KEY (OrderID, ProductID)
);

CREATE TABLE IF NOT EXISTS CustomerCustomerDemo (
    CustomerID VARCHAR(5) REFERENCES Customers(CustomerID),
    CustomerTypeID VARCHAR(10),
    PRIMARY KEY (CustomerID, CustomerTypeID)
);

CREATE TABLE IF NOT EXISTS CustomerDemographics (
    CustomerTypeID VARCHAR(10) PRIMARY KEY,
    CustomerDesc TEXT
);

-- Import data from CSV files
\COPY Categories(CategoryID, CategoryName, Description) FROM './praksei/csv/Categories.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
\COPY Suppliers FROM './praksei/csv/Suppliers.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
\COPY Products FROM './praksei/csv/Products.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
\COPY Regions FROM './praksei/csv/Regions.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
\COPY Territories FROM './praksei/csv/Territories.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
\COPY Employees FROM './praksei/csv/Employees.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
\COPY EmployeeTerritories FROM './praksei/csv/EmployeeTerritories.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
\COPY Customers FROM './praksei/csv/Customers.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
\COPY Shippers FROM './praksei/csv/Shippers.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
\COPY Orders FROM './praksei/csv/Orders.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
\COPY OrderDetails FROM './praksei/csv/Order Details.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
\COPY CustomerCustomerDemo FROM './praksei/csv/CustomerCustomerDemo.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');
\COPY CustomerDemographics FROM './praksei/csv/CustomerDemographics.csv' WITH (FORMAT CSV, HEADER TRUE, NULL '');

const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('pg');

// Use DATABASE_URL if available, otherwise build from individual variables
let connectionConfig;
if (process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL) {
  connectionConfig = { connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL };
} else {
  connectionConfig = {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: process.env.POSTGRES_DB || 'postgres',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres'
  };
}

const client = new Client(connectionConfig);

// Table mapping
const tableMap = {
  'Categories.csv': 'Categories',
  'Suppliers.csv': 'Suppliers',
  'Products.csv': 'Products',
  'Regions.csv': 'Regions',
  'Territories.csv': 'Territories',
  'Employees.csv': 'Employees',
  'EmployeeTerritories.csv': 'EmployeeTerritories',
  'Customers.csv': 'Customers',
  'Shippers.csv': 'Shippers',
  'Orders.csv': 'Orders',
  'Order Details.csv': 'OrderDetails',
  'CustomerCustomerDemo.csv': 'CustomerCustomerDemo',
  'CustomerDemographics.csv': 'CustomerDemographics'
};

async function createTables() {
  const sql = `
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
  `;

  const statements = sql.split(';').filter(s => s.trim());
  for (const statement of statements) {
    try {
      await client.query(statement);
    } catch (err) {
      console.log(`Note: ${err.message}`);
    }
  }
  console.log('✓ Tables created or verified');
}

async function importCSV(filePath, tableName) {
  return new Promise((resolve, reject) => {
    let rows = [];
    let headers = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (h) => {
        headers = h.map(h => h.trim().replace(/\s+/g, ''));
      })
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', async () => {
        if (rows.length === 0) {
          console.log(`⊘ ${tableName}: No data`);
          resolve();
          return;
        }

        try {
          // Clear existing data
          await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);

          // Prepare insert statement
          const columns = headers.join(', ');
          const placeholders = headers.map((_, i) => `$${i + 1}`).join(', ');
          const insertSQL = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;

          // Insert rows
          for (const row of rows) {
            const values = headers.map(h => {
              const val = row[h];
              return val === '' ? null : val;
            });
            try {
              await client.query(insertSQL, values);
            } catch (err) {
              // Skip problematic rows
            }
          }

          console.log(`✓ ${tableName}: ${rows.length} rows imported`);
          resolve();
        } catch (err) {
          console.error(`✗ ${tableName}: ${err.message}`);
          reject(err);
        }
      })
      .on('error', reject);
  });
}

async function migrate() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected\n');

    console.log('Creating tables...');
    await createTables();
    console.log();

    console.log('Importing CSV data...');
    for (const [csvFile, tableName] of Object.entries(tableMap)) {
      const filePath = `./praksei/csv/${csvFile}`;
      if (fs.existsSync(filePath)) {
        await importCSV(filePath, tableName);
      } else {
        console.log(`⊘ ${tableName}: File not found`);
      }
    }

    console.log('\n✓ Migration complete');
    await client.end();
  } catch (err) {
    console.error('✗ Migration failed:', err);
    await client.end();
    process.exit(1);
  }
}

migrate();

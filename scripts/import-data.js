#!/usr/bin/env node

/**
 * Northwind CSV → Postgres importer
 *
 * Usage:
 *   node scripts/import-data.js
 *
 * Requirements:
 *   - DATABASE_PUBLIC_URL env var must be set (e.g. from Railway's Postgres service)
 *   - Alternatively, set individual vars: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
 *
 * The script is idempotent: tables are created with IF NOT EXISTS and rows are
 * inserted with ON CONFLICT DO NOTHING, so it is safe to run multiple times.
 *
 * Import order respects foreign-key dependencies:
 *   Categories → Suppliers → Products
 *   Regions → Territories
 *   Employees (self-ref handled via deferred update)
 *   EmployeeTerritories
 *   Customers → Shippers → Orders → OrderDetails
 *   CustomerDemographics → CustomerCustomerDemo
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const csv  = require('csv-parser');
const { Pool } = require('pg');

// ─── Database connection ──────────────────────────────────────────────────────

const pool = new Pool(
  process.env.DATABASE_PUBLIC_URL
    ? { connectionString: process.env.DATABASE_PUBLIC_URL, ssl: { rejectUnauthorized: false } }
    : undefined   // falls back to PG* env vars or ~/.pgpass
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return null for empty strings, otherwise the original value. */
function nullify(v) {
  return (v === '' || v === null || v === undefined) ? null : v;
}

/** Parse a value as an integer; return null if empty/NaN. */
function toInt(v) {
  const s = nullify(v);
  if (s === null) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

/** Parse a value as a float; return null if empty/NaN. */
function toFloat(v) {
  const s = nullify(v);
  if (s === null) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/** Parse a date string; return null if empty. */
function toDate(v) {
  const s = nullify(v);
  return s;   // Postgres accepts ISO date strings directly; nullify handles blanks
}

/** Read a CSV file and return an array of row objects. */
function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }));
    stream.on('data', row => rows.push(row));
    stream.on('end',  ()  => resolve(rows));
    stream.on('error', reject);
  });
}

/** Execute a parameterised INSERT … ON CONFLICT DO NOTHING for each row. */
async function insertRows(client, tableName, rows, mapper) {
  let inserted = 0;
  let skipped  = 0;
  for (const raw of rows) {
    const values = mapper(raw);
    if (values === null) { skipped++; continue; }   // mapper can veto a row
    const cols        = Object.keys(values);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const colList     = cols.map(c => `"${c}"`).join(', ');
    const sql = `INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
    await client.query(sql, Object.values(values));
    inserted++;
  }
  return { inserted, skipped };
}

/** Log a section header. */
function log(msg) { console.log(`\n▶  ${msg}`); }
function ok(msg)  { console.log(`   ✓ ${msg}`); }
function warn(msg){ console.warn(`   ⚠  ${msg}`); }

// ─── CSV directory ────────────────────────────────────────────────────────────

const CSV_DIR = path.join(__dirname, '..', 'praksei', 'csv');

function csvPath(name) {
  return path.join(CSV_DIR, name);
}

// ─── DDL ─────────────────────────────────────────────────────────────────────

const DDL = `
-- Independent lookup tables
CREATE TABLE IF NOT EXISTS "Categories" (
  "CategoryID"   INTEGER      PRIMARY KEY,
  "CategoryName" VARCHAR(15)  NOT NULL,
  "Description"  TEXT
);

CREATE TABLE IF NOT EXISTS "Suppliers" (
  "SupplierID"    INTEGER      PRIMARY KEY,
  "CompanyName"   VARCHAR(40)  NOT NULL,
  "ContactName"   VARCHAR(30),
  "ContactTitle"  VARCHAR(30),
  "Address"       VARCHAR(60),
  "City"          VARCHAR(15),
  "Region"        VARCHAR(15),
  "PostalCode"    VARCHAR(10),
  "Country"       VARCHAR(15),
  "Phone"         VARCHAR(24),
  "Fax"           VARCHAR(24),
  "HomePage"      TEXT
);

CREATE TABLE IF NOT EXISTS "Regions" (
  "RegionID"          INTEGER      PRIMARY KEY,
  "RegionDescription" VARCHAR(50)  NOT NULL
);

CREATE TABLE IF NOT EXISTS "Territories" (
  "TerritoryID"          VARCHAR(20)  PRIMARY KEY,
  "TerritoryDescription" VARCHAR(50)  NOT NULL,
  "RegionID"             INTEGER      REFERENCES "Regions"("RegionID")
);

CREATE TABLE IF NOT EXISTS "Shippers" (
  "ShipperID"   INTEGER      PRIMARY KEY,
  "CompanyName" VARCHAR(40)  NOT NULL,
  "Phone"       VARCHAR(24)
);

CREATE TABLE IF NOT EXISTS "CustomerDemographics" (
  "CustomerTypeID" VARCHAR(10)  PRIMARY KEY,
  "CustomerDesc"   TEXT
);

-- Tables that depend on the above
CREATE TABLE IF NOT EXISTS "Products" (
  "ProductID"       INTEGER      PRIMARY KEY,
  "ProductName"     VARCHAR(40)  NOT NULL,
  "SupplierID"      INTEGER      REFERENCES "Suppliers"("SupplierID"),
  "CategoryID"      INTEGER      REFERENCES "Categories"("CategoryID"),
  "QuantityPerUnit" VARCHAR(20),
  "UnitPrice"       DECIMAL(10,2),
  "UnitsInStock"    SMALLINT,
  "UnitsOnOrder"    SMALLINT,
  "ReorderLevel"    SMALLINT,
  "Discontinued"    SMALLINT     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Customers" (
  "CustomerID"   VARCHAR(5)   PRIMARY KEY,
  "CompanyName"  VARCHAR(40)  NOT NULL,
  "ContactName"  VARCHAR(30),
  "ContactTitle" VARCHAR(30),
  "Address"      VARCHAR(60),
  "City"         VARCHAR(15),
  "Region"       VARCHAR(15),
  "PostalCode"   VARCHAR(10),
  "Country"      VARCHAR(15),
  "Phone"        VARCHAR(24),
  "Fax"          VARCHAR(24)
);

-- Employees has a self-referencing FK (ReportsTo); we add the FK after insert
CREATE TABLE IF NOT EXISTS "Employees" (
  "EmployeeID"      INTEGER      PRIMARY KEY,
  "LastName"        VARCHAR(20)  NOT NULL,
  "FirstName"       VARCHAR(10)  NOT NULL,
  "Title"           VARCHAR(30),
  "TitleOfCourtesy" VARCHAR(25),
  "BirthDate"       DATE,
  "HireDate"        DATE,
  "Address"         VARCHAR(60),
  "City"            VARCHAR(15),
  "Region"          VARCHAR(15),
  "PostalCode"      VARCHAR(10),
  "Country"         VARCHAR(15),
  "HomePhone"       VARCHAR(24),
  "Extension"       VARCHAR(4),
  "Notes"           TEXT,
  "ReportsTo"       INTEGER,
  "PhotoPath"       VARCHAR(255)
);

-- Junction / dependent tables
CREATE TABLE IF NOT EXISTS "EmployeeTerritories" (
  "EmployeeID"  INTEGER     REFERENCES "Employees"("EmployeeID"),
  "TerritoryID" VARCHAR(20) REFERENCES "Territories"("TerritoryID"),
  PRIMARY KEY ("EmployeeID", "TerritoryID")
);

CREATE TABLE IF NOT EXISTS "Orders" (
  "OrderID"        INTEGER      PRIMARY KEY,
  "CustomerID"     VARCHAR(5)   REFERENCES "Customers"("CustomerID"),
  "EmployeeID"     INTEGER      REFERENCES "Employees"("EmployeeID"),
  "OrderDate"      DATE,
  "RequiredDate"   DATE,
  "ShippedDate"    DATE,
  "ShipVia"        INTEGER      REFERENCES "Shippers"("ShipperID"),
  "Freight"        DECIMAL(10,2),
  "ShipName"       VARCHAR(40),
  "ShipAddress"    VARCHAR(60),
  "ShipCity"       VARCHAR(15),
  "ShipRegion"     VARCHAR(15),
  "ShipPostalCode" VARCHAR(10),
  "ShipCountry"    VARCHAR(15)
);

CREATE TABLE IF NOT EXISTS "OrderDetails" (
  "OrderID"   INTEGER      REFERENCES "Orders"("OrderID"),
  "ProductID" INTEGER      REFERENCES "Products"("ProductID"),
  "UnitPrice" DECIMAL(10,2) NOT NULL,
  "Quantity"  SMALLINT     NOT NULL,
  "Discount"  REAL         NOT NULL DEFAULT 0,
  PRIMARY KEY ("OrderID", "ProductID")
);

CREATE TABLE IF NOT EXISTS "CustomerCustomerDemo" (
  "CustomerID"     VARCHAR(5)  REFERENCES "Customers"("CustomerID"),
  "CustomerTypeID" VARCHAR(10) REFERENCES "CustomerDemographics"("CustomerTypeID"),
  PRIMARY KEY ("CustomerID", "CustomerTypeID")
);
`;

// ─── Row mappers ──────────────────────────────────────────────────────────────

const mappers = {
  Categories: r => ({
    CategoryID:   toInt(r.CategoryID),
    CategoryName: nullify(r.CategoryName),
    Description:  nullify(r.Description),
  }),

  Suppliers: r => ({
    SupplierID:   toInt(r.SupplierID),
    CompanyName:  nullify(r.CompanyName),
    ContactName:  nullify(r.ContactName),
    ContactTitle: nullify(r.ContactTitle),
    Address:      nullify(r.Address),
    City:         nullify(r.City),
    Region:       nullify(r.Region),
    PostalCode:   nullify(r.PostalCode),
    Country:      nullify(r.Country),
    Phone:        nullify(r.Phone),
    Fax:          nullify(r.Fax),
    HomePage:     nullify(r.HomePage),
  }),

  Regions: r => ({
    RegionID:          toInt(r.RegionID),
    RegionDescription: nullify(r.RegionDescription),
  }),

  Territories: r => ({
    TerritoryID:          nullify(r.TerritoryID),
    TerritoryDescription: nullify(r.TerritoryDescription),
    RegionID:             toInt(r.RegionID),
  }),

  Shippers: r => ({
    ShipperID:   toInt(r.ShipperID),
    CompanyName: nullify(r.CompanyName),
    Phone:       nullify(r.Phone),
  }),

  CustomerDemographics: r => ({
    CustomerTypeID: nullify(r.CustomerTypeID),
    CustomerDesc:   nullify(r.CustomerDesc),
  }),

  Products: r => ({
    ProductID:       toInt(r.ProductID),
    ProductName:     nullify(r.ProductName),
    SupplierID:      toInt(r.SupplierID),
    CategoryID:      toInt(r.CategoryID),
    QuantityPerUnit: nullify(r.QuantityPerUnit),
    UnitPrice:       toFloat(r.UnitPrice),
    UnitsInStock:    toInt(r.UnitsInStock),
    UnitsOnOrder:    toInt(r.UnitsOnOrder),
    ReorderLevel:    toInt(r.ReorderLevel),
    Discontinued:    toInt(r.Discontinued) ?? 0,
  }),

  Customers: r => {
    const id = nullify(r.CustomerID);
    if (!id) return null;                    // skip blank/header-only rows
    return {
      CustomerID:   id.trim(),
      CompanyName:  nullify(r.CompanyName),
      ContactName:  nullify(r.ContactName),
      ContactTitle: nullify(r.ContactTitle),
      Address:      nullify(r.Address),
      City:         nullify(r.City),
      Region:       nullify(r.Region),
      PostalCode:   nullify(r.PostalCode),
      Country:      nullify(r.Country),
      Phone:        nullify(r.Phone),
      Fax:          nullify(r.Fax),
    };
  },

  Employees: r => ({
    EmployeeID:      toInt(r.EmployeeID),
    LastName:        nullify(r.LastName),
    FirstName:       nullify(r.FirstName),
    Title:           nullify(r.Title),
    TitleOfCourtesy: nullify(r.TitleOfCourtesy),
    BirthDate:       toDate(r.BirthDate),
    HireDate:        toDate(r.HireDate),
    Address:         nullify(r.Address),
    City:            nullify(r.City),
    Region:          nullify(r.Region),
    PostalCode:      nullify(r.PostalCode),
    Country:         nullify(r.Country),
    HomePhone:       nullify(r.HomePhone),
    Extension:       nullify(r.Extension),
    Notes:           nullify(r.Notes),
    ReportsTo:       toInt(r.ReportsTo),   // self-ref; FK constraint added after
    PhotoPath:       nullify(r.PhotoPath),
  }),

  EmployeeTerritories: r => ({
    EmployeeID:  toInt(r.EmployeeID),
    TerritoryID: nullify(r.TerritoryID),
  }),

  Orders: r => ({
    OrderID:        toInt(r.OrderID),
    CustomerID:     nullify(r.CustomerID),
    EmployeeID:     toInt(r.EmployeeID),
    OrderDate:      toDate(r.OrderDate),
    RequiredDate:   toDate(r.RequiredDate),
    ShippedDate:    toDate(r.ShippedDate),
    ShipVia:        toInt(r.ShipVia),
    Freight:        toFloat(r.Freight),
    ShipName:       nullify(r.ShipName),
    ShipAddress:    nullify(r.ShipAddress),
    ShipCity:       nullify(r.ShipCity),
    ShipRegion:     nullify(r.ShipRegion),
    ShipPostalCode: nullify(r.ShipPostalCode),
    ShipCountry:    nullify(r.ShipCountry),
  }),

  OrderDetails: r => ({
    OrderID:   toInt(r.OrderID),
    ProductID: toInt(r.ProductID),
    UnitPrice: toFloat(r.UnitPrice),
    Quantity:  toInt(r.Quantity),
    Discount:  toFloat(r.Discount) ?? 0,
  }),

  CustomerCustomerDemo: r => ({
    CustomerID:     nullify(r.CustomerID),
    CustomerTypeID: nullify(r.CustomerTypeID),
  }),
};

// ─── Import plan ──────────────────────────────────────────────────────────────
// Each entry: { table, file, mapper }
// Order respects FK dependencies.

const IMPORT_PLAN = [
  { table: 'Categories',          file: 'Categories.csv'          },
  { table: 'Suppliers',           file: 'Suppliers.csv'           },
  { table: 'Regions',             file: 'Regions.csv'             },
  { table: 'Territories',         file: 'Territories.csv'         },
  { table: 'Shippers',            file: 'Shippers.csv'            },
  { table: 'CustomerDemographics',file: 'CustomerDemographics.csv'},
  { table: 'Products',            file: 'Products.csv'            },
  { table: 'Customers',           file: 'Customers.csv'           },
  { table: 'Employees',           file: 'Employees.csv'           },
  { table: 'EmployeeTerritories', file: 'EmployeeTerritories.csv' },
  { table: 'Orders',              file: 'Orders.csv'              },
  { table: 'OrderDetails',        file: 'Order Details.csv'       },
  { table: 'CustomerCustomerDemo',file: 'CustomerCustomerDemo.csv'},
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('  Northwind CSV → Postgres importer');
  console.log('='.repeat(60));

  const client = await pool.connect();
  try {
    // 1. Create all tables
    log('Creating tables (IF NOT EXISTS)…');
    await client.query(DDL);
    ok('All tables ready.');

    // 2. Import each CSV in dependency order
    for (const { table, file } of IMPORT_PLAN) {
      const filePath = csvPath(file);

      if (!fs.existsSync(filePath)) {
        warn(`${file} not found — skipping ${table}`);
        continue;
      }

      log(`Importing ${table} ← ${file}`);
      const rows = await readCsv(filePath);

      if (rows.length === 0) {
        warn(`${file} is empty — skipping`);
        continue;
      }

      const mapper = mappers[table];
      if (!mapper) {
        warn(`No mapper defined for ${table} — skipping`);
        continue;
      }

      const { inserted, skipped } = await insertRows(client, table, rows, mapper);
      ok(`${inserted} rows inserted${skipped ? `, ${skipped} skipped` : ''}`);
    }

    // 3. Add the Employees self-referencing FK if it doesn't already exist
    log('Ensuring Employees.ReportsTo foreign key…');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'employees_reportsto_fkey'
            AND table_name = 'Employees'
        ) THEN
          ALTER TABLE "Employees"
            ADD CONSTRAINT employees_reportsto_fkey
            FOREIGN KEY ("ReportsTo") REFERENCES "Employees"("EmployeeID");
        END IF;
      END
      $$;
    `);
    ok('Foreign key in place.');

    console.log('\n' + '='.repeat(60));
    console.log('  Import complete!');
    console.log('='.repeat(60) + '\n');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('\n✗ Import failed:', err.message);
  process.exit(1);
});

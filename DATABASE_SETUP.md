# Database Connection Setup

## Environment Variables

### Node.js importer (Railway / Postgres)

Set the `DATABASE_PUBLIC_URL` environment variable provided by Railway's Postgres service:

```
DATABASE_PUBLIC_URL=postgresql://user:password@host:port/dbname
```

Alternatively you can use the standard `pg` environment variables:

```
PGHOST=your-postgres-host
PGPORT=5432
PGDATABASE=your_database_name
PGUSER=your_username
PGPASSWORD=your_password
```

### PHP app (legacy)

```
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
```

---

## Importing Northwind data (Node.js — recommended)

The script `scripts/import-data.js` reads every CSV from `praksei/csv/`, creates
the Northwind tables (with `IF NOT EXISTS`), and inserts all rows using
`ON CONFLICT DO NOTHING` — so it is **safe to run multiple times**.

### Prerequisites

```bash
npm install        # installs csv-parser and pg
```

### Run

```bash
# Using the npm script shortcut:
npm run import-data

# Or directly:
node scripts/import-data.js
```

### What it imports

| Table                  | Source CSV                    |
|------------------------|-------------------------------|
| Categories             | Categories.csv                |
| Suppliers              | Suppliers.csv                 |
| Regions                | Regions.csv                   |
| Territories            | Territories.csv               |
| Shippers               | Shippers.csv                  |
| CustomerDemographics   | CustomerDemographics.csv      |
| Products               | Products.csv                  |
| Customers              | Customers.csv                 |
| Employees              | Employees.csv                 |
| EmployeeTerritories    | EmployeeTerritories.csv       |
| Orders                 | Orders.csv                    |
| OrderDetails           | Order Details.csv             |
| CustomerCustomerDemo   | CustomerCustomerDemo.csv      |

Empty CSV files are skipped automatically with a warning.

---

## Importing via psql (alternative)

If you have direct `psql` access you can use the existing SQL script:

```bash
psql "$DATABASE_PUBLIC_URL" -f import.sql
```

> **Note:** `import.sql` uses `\COPY` with relative paths, so run it from the
> repository root.

---

## Files

| File                        | Purpose                                      |
|-----------------------------|----------------------------------------------|
| `scripts/import-data.js`    | Node.js CSV → Postgres importer              |
| `import.sql`                | psql `\COPY` script (alternative)            |
| `db_config.php`             | PHP database connection configuration        |
| `index.php`                 | PHP endpoint — queries Products from Postgres|
| `praksei/csv/`              | Northwind CSV source files                   |
| `praksei/json/`             | Northwind JSON source files                  |


# Database Connection Setup

## Environment Variables

Set these environment variables on your Postgres deployment (e.g., in your Render dashboard):

```
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
```

Or create a `.env` file locally:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=darbs
DB_USER=postgres
DB_PASSWORD=your_password
```

## Setup Instructions

1. **Configure your database credentials** in the environment variables or `.env` file

2. **Run the database setup script**:
   ```bash
   php setup_db.php
   ```
   This will:
   - Create all necessary tables
   - Load CSV data into the database

3. **Test the connection**:
   ```bash
   curl http://localhost:8000/index.php
   ```

## Files Created

- `db_config.php` - Database connection configuration
- `setup_db.php` - Script to create tables and load CSV data
- `index.php` - Updated to query from Postgres instead of JSON files

## Next Steps

You can now:
- Query other tables by creating new endpoints
- Use the database for your application logic
- Add more API routes as needed


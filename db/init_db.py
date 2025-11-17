#!/usr/bin/env python3
"""
GPS App Database Initialization Script
Initializes PostgreSQL database with schema and seed data
"""

import json
import os
import subprocess
import sys
from pathlib import Path

def load_config(config_path="config/db_config.json"):
    """Load database configuration from JSON file"""
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Configuration file '{config_path}' not found")
        sys.exit(1)

def execute_sql_script(db_config, script_path, script_name=""):
    """Execute SQL script using psql"""
    if not os.path.exists(script_path):
        print(f"Error: SQL script '{script_path}' not found")
        return False
    
    env = os.environ.copy()
    env['PGPASSWORD'] = db_config['PGPASSWORD']
    
    cmd = [
        'psql',
        '-h', db_config['PGHOST'],
        '-p', str(db_config['PGPORT']),
        '-U', db_config['PGUSER'],
        '-d', db_config['PGDATABASE'],
        '-f', script_path,
        '-v', f"ON_ERROR_STOP=1"
    ]
    
    try:
        print(f"\n{'='*60}")
        print(f"Executing: {script_name or script_path}")
        print(f"{'='*60}")
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, check=False)
        
        if result.returncode != 0:
            print(f"STDERR:\n{result.stderr}")
            print(f"Error executing {script_name}: {result.returncode}")
            return False
        else:
            if result.stdout:
                print(result.stdout)
            print(f"✓ {script_name} completed successfully")
            return True
    except FileNotFoundError:
        print("Error: psql not found. Please install PostgreSQL client tools.")
        return False
    except Exception as e:
        print(f"Error executing SQL script: {e}")
        return False

def create_database(db_config):
    """Create the database if it doesn't exist"""
    env = os.environ.copy()
    env['PGPASSWORD'] = db_config['PGPASSWORD']
    
    # Connect to postgres database (default) to create our database
    cmd = [
        'psql',
        '-h', db_config['PGHOST'],
        '-p', str(db_config['PGPORT']),
        '-U', db_config['PGUSER'],
        '-tc',
        f"SELECT 1 FROM pg_database WHERE datname = '{db_config['PGDATABASE']}';"
    ]
    
    try:
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, check=False)
        
        if not result.stdout.strip():
            # Database doesn't exist, create it
            print(f"Creating database '{db_config['PGDATABASE']}'...")
            create_cmd = [
                'psql',
                '-h', db_config['PGHOST'],
                '-p', str(db_config['PGPORT']),
                '-U', db_config['PGUSER'],
                '-c',
                f"CREATE DATABASE {db_config['PGDATABASE']};"
            ]
            result = subprocess.run(create_cmd, env=env, capture_output=True, text=True, check=False)
            if result.returncode != 0:
                print(f"Error creating database: {result.stderr}")
                return False
            print(f"✓ Database '{db_config['PGDATABASE']}' created")
        else:
            print(f"✓ Database '{db_config['PGDATABASE']}' already exists")
        
        return True
    except Exception as e:
        print(f"Error checking/creating database: {e}")
        return False

def main():
    """Main initialization routine"""
    print("\n" + "="*60)
    print("GPS App - Database Initialization")
    print("="*60)
    
    # Load configuration
    db_config = load_config()
    
    print(f"\nDatabase Configuration:")
    print(f"  Host: {db_config['PGHOST']}")
    print(f"  Port: {db_config['PGPORT']}")
    print(f"  Database: {db_config['PGDATABASE']}")
    print(f"  User: {db_config['PGUSER']}")
    print(f"  Schema: {db_config.get('SCHEMA', 'public')}")
    
    # Create database if needed
    if not create_database(db_config):
        print("\nError: Could not create/access database")
        sys.exit(1)
    
    # Execute schema script
    schema_path = os.path.join("db", "schema.sql")
    if not execute_sql_script(db_config, schema_path, "Schema Creation"):
        print("\nError: Schema creation failed")
        sys.exit(1)
    
    # Execute seed script
    seed_path = os.path.join("db", "seed.sql")
    if not execute_sql_script(db_config, seed_path, "Seed Data"):
        print("\nWarning: Seed data loading had issues (may be OK if data already exists)")
    
    print("\n" + "="*60)
    print("✓ Database initialization completed successfully!")
    print("="*60)
    print("\nYou can now connect to the database:")
    print(f"  psql -h {db_config['PGHOST']} -U {db_config['PGUSER']} -d {db_config['PGDATABASE']}")
    print("\nOr update your application config with these credentials.")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()

#!/usr/bin/env node
/**
 * GPS App - Quick Start Setup
 * Ejecuta este script para configurar todo automáticamente
 * 
 * Usage:
 *   node setup-quick.js
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const BASE_DIR = path.resolve('.');

console.log('\n' + '='.repeat(60));
console.log('🚀 GPS App - Quick Start Setup');
console.log('='.repeat(60) + '\n');

async function checkRequirements() {
  console.log('📋 Verificando requisitos...\n');
  
  const checks = [
    {
      name: 'Node.js',
      cmd: 'node --version',
      required: true
    },
    {
      name: 'npm',
      cmd: 'npm --version',
      required: true
    },
    {
      name: 'PostgreSQL',
      cmd: 'psql --version',
      required: true
    },
    {
      name: 'Python',
      cmd: 'python --version',
      required: false
    }
  ];

  for (const check of checks) {
    try {
      const { stdout } = await execAsync(check.cmd);
      console.log(`✓ ${check.name}: ${stdout.trim()}`);
    } catch (error) {
      if (check.required) {
        console.error(`✗ ${check.name}: NOT FOUND (required)`);
        process.exit(1);
      } else {
        console.log(`⚠ ${check.name}: NOT FOUND (optional)`);
      }
    }
  }
  console.log('');
}

async function copyConfigFiles() {
  console.log('📝 Copiando archivos de configuración...\n');

  const files = [
    { src: 'config/db_config.example.json', dst: 'config/db_config.json' },
    { src: 'config/jwt_config.example.json', dst: 'config/jwt_config.json' },
    { src: '.env.example', dst: '.env' }
  ];

  for (const file of files) {
    const srcPath = path.join(BASE_DIR, file.src);
    const dstPath = path.join(BASE_DIR, file.dst);

    if (!fs.existsSync(srcPath)) {
      console.log(`⚠ ${file.src} no encontrado`);
      continue;
    }

    if (fs.existsSync(dstPath)) {
      console.log(`✓ ${file.dst} ya existe (no sobrescrito)`);
    } else {
      fs.copyFileSync(srcPath, dstPath);
      console.log(`✓ Creado: ${file.dst}`);
    }
  }
  console.log('');
}

async function installDependencies() {
  console.log('📦 Instalando dependencias...\n');

  try {
    process.chdir(path.join(BASE_DIR, 'auth-service'));
    console.log('  auth-service/');
    await execAsync('npm install');
    console.log('  ✓ Dependencias instaladas\n');
    process.chdir(BASE_DIR);
  } catch (error) {
    console.error('✗ Error instalando dependencias:', error.message);
    process.exit(1);
  }
}

async function showNextSteps() {
  console.log('='.repeat(60));
  console.log('✅ Setup completado!\n');
  console.log('📋 Próximos pasos:\n');
  
  console.log('1️⃣  Editar configuración de base de datos:');
  console.log('   Archivo: config/db_config.json');
  console.log('   Cambiar: PGPASSWORD con tu contraseña de PostgreSQL\n');
  
  console.log('2️⃣  Crear base de datos (opción A - automático):');
  console.log('   $ python db/init_db.py\n');
  
  console.log('2️⃣  O crear base de datos (opción B - manual):');
  console.log('   $ psql -U postgres -c "CREATE DATABASE gps_app_db;"');
  console.log('   $ psql -U postgres -d gps_app_db -f db/schema.sql');
  console.log('   $ psql -U postgres -d gps_app_db -f db/seed.sql\n');
  
  console.log('3️⃣  Iniciar el auth service:');
  console.log('   $ cd auth-service');
  console.log('   $ npm start\n');
  
  console.log('4️⃣  En otra terminal, probar la API:');
  console.log('   $ node scripts/test-auth.js\n');
  
  console.log('📚 Más información: ver README.md y SETUP.md\n');
  console.log('='.repeat(60) + '\n');
}

async function main() {
  try {
    await checkRequirements();
    await copyConfigFiles();
    await installDependencies();
    await showNextSteps();
  } catch (error) {
    console.error('\n✗ Error durante setup:', error.message);
    process.exit(1);
  }
}

main();

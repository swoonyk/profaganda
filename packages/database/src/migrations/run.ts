#!/usr/bin/env tsx

import { runMigrationsCLI } from '../migrations.js';

async function main() {
  try {
    await runMigrationsCLI();
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();

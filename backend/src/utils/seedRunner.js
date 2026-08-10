import { connectDB, closeDB } from '../config/db.js';
import { seedDatabase } from '../services/seedData.js';

const runSeed = async () => {
  await connectDB();
  await seedDatabase();
  console.log('Seed process finished.');
  process.exit(0);
};

runSeed();

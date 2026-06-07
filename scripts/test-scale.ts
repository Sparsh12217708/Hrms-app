import { db } from '../lib/db';

async function runBenchmark() {
  console.log('--- STARTING SCALABILITY AND PERFORMANCE BENCHMARK ---');

  // Verify database has the seeded employees
  const initialCheck = db.getEmployees({ page: 1, limit: 1 });
  console.log(`Verified database contains: ${initialCheck.totalCount} employee records.`);

  if (initialCheck.totalCount < 5000) {
    console.error('ERROR: Database has fewer than 5,000 records. Run seed script first.');
    process.exit(1);
  }

  const ITERATIONS = 1000;
  const searchQueries = ['liam', 'smith', 'john', 'williams', 'ai', 'software', 'eng', 'manager'];
  const departments = ['Engineering', 'AI/ML', 'HR', 'Finance', 'Sales', 'All'];
  const roles = ['employee', 'manager', 'recruiter', 'admin', 'All'];

  console.log(`Running ${ITERATIONS} random search & filter operations...`);

  const startTime = performance.now();

  for (let i = 0; i < ITERATIONS; i++) {
    const search = searchQueries[i % searchQueries.length];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    const page = Math.floor(Math.random() * 5) + 1; // page 1 to 5

    // Run paginated fuzzy query
    db.getEmployees({
      search,
      department,
      role,
      page,
      limit: 20
    });
  }

  const endTime = performance.now();
  const totalDuration = endTime - startTime;
  const averageLatency = totalDuration / ITERATIONS;

  console.log('--- BENCHMARK RESULTS ---');
  console.log(`Total Operations Executed: ${ITERATIONS}`);
  console.log(`Total Execution Time: ${totalDuration.toFixed(2)} ms`);
  console.log(`Average Latency Per Query: ${averageLatency.toFixed(4)} ms`);

  const PASS_LIMIT = 50.0; // 50ms limit
  if (averageLatency < PASS_LIMIT) {
    console.log(`RESULT: PASS (Average latency of ${averageLatency.toFixed(4)} ms is well below the ${PASS_LIMIT} ms SLA limit)`);
  } else {
    console.warn(`RESULT: FAIL (Average latency of ${averageLatency.toFixed(4)} ms exceeded the ${PASS_LIMIT} ms limit)`);
    process.exit(1);
  }
  
  console.log('Testing specific index lookup for single employee by ID...');
  const testEmpId = 'EMP-00001';
  const idStart = performance.now();
  const empById = db.getEmployeeById(testEmpId);
  const idEnd = performance.now();
  console.log(`O(1) Map Lookup by ID (${testEmpId}) took: ${(idEnd - idStart).toFixed(4)} ms (Result: ${empById ? empById.name : 'Not Found'})`);

  console.log('Testing specific index lookup for single employee by Email...');
  const testEmail = 'admin@fwc.com';
  const emailStart = performance.now();
  const empByEmail = db.getEmployeeByEmail(testEmail);
  const emailEnd = performance.now();
  console.log(`O(1) Map Lookup by Email (${testEmail}) took: ${(emailEnd - emailStart).toFixed(4)} ms (Result: ${empByEmail ? empByEmail.name : 'Not Found'})`);
}

runBenchmark();

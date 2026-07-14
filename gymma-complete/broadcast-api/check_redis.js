const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Connect using the external URL the user has
const connection = new IORedis('rediss://red-d90493e7r5hc73ar831g.oregon-postgres.render.com:6380', {
  maxRetriesPerRequest: null
});

const queue = new Queue('broadcast-push', { connection });

async function check() {
  try {
    const workers = await queue.getWorkers();
    console.log("=== Active Workers on Redis ===");
    if (workers.length > 0) {
      console.log(`✅ SUCCESS! Found ${workers.length} worker(s) connected to the queue!`);
      workers.forEach(w => console.log(`Worker ID: ${w.id}`));
    } else {
      console.log("❌ No workers found. The Cloud Run service might still be crashing or not deployed yet.");
    }
  } catch (e) {
    console.error("Error connecting to Redis:", e.message);
  } finally {
    process.exit(0);
  }
}

check();

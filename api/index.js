// api/index.js
// Vercel Serverless Function entrypoint.
// Each cold-start imports the Express app and ensures a single cached
// Mongoose connection is shared across warm invocations.

import { connectDB } from '../server/src/config/db.js';
import app from '../server/src/server.js';

export default async function handler(req, res) {
  // connectDB is idempotent — the global cache inside db.js ensures
  // mongoose.connect() is only ever called once per container lifetime.
  await connectDB();
  return app(req, res);
}

// Vercel serverless entry point. Vercel's Node runtime accepts any exported
// function shaped like (req, res) => void — an Express app instance already
// is exactly that, so no extra adapter (e.g. serverless-http) is needed.
import app from '../src/app.js';

export default app;

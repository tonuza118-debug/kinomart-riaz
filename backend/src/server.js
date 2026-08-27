// Local dev entry point only. Vercel doesn't use this file — it imports
// app.js directly from api/index.js instead (serverless functions don't
// call .listen()).
import app from './app.js';

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`KinoMart API listening on :${port}`);
});

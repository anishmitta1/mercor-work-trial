import express from 'express';
import { runQuery } from './query';
import { compile, META } from './compile';

const app = express();
app.use(express.json());

app.get('/api/meta', (_req, res) => res.json(META));

app.post('/api/query', async (req, res) => {
  try {
    res.json({ rows: await runQuery(compile(req.body)) });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.listen(3001, () => console.log('query server on :3001'));

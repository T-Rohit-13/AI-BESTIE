import { app } from './app';

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(Number(PORT), HOST, () => {
  console.log(`[INARO Backend] Server listening on http://${HOST}:${PORT}`);
  console.log(`[INARO Backend] Dump Mode mounted at http://${HOST}:${PORT}/dump and /api/v1/dump`);
});

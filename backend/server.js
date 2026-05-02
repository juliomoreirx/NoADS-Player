import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchStream } from './controllers/streamController.js';
import { proxyStream } from './controllers/proxyController.js'; // Adicione a importação

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

// Rota para extrair a URL (A que criamos com o Puppeteer)
app.get('/api/stream/:platform/:username', fetchStream);

// NOVA ROTA: O Proxy de vídeo
app.get('/api/proxy', proxyStream);

app.listen(PORT, () => {
    console.log(`🚀 Kick Stream Server rodando na porta ${PORT}`);
});
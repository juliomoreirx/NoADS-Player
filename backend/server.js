import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchStream } from './controllers/streamController.js';
import { proxyStream } from './controllers/proxyController.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração para caminhos absolutos no ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());

// --- SUAS ROTAS DE API ---
app.get('/api/stream/:platform/:username', fetchStream);
app.get('/api/proxy', proxyStream);

// --- INTEGRAÇÃO COM O FRONTEND EM PRODUÇÃO ---
// Diz para o Express servir os arquivos compilados do React (pasta dist)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Rota de fallback (Qualquer requisição que não seja /api, manda pro index.html do React)
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`🚀 NoADS-Player Server rodando na porta ${PORT}`);
});
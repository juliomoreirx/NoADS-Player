import axios from 'axios';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getCache, setCache } from '../utils/cache.js';

puppeteer.use(StealthPlugin());

const HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'DNT': '1',
    'Referer': 'https://kick.com/'
};

async function validateM3u8(url) {
    if (!url || !url.endsWith('.m3u8')) return false;
    try {
        const response = await axios.head(url, { headers: HTTP_HEADERS, timeout: 5000 });
        return response.status === 200;
    } catch (error) {
        console.log(`[Log] Validação falhou para a URL: ${error.message}`);
        return false;
    }
}

// Estratégia Fallback: Puppeteer com Rastreamento Total e Internal Fetch
async function fetchStreamPuppeteer(username) {
    let browser;
    try {
        console.log(`\n--- INICIANDO RASTREAMENTO PUPPETEER PARA '${username}' ---`);
        console.log(`[Passo 1] Abrindo navegador...`);
        
        browser = await puppeteer.launch({
            // ⚠️ Mude para 'new' ou true quando for rodar na VPS (DigitalOcean)
            headless: 'new', 
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-blink-features=AutomationControlled',
                '--mute-audio'
            ]
        });
        
        const page = await browser.newPage();
        
        // Remove a marcação de bot do Chrome
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        await page.setUserAgent(HTTP_HEADERS['User-Agent']);
        
        console.log(`[Passo 2] Acessando https://kick.com/${username} ...`);
        await page.goto(`https://kick.com/${username}`, { waitUntil: 'domcontentloaded', timeout: 30000 });

        console.log(`[Passo 3] Analisando barreira do Cloudflare...`);
        let waitLoops = 0;
        let cfPassed = false;
        
        // Espera pacientemente o Cloudflare passar analisando o título da aba
        while (waitLoops < 15) {
            const title = await page.title();
            console.log(`   -> [Tentativa ${waitLoops+1}/15] Título atual: "${title}"`);
            
            if (!title.toLowerCase().includes('moment') && !title.toLowerCase().includes('cloudflare')) {
                console.log(`[Passo 4] 🔓 Cloudflare ultrapassado com sucesso!`);
                cfPassed = true;
                break;
            }
            await new Promise(r => setTimeout(r, 1000));
            waitLoops++;
        }

        if (!cfPassed) {
            console.log(`[ERRO CRÍTICO] Preso no Cloudflare. O timeout estourou.`);
            return { online: false, url: null, title: 'Bloqueado pelo CF' };
        }

        console.log(`[Passo 5] Aguardando 2 segundos para o React e o Player inicializarem...`);
        await new Promise(r => setTimeout(r, 2000));

        console.log(`[Passo 6] 🪄 Injetando Fetch na API privada da Kick...`);
        
        // MÁGICA: Executamos o fetch DENTRO do Chrome que já passou pelo CF
        // E injetamos o header obrigatório da Kick (X-App-Platform)
        const fetchResult = await page.evaluate(async (usr) => {
            try {
                const res = await fetch(`https://kick.com/api/v2/channels/${usr}/playback-url`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-App-Platform': 'web' // O segredo da Kick
                    }
                });
                
                const textBody = await res.text(); // Pega texto cru pra não quebrar se vier HTML
                return { 
                    success: true, 
                    status: res.status, 
                    body: textBody 
                };
            } catch(e) {
                return { success: false, error: e.message };
            }
        }, username);

        console.log(`[Passo 7] Resposta do Fetch Interno recebida:`);
        
        if (!fetchResult.success) {
            console.log(`   -> [ERRO NO FETCH] A função fetch explodiu no navegador: ${fetchResult.error}`);
            return { online: false, url: null, title: 'Erro de injeção JS' };
        }

        console.log(`   -> HTTP Status: ${fetchResult.status}`);
        console.log(`   -> Body (primeiros 150 chars): ${fetchResult.body.substring(0, 150)}`);

        // Passo 8 Atualizado com a nova estrutura da API da Kick
        if (fetchResult.status === 200) {
            try {
                const jsonData = JSON.parse(fetchResult.body);
                
                // 🔥 A MÁGICA AQUI: A Kick manda a URL dentro de "data" ou "playback_url"
                const finalUrl = jsonData.playback_url || jsonData.data;

                if (finalUrl) {
                    console.log(`[Passo 8] 🚀 SUCESSO ABSOLUTO! URL: ${finalUrl}`);
                    const finalTitle = await page.title();
                    return { online: true, url: finalUrl, title: finalTitle.replace(' | Kick', '').trim() };
                } else {
                    console.log(`[Passo 8] O JSON veio, mas não tem a URL de vídeo. O canal está offline.`);
                }
            } catch(e) {
                console.log(`[Passo 8] O corpo da resposta não é um JSON válido. A Kick mudou a API de novo?`);
            }
        } else {
            console.log(`[Passo 8] Falha HTTP na API da Kick (Status diferente de 200 OK).`);
        }

        return { online: false, url: null, title: 'Offline / Erro API' };

    } catch (error) {
        console.error(`[CRASH TOTAL] Erro no script Puppeteer:`, error);
        return { online: false, url: null, title: 'Erro interno' };
    } finally {
        console.log(`[Passo 9] Fechando navegador e finalizando fluxo.\n----------------------------------------\n`);
        await new Promise(r => setTimeout(r, 1500)); // Delay para você ver no console
        if (browser) await browser.close();
    }
}

export const getChannelStream = async (username) => {
    const cacheKey = `stream_${username}`;
    const cachedData = getCache(cacheKey);
    
    // Verifica o cache primeiro para não abrir o Puppeteer a toda hora
    if (cachedData) {
        console.log(`[Cache Hit] ${username}`);
        return cachedData;
    }

    console.log(`\n[API CALL] Recebida solicitação para o canal: ${username}`);
    
    // Ignoramos a via HTTP rápida porque o Cloudflare da Kick está bloqueando.
    // Vamos direto pro Puppeteer que é garantia de sucesso.
    let streamData = await fetchStreamPuppeteer(username);
    
    // Validação extra pós-Puppeteer
    if (streamData && streamData.online && streamData.url) {
        /* 
         * NOTA: Em alguns casos, o axios.head pode ser bloqueado pela AWS IVS.
         * Nós mantemos o aviso, mas NÃO invalidamos a stream se falhar, 
         * pois o nosso proxy backend resolverá o problema do CORS depois.
         */
        const isValid = await validateM3u8(streamData.url);
        if (!isValid) {
            console.log(`[Log] Aviso: A URL gerada não responde a um HEAD (Possível bloqueio de CORS da AWS), mas o proxy tentará resolver.`);
        }

        // Salva no cache por 45 segundos para poupar sua VPS de rodar o Chrome sem parar
        setCache(cacheKey, streamData, 45); 
    }

    return streamData;
};
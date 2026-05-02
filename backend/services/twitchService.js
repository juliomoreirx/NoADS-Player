import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getCache, setCache } from '../utils/cache.js';

puppeteer.use(StealthPlugin());

export const getTwitchStream = async (channel) => {
    const channelLower = channel.toLowerCase();
    const cacheKey = `twitch_${channelLower}`;
    const cachedData = getCache(cacheKey);
    
    if (cachedData) return cachedData;

    let browser;
    try {
        console.log(`\n[Twitch] 🕵️ Abrindo navegador para: ${channelLower}`);
        
        browser = await puppeteer.launch({
            headless: 'new', // Mantenha false para ver o bypass, mude para 'new' na VPS
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ]
        });
        
        const page = await browser.newPage();
        
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        // 1. Acessa a página para ganhar o "visto" do Cloudflare/Twitch
        await page.goto(`https://www.twitch.tv/${channelLower}`, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });

        console.log(`[Twitch] 🧪 Injetando extração GQL corrigida...`);

        const result = await page.evaluate(async (login) => {
            try {
                // Query simplificada e limpa para evitar erros de variáveis não usadas
                const GQL_QUERY = `query PlaybackAccessToken_Template($login: String!, $playerType: String!, $platform: String!) {
                    streamPlaybackAccessToken(channelName: $login, params: {platform: $platform, playerBackend: "mediaplayer", playerType: $playerType}) {
                        value
                        signature
                        __typename
                    }
                }`;

                const clientId = window.__twilightSettings?.clientId || 'kimne78kx3ncx6brgo4mv6wki5h1ko';

                const response = await fetch('https://gql.twitch.tv/gql', {
                    method: 'POST',
                    headers: {
                        'Client-Id': clientId,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        operationName: "PlaybackAccessToken_Template",
                        query: GQL_QUERY,
                        variables: {
                            login: login,
                            playerType: "site",
                            platform: "web"
                        }
                    })
                });

                const json = await response.json();
                return { 
                    success: !json.errors, 
                    data: json.data?.streamPlaybackAccessToken, 
                    error: json.errors ? json.errors[0].message : null 
                };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }, channelLower);

        if (!result.success || !result.data) {
            console.log(`[Twitch ❌] Falha no GQL:`, result.error);
            return { online: false, url: null, title: 'Offline ou Erro' };
        }

        const tokenData = result.data;

        // 2. Montagem da URL Usher usando os parâmetros do seu log
        const usherUrl = `https://usher.ttvnw.net/api/channel/hls/${channelLower}.m3u8?` + 
            `allow_source=true&` +
            `fast_bread=true&` +
            `player_backend=mediaplayer&` +
            `playlist_include_framerate=true&` +
            `sig=${tokenData.signature}&` +
            `token=${encodeURIComponent(tokenData.value)}`;

        console.log(`[Twitch ✅] SUCESSO! URL capturada.`);
        
        const streamData = { online: true, url: usherUrl, title: `${channelLower} na Twitch` };
        setCache(cacheKey, streamData, 60); 
        return streamData;

    } catch (error) {
        console.error(`[Twitch Erro] Falha no processo:`, error.message);
        return { online: false, url: null, title: 'Erro de conexão' };
    } finally {
        if (browser) await browser.close();
    }
};
import axios from 'axios';

export const proxyStream = async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('URL ausente');
    }

    // Identifica a plataforma para aplicar os headers corretos
    const isTwitch = targetUrl.includes('ttvnw.net') || targetUrl.includes('twitch.tv');
    
    const DYNAMIC_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'DNT': '1',
        'Referer': isTwitch ? 'https://www.twitch.tv/' : 'https://kick.com/',
        'Origin': isTwitch ? 'https://www.twitch.tv' : 'https://kick.com'
    };

    try {
        // 1. Se for fragmento de vídeo (.ts)
        if (!targetUrl.includes('.m3u8')) {
            const response = await axios({
                method: 'get',
                url: targetUrl,
                headers: DYNAMIC_HEADERS,
                responseType: 'stream'
            });
            
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', response.headers['content-type']);
            return response.data.pipe(res);
        }

        // 2. Se for a playlist (.m3u8), precisamos reescrever as URLs internas
        const response = await axios.get(targetUrl, { headers: DYNAMIC_HEADERS });
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        
        const rewrittenM3u8 = response.data.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                let absoluteUrl = trimmed;
                if (!trimmed.startsWith('http')) absoluteUrl = baseUrl + trimmed;
                return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
            }
            // Suporte para tags de mídia e prefetch da Twitch
            if ((trimmed.startsWith('#EXT-X-MEDIA') || trimmed.startsWith('#EXT-X-TWITCH-PREFETCH')) && trimmed.includes('URI="')) {
                return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
                    let absUri = uri.startsWith('http') ? uri : baseUrl + uri;
                    return `URI="/api/proxy?url=${encodeURIComponent(absUri)}"`;
                });
            }
            return line;
        }).join('\n');

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        return res.send(rewrittenM3u8);

    } catch (error) {
        console.error(`[Proxy Error] Falha: ${error.message}`);
        return res.status(500).send('Erro no proxy de transmissão');
    }
};
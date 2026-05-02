import { getChannelStream as getKickStream } from '../services/kickService.js';
import { getTwitchStream } from '../services/twitchService.js';

export const fetchStream = async (req, res) => {
    const { platform, username } = req.params;

    if (!username || !platform) {
        return res.status(400).json({ error: 'Plataforma e Username são obrigatórios' });
    }

    try {
        let streamInfo;
        
        if (platform === 'kick') {
            streamInfo = await getKickStream(username);
        } else if (platform === 'twitch') {
            streamInfo = await getTwitchStream(username);
        } else {
            return res.status(400).json({ error: 'Plataforma não suportada' });
        }

        return res.status(200).json(streamInfo);
    } catch (error) {
        console.error(`Erro no controller para ${username}:`, error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
const addStreamBtn = document.getElementById('addStreamBtn');
const channelInput = document.getElementById('channelInput');
const platformSelect = document.getElementById('platformSelect');
const streamsContainer = document.getElementById('streamsContainer');

let streamIdCounter = 0;

addStreamBtn.addEventListener('click', () => {
    const channel = channelInput.value.trim();
    const platform = platformSelect.value;
    
    if (channel) {
        createStreamCard(platform, channel);
        channelInput.value = ''; 
    }
});

channelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addStreamBtn.click();
});

async function createStreamCard(platform, username) {
    streamIdCounter++;
    const currentId = streamIdCounter;
    const cardId = `stream-card-${currentId}`;
    const videoId = `video-${currentId}`;

    let chatUrl = '';
    if (platform === 'kick') {
        chatUrl = `https://kick.com/popout/${username}/chat`;
    } else if (platform === 'twitch') {
        // parent=localhost é obrigatório para rodar em desenvolvimento
        chatUrl = `https://www.twitch.tv/embed/${username}/chat?parent=localhost`;
    }

    const cardHtml = `
        <div id="${cardId}" class="flex flex-col xl:flex-row bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700 h-[500px] xl:h-[600px] relative">
            <button onclick="document.getElementById('${cardId}').remove()" class="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center z-50 shadow-md">
                ✕
            </button>
            <div class="flex-1 relative bg-black">
                <div class="absolute top-2 left-2 z-40 bg-black/60 px-3 py-1 rounded text-xs font-bold flex items-center gap-2">
                    <span id="status-${currentId}" class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    <span class="uppercase">${platform}: ${username}</span>
                </div>
                <video id="${videoId}" class="w-full h-full object-contain" controls autoplay muted></video>
            </div>
            <div class="w-full xl:w-[350px] h-64 xl:h-full bg-gray-900 border-l border-gray-700">
                <iframe src="${chatUrl}" class="w-full h-full border-none"></iframe>
            </div>
        </div>
    `;

    streamsContainer.insertAdjacentHTML('beforeend', cardHtml);

    try {
        const response = await fetch(`/api/stream/${platform}/${username}`);
        const data = await response.json();
        const statusIndicator = document.getElementById(`status-${currentId}`);
        const videoEl = document.getElementById(videoId);

        if (data.online && data.url) {
            statusIndicator.className = "w-2 h-2 rounded-full bg-green-500";
            
            // 🔥 TUDO passa pelo nosso Proxy para evitar erro de CORS
            const proxiedUrl = `/api/proxy?url=${encodeURIComponent(data.url)}`;

            if (Hls.isSupported()) {
                const hls = new Hls({ maxBufferLength: 30, enableWorker: true });
                hls.loadSource(proxiedUrl);
                hls.attachMedia(videoEl);
                hls.on(Hls.Events.MANIFEST_PARSED, () => videoEl.play());
            } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
                videoEl.src = proxiedUrl;
            }
        } else {
            statusIndicator.className = "w-2 h-2 rounded-full bg-gray-500";
        }
    } catch (error) {
        console.error("Erro ao carregar stream:", error);
    }
}
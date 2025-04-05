const fetchTimestamps = async (url: string): Promise<number[][] | null> => {
    try {
      const response = await fetch(`http://localhost:8000/extension/Generate_Sponsorship_Timestamps?yt_url=${encodeURIComponent(url)}`);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Błąd pobierania timestampów:", err);
      return null;
    }
  };
  
  const applyTimeStamps = async (tabId: number, timestamps: number[][]) => {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (timestamps) => {
        const video = document.querySelector('video');
        if (!video || !Array.isArray(timestamps)) return;
        const currentTime = video.currentTime;
        for (const [start, end] of timestamps) {
          if (currentTime >= start && currentTime <= end) {
            console.log(`W tle: przeskakuję segment ${start} - ${end}`);
            video.currentTime = end;
            break;
          }
        }
      },
      args: [timestamps]
    });
  };
  
  // Monitoruj aktywne karty co sekundę
  setInterval(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    if (tab?.url?.includes("youtube.com/watch") && tab.id) {
      const timestamps = await fetchTimestamps(tab.url);
      if (timestamps) {
        applyTimeStamps(tab.id, timestamps);
      }
    }
  }, 2000);
  
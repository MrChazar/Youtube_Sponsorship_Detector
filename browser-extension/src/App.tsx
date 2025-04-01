import { useState, useEffect, useRef } from 'react';
import './styles/App.css';
import axios from 'axios';

function App() {
  const currentUrl = useRef<string>('');
  const [videoTime, setVideoTime] = useState<number | null>(null);
  const [isYoutube, setIsYoutube] = useState<boolean | null>(null);
  const [timeStamps, setTimeStamps] = useState<number[][] | null>(null);
  const [loadingResponse, setLoadingResponse] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const fetchTimestamps = async (url: string) => {
    setLoadingResponse(true);
    setError(false);
    try {
      const response = await axios.get(
        'http://localhost:8000/extension/Generate_Sponsorship_Timestamps', 
        {
          params: {
            yt_url: url,
          }
        }
      );
      
      setTimeStamps(response.data);
      setLoadingResponse(false);
      return response.data;
    } 
    catch (error) {
      console.error("Błąd Axios:", error);
      setLoadingResponse(false);
      setError(true);
      return null;
    }
  };

  const applyTimeStamps = async (tabId: number, timeStamps: number[][] | any) => {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (timestamps) => {
        const video = document.querySelector('video');
        console.log("te timestampy", timeStamps)
        console.log("wideo", video?.currentTime)
        if (!video || !timestamps) return;
        
        const currentTime = video.currentTime;
        for (const [start, end] of timestamps) {
          // Margines 0.5s przed rozpoczęciem segmentu
          console.log("dany moment", start, end)
          console.log(currentTime)
          if (currentTime >= start - 0.5 && currentTime < start + 0.5) {
            video.currentTime = end;
            console.log(`Skipped segment ${start}-${end}`);
            break;
          }
        }
      },
      args: [timeStamps]
    });
  };

  const getCurrentTabInfo = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url && tab.url !== currentUrl.current) {
        currentUrl.current = tab.url;
        const youtubeCheck = tab.url.includes('youtube.com/watch');
        setIsYoutube(youtubeCheck);
        
        if (youtubeCheck) {
          console.log("STrzał");
          await fetchTimestamps(tab.url);
          
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            func: () => {
              const video = document.querySelector('video');
              return video ? Math.floor(video.currentTime) : null;
            }
          });


          
          setVideoTime(results[0].result ?? null);
        } else {
          setVideoTime(null);
          setTimeStamps(null);
        }
      }
    } catch (error) {
      console.error('Error getting tab info:', error);
    }
  };

  const updateVideoTime = async () => {
    if (!isYoutube) return;
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const video = document.querySelector('video');
        return video ? Math.floor(video.currentTime) : null;
      }
    });
    
    setVideoTime(results[0].result ?? null);
    console.log(timeStamps)
    await applyTimeStamps(tab.id, timeStamps);
  };

  // Nasłuchuj zmian URL i aktualizacji czasu
  useEffect(() => {
      getCurrentTabInfo();
  }, []);


  // Aktualizuj czas wideo na YouTube co sekundę
  useEffect(() => {
    let interval: number;
    
    if (isYoutube) {
      interval = setInterval(updateVideoTime, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isYoutube]);

  return (
    <>
      <h1>Dodatek</h1>
      <div className="card">    
        <div className="tab-info">
          <h3>Informacje o stronie:</h3>
          <p><strong>URL:</strong> {currentUrl.current || 'Brak danych'}</p>
          
          {isYoutube && videoTime !== null && (
            <>
              <p><strong>Aktualny czas wideo:</strong> {videoTime} sekund</p>
              
              <div>
                <strong>Aktualne TimeStampy:</strong>
                {loadingResponse ? (
                  <p>Ładowanie...</p>
                ) : error ? (
                  <p className="error">Błąd podczas pobierania timestampów</p>
                ) : timeStamps ? (
                  <ul>
                   {timeStamps.map((ts, index) => {
                    const [start, end] = Array.isArray(ts) ? ts : [0, 0];
                    return (
                      <li key={index}>
                        Moment: {start}, {end}
                      </li>
                    );
                    })}
                  </ul>
                ) : (
                  <p>Brak timestampów</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
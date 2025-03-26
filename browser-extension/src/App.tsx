import { useState, useEffect } from 'react';
import './styles/App.css';

function App() {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [videoTime, setVideoTime] = useState<number | null>(null);
  const [isYoutube, setIsYoutube] = useState<boolean | null>(null);

  const getCurrentTabInfo = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab?.url) {
        setCurrentUrl(tab.url);
        setIsYoutube(tab.url.includes('youtube.com/watch'));
        
        if (tab.url.includes('youtube.com/watch')) {
          // Pobierz czas odtwarzania wideo
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            func: () => {
              const video = document.querySelector('video');
              return video ? Math.floor(video.currentTime) : null;
            }
          });
          
          // Jawna obsługa undefined
          if (results[0].result !== undefined) {
            setVideoTime(results[0].result); // result może być number lub null
          } else {
            setVideoTime(null); // lub inna domyślna wartość
          }
        } else {
          setVideoTime(null);
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
    
      // Jawna obsługa undefined
      if (results[0].result !== undefined) {
        setVideoTime(results[0].result); // result może być number lub null
      } else {
        setVideoTime(null); // lub inna domyślna wartość
      }
  };

  useEffect(() => {
    getCurrentTabInfo();
    
    // Aktualizuj co sekundę, jeśli to YouTube
    let interval: number;
    if (isYoutube) {
      interval = setInterval(updateVideoTime, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isYoutube]);

  const onclick = async () => {
    let [tab] = await chrome.tabs.query({ active: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      func: () => {
        alert('Modyfikowanie strony');
        document.body.style.backgroundColor = 'red';
      }
    });
  };

  return (
    <>
      <h1>Dodatek</h1>
      <div className="card">
        <button onClick={onclick}>
          Kliknij
        </button>
        
        <div className="tab-info">
          <h3>Informacje o stronie:</h3>
          <p><strong>URL:</strong> {currentUrl || 'Brak danych'}</p>
          {isYoutube && videoTime !== null && (
            <p><strong>Aktualny czas wideo:</strong> {videoTime} sekund</p>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
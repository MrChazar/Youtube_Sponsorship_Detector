import { useState, useEffect } from 'react';
import '../src/App.css';

function App() {
    const [currentTabState, setCurrentTabState] = useState({
        url: null,
        isYoutube: false,
        isLoading: false,
        hasError: false,
        timestamps: null,
        currentTime: null
    });

    useEffect(() => {
        console.log("[Popup] Dodanie nasłuchiwania wiadomości.");
        const handleMessage = (request, sender, sendResponse) => {
            console.log("[Popup] Otrzymano wiadomości:", request);
            if (request.type === 'DATA_UPDATE') {
                setCurrentTabState(request.data);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);

        chrome.runtime.sendMessage({ type: 'REQUEST_DATA' }).catch(error => {
            console.warn("[Popup] Błąd podczas próby pobrania danych z skryptu background:", error);
            setCurrentTabState({
                url: "Błąd ładowania...",
                isYoutube: false,
                isLoading: false,
                hasError: true,
                timestamps: null,
                currentTime: null
            });
        });

        return () => {
            console.log("[Popup] Usunięcie nasłuchiwania.");
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []);

    const { url, isYoutube, isLoading, hasError, timestamps, currentTime } = currentTabState;

    return (
        <div className="popup-container">
            <h1 className="popup-title">YouTube Sponsorship Detector</h1>
            
            <div className="info-section">
                <h2 className="section-title">Informacje o stronie</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <span className="info-label">URL:</span>
                        <span className="info-value url">{url || 'Brak danych'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Strona YouTube:</span>
                        <span className="info-value">{isYoutube ? 'Tak' : 'Nie'}</span>
                    </div>
                </div>
            </div>

            {isYoutube && (
                <>
                    <div className="info-section">
                        <h2 className="section-title">Segmenty sponsorowane</h2>
                        {isLoading ? (
                            <div className="loading">Ładowanie danych...</div>
                        ) : hasError ? (
                            <div className="error-message">❌ Błąd podczas pobierania timestampów</div>
                        ) : timestamps && timestamps.length > 0 ? (
                            <ul className="timestamps-list">
                                {timestamps.map((ts, index) => {
                                    const [start, end] = Array.isArray(ts) && ts.length >= 2 ? ts : [0, 0];
                                    return (
                                        <li key={index} className="timestamp-item">
                                            <span className="timestamp-range">
                                                {formatTime(start)} - {formatTime(end)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="no-sponsors">🎉 Brak wykrytych segmentów sponsorowanych!</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// Funkcja pomocnicza do formatowania czasu
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default App;
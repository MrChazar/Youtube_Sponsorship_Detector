import { useState, useEffect } from 'react';
import '../src/App.css'; // Upewnij się, że ścieżka jest poprawna

function App() {
    // Stan popupa odzwierciedla dane otrzymane ze skryptu w tle background
    const [currentTabState, setCurrentTabState] = useState({
        url: null,
        isYoutube: false,
        isLoading: false,
        hasError: false,
        timestamps: null,
        currentTime: null
    });

    // Nasłuchiwanie na wiadomości od skryptu w tle background
    useEffect(() => {
        console.log("[Popup] Dodanie nasłuchiwania wiadomości.");
        const handleMessage = (request, sender, sendResponse) => {
            console.log("[Popup] Otrzymano wiadomości:", request);
            if (request.type === 'DATA_UPDATE') {
                setCurrentTabState(request.data);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);

        //Jak otwieramy pop-up to poproś o dane
        chrome.runtime.sendMessage({ type: 'REQUEST_DATA' }).catch(error => {
             // Złap błąd, jeśli Service Worker jeszcze się nie uruchomił lub jest uśpiony
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


        // Funkcja czyszcząca listener po zamknięciu popupa
        return () => {
             console.log("[Popup] Usunięcie nasłuchiwania.");
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }, []); // Ta pusta tablica oznacza że ten kod uruchomi się tylko raz na początku działania kodu

    // Rozpakowywanie stanu
    const { url, isYoutube, isLoading, hasError, timestamps, currentTime } = currentTabState;

    return (
        <>
            <h1>Yotube Sponsorship Detector</h1>
            <div className="card">
                <div className="tab-info">
                    <h3>Informacje o stronie:</h3>
                    <p><strong>URL:</strong> {url || 'Brak danych'}</p>

                    {isYoutube ? (
                        <>
                            <p><strong>Strona YouTube:</strong> Tak</p>
                            {currentTime !== null && (
                                <p><strong>Aktualny czas wideo:</strong> {currentTime} sekund</p>
                            )}

                            <div>
                                <strong>Timestampy sponsorowane:</strong>
                                {isLoading ? (
                                    <p>Ładowanie...</p>
                                ) : hasError ? (
                                    <p className="error">Błąd podczas pobierania timestampów</p>
                                ) : timestamps && timestamps.length > 0 ? (
                                    <ul>
                                        {timestamps.map((ts, index) => {
                                            const [start, end] = Array.isArray(ts) && ts.length >= 2 ? ts : [0, 0];
                                            return (
                                                <li key={index}>
                                                    Segment: {start}s - {end}s
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p>Brak wykrytych segmentów sponsorowanych dla tego filmu.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <p>Brak szczegółów</p>
                    )}
                </div>
            </div>
        </>
    );
}

export default App;
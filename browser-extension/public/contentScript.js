let currentTimestamps = null;
let videoElement = null;

console.log("[Content Script] Załadowany.");

// Funkcja do znalezienia elementu wideo
function findVideo() {
    videoElement = document.querySelector('video');
    if (videoElement) {
        console.log("[Content Script] Film znaleziony.");
        addTimeUpdateListener();
        // Możemy od razu poprosić background script o timestampy, jeśli jeszcze ich nie mamy
        // (choć background script powinien je wysłać po załadowaniu)
        // chrome.runtime.sendMessage({ type: 'REQUEST_TIMESTAMPS' }); // Alternatywa
    } else {
        console.log("[Content Script] Nadal nie znaleziono filmu próbujemy dalej.");
        setTimeout(findVideo, 1000); // Prosta próba ponowienia po 1 sekundzie
    }
}

// Funkcja do dodania listenera na 'timeupdate'
function addTimeUpdateListener() {
    if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        console.log("[Content Script] 'timeupdate' Nasłuchiwane dodanie.");
    }
}

// Handler zdarzenia 'timeupdate'
function handleTimeUpdate() {
    if (!videoElement || !currentTimestamps || !Array.isArray(currentTimestamps)) {
        return; // Brak wideo lub timestampów, nic nie robimy jest chillera
    }

    const currentTime = videoElement.currentTime;

    // Aplikuj logikę przeskakiwania bezpośrednio tutaj
    for (const [start, end] of currentTimestamps) {
        // Dodajemy małą tolerancję na koniec segmentu, żeby uniknąć ciągłych przeskoków przy granicy
        const tolerance = 0.1; // 100 ms tolerancji jeśli chcecie więcej można zmienić

        if (currentTime >= start && currentTime < end - tolerance) {
             console.log(`[Content Script] Wykryto fragment sponsorowany: ${start} - ${end}. Pomijanie...`);
             videoElement.currentTime = end; 
             // Myślałem też żeby dodać jakąś informajcę typu alert że pominięto coś w tym stylu
             alert("Pominięto fragment!!!!!!!")
             break; 
        }
    }

    // aktualizacja czasu bardzo częsta do poprawienia pewnie bo teraz co sekunde
    if (Math.floor(currentTime) !== Math.floor(lastReportedTime)) { 
    chrome.runtime.sendMessage({
        type: 'TIME_UPDATE',
        currentTime: currentTime
    }).catch(error => {
            // Ignoruj błędy, jeśli background script nie nasłuchuje (np. jest uśpiony)
            if (error.message !== "Nie można ustanowić połączenia.") {
                console.warn("[Content Script] Błąd podczas wysyłania TIME_UPDATE:", error);
            }
        });
    lastReportedTime = currentTime;
    }
}

let lastReportedTime = -1; 


// Komunikacja: Nasłuchiwanie na wiadomości od background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("[Content Script] Otrzymane wiadomości:", request);
    switch (request.type) {
        case 'SET_TIMESTAMPS':
            // Otrzymano timestampy z background script
            currentTimestamps = request.timestamps;
            console.log("[Content Script] Timestampy otrzymane:", currentTimestamps);
            // Jeśli wideo już znaleziono, od razu dodaj listenera (choć powinien być już dodany przez findVideo)
            if (videoElement) {
                 addTimeUpdateListener();
            } else {
                 // Jeśli wideo jeszcze nie znaleziono, findVideo doda listenera po znalezieniu
            }
            break;
    }
});

// Rozpocznij szukanie elementu wideo, gdy skrypt treści zostanie wstrzyknięty
findVideo();

// Czyste sprzątanie listenera, gdy strona jest usuwana/zmieniana
window.addEventListener('beforeunload', () => {
    if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        console.log("[Content Script] 'timeupdate' listener removed on unload.");
    }
});
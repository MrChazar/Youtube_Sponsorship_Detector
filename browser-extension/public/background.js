// Obiekt do przechowywania stanu dla każdej karty
const tabStates = {};

// Funkcja do pobierania timestampów
async function fetchTimestamps(url) {
    try {
        // Zmieniono axiosa na fetcha bo był problem wsadzić axiosa
        const response = await fetch(
            `http://localhost:8000/extension/Generate_Sponsorship_Timestamps?yt_url=${encodeURIComponent(url)}`
        );

        if (!response.ok) {
            throw new Error(`Błąd HTTP status: ${response.status}`);
        }

        const data = await response.json();
        console.log("[Background] Pobrane timestampy:", data);
        return data; 
    } catch (error) {
        console.error("[Background] Błąd pobierania timestampów:", error);
        throw error; 
    }
}

// Funkcja do wstrzykiwania skryptu treści i inicjowania go
async function initializeContentScript(tabId, url) {
     if (!tabId || !url || !url.startsWith('https://www.youtube.com/watch?')) {
         console.log("[Background] Nie jest to strona yt");
         delete tabStates[tabId]; // Wyczyść stan dla tej karty, jeśli była YouTube
         return;
     }

     console.log(`[Background] Inicjalizacja karty: ${tabId} z adresem: ${url}`);

     // Zresetuj stan dla nowej strony/filmu
     tabStates[tabId] = {
         url: url,
         isYoutube: true,
         isLoading: true,
         hasError: false,
         timestamps: null,
         currentTime: null // Czas będzie aktualizowany przez content script
     };

     // Poinformuj popup o nowym stanie ładowania
     notifyPopups(tabId);

     try {
         // Wstrzyknij skrypt treści
         await chrome.scripting.executeScript({
             target: { tabId: tabId },
             files: ['contentScript.js']
         });
         console.log(`[Background] contentScript.js wstrzyknięty do karty: ${tabId}`);

         // Pobierz timestampy po wstrzyknięciu skryptu
         const timestamps = await fetchTimestamps(url);

         // Zaktualizuj stan z timestampami
         tabStates[tabId].timestamps = timestamps;
         tabStates[tabId].isLoading = false;
         tabStates[tabId].hasError = false;

         // Wyślij timestampy do content script
         chrome.tabs.sendMessage(tabId, {
             type: 'SET_TIMESTAMPS',
             timestamps: timestamps
         });
         console.log(`[Background] Wysłano timestampy do ${tabId}`);

     } catch (error) {
         console.error(`[Background] Wystąpił błąd z inicjalizacją skryptu lub pobraniem timestampów dla karty: ${tabId}:`, error);
         tabStates[tabId].isLoading = false;
         tabStates[tabId].hasError = true;
     }

     // Poinformuj popup o zaktualizowanym stanie (z timestampami lub błędem)
     notifyPopups(tabId);
}


// Nasłuchiwanie na aktualizacje kart (np. zmiana URL)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    
    if (changeInfo.url && tab.url && tab.url.startsWith('https://www.youtube.com/watch?')) {
         // Uruchom proces inicjalizacji dla nowej strony
         initializeContentScript(tabId, tab.url);
    } else if (changeInfo.url && tabStates[tabId] && tabStates[tabId].isYoutube && !tab.url.startsWith('https://www.youtube.com/watch?')) {
         // Jeśli zmieniono z YouTube na inną stronę, wyczyść stan
         console.log(`[Background] Karta ${tabId} Znawigowana poza youtube.`);
         delete tabStates[tabId];
         notifyPopups(tabId); 
    } else if (tabStates[tabId]) {
         // Jeśli strona jest wciąż YouTube, ale zmieniło się coś innego
         // Możemy wysłać aktualny stan do popupów (np. zmiana tytułu strony)
         notifyPopups(tabId);
    }
});

// Nasłuchiwanie na aktywację karty (przełączenie na inną kartę)
chrome.tabs.onActivated.addListener(activeInfo => {
    // Gdy użytkownik przełączy kartę, sprawdź, czy jest to YouTube i powiadom popupy
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tabStates[activeInfo.tabId]) {
            notifyPopups(activeInfo.tabId);
        } else if (tab && tab.url && tab.url.startsWith('https://www.youtube.com/watch?')) {
             // Jeśli przełączamy na kartę YouTube, której nie śledziliśmy (np. po restarcie przeglądarki?)
             // Możemy zainicjalizować ją teraz
             initializeContentScript(activeInfo.tabId, tab.url);
        } else {
             // Jeśli przełączamy na kartę inną niż YouTube, a popup jest otwarty,
             // musimy poinformować popup, że nie ma danych z YouTube
             notifyPopups(activeInfo.tabId); // Wyśle pusty stan dla tej karty
        }
    });
});

// Nasłuchiwanie na usunięcie karty
chrome.tabs.onRemoved.addListener(tabId => {
    // Wyczyść stan, gdy karta jest zamykana
    if (tabStates[tabId]) {
        console.log(`[Background] Karta ${tabId} zamknięta czyszczenie stanu.`);
        delete tabStates[tabId];
        // Nie musimy powiadamiać popupów, bo zazwyczaj zamykają się z kartą,
    }
});


// Komunikacja: Nasłuchiwanie na wiadomości od innych części rozszerzenia (popup, content script)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("[Background] Otrzymanow wiadomość:", request);
    const tabId = sender.tab ? sender.tab.id : null;

    switch (request.type) {
        case 'TIME_UPDATE':
            // Wiadomość od content script: aktualny czas wideo
            if (tabId && tabStates[tabId]) {
                tabStates[tabId].currentTime = Math.floor(request.currentTime);
                // w content script w listenerze 'timeupdate'.
                // Wysłanie danych do popupów, jeśli są otwarte:
                notifyPopups(tabId);
            }
            break;

        case 'REQUEST_DATA':
            // Wiadomość od popupa: prośba o aktualne dane
            if (tabId) {
                // Odpowiedź ze stanem dla aktywnej karty
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                     if (tabs[0]) {
                        debugger
                        console.log("[Background] Dane tabs", tabs[0])
                         const activeTabId = tabs[0].id;
                         sendResponse({
                             type: 'DATA_UPDATE',
                             data: tabStates[activeTabId] || { url: tabs[0].url, isYoutube: tabs[0].url.startsWith('https://www.youtube.com/watch?'), isLoading: tabs[0].isLoading, hasError: tabs[0].hasError, timestamps: tabs[0].timestamps, currentTime: tabs[0].currentTime }
                         });
                     } else {
                          // Brak aktywnej karty
                         sendResponse({
                             type: 'DATA_UPDATE',
                             data: { url: null, isYoutube: false, isLoading: false, hasError: false, timestamps: null, currentTime: null }
                         });
                     }
                 });
            } else {
                 // Jeśli wiadomość nie przyszła z karty (np. z popupu bez tabId),
                 // musimy znaleźć aktywną kartę, aby pobrać jej stan.
                 chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                     if (tabs[0]) {
                          const activeTabId = tabs[0].id;
                          sendResponse({
                              type: 'DATA_UPDATE',
                              data: tabStates[activeTabId] || { url: tabs[0].url, isYoutube: tabs[0].url.startsWith('https://www.youtube.com/watch?'), isLoading: tabs[0].isLoading, hasError: tabs[0].hasError, timestamps: tabs[0].timestamps, currentTime: tabs[0].currentTime }
                          });
                     } else {
                           // Brak aktywnej karty
                          sendResponse({
                              type: 'DATA_UPDATE',
                              data: { url: null, isYoutube: false, isLoading: false, hasError: false, timestamps: null, currentTime: null }
                          });
                     }
                 });
            }
            return true;
    }
});

// Funkcja pomocnicza do wysyłania aktualnego stanu do wszystkich otwartych popupów
// (Popupy nasłuchują na runtime.onMessage)
function notifyPopups(tabIdToSendStateFor) {
     // Możemy wysłać stan dla konkretnej karty, jeśli chcemy, lub dla aktywnej.
     // W tym przypadku, gdy popup jest otwarty, zazwyczaj chcemy stan aktywnej karty.
     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         if (tabs[0]) {
             const activeTabId = tabs[0].id;
             // Wysyłamy wiadomość globalnie, a popupy same sprawdzą, czy są otwarte, jebie się to w przypadku gdy pobierają się timestampy
             // i czy wiadomość jest dla nich istotna (choć tu wysyłamy zawsze stan aktywnej karty)
             chrome.runtime.sendMessage({
                 type: 'DATA_UPDATE',
                 data: tabStates[activeTabId] || { url: tabs[0].url, isYoutube: tabs[0].url.startsWith('https://www.youtube.com/watch?'), isLoading: tabs[0].isLoading, hasError: tabs[0].hasError, timestamps: tabs[0].timestamps, currentTime: tabs[0].currentTime }
             }).catch(error => {
                 // Ignorujemy błędy, jeśli nie ma otwartego popupu
                 if (error.message !== "Nie można ustanowić połączenia.") {
                     console.warn("[Background] Błąd wysyłania wiadomości do pop up.", error);
                 }
             });
         } else {
              // Brak aktywnej karty - np. wszystkie okna zamknięte oprócz okna rozszerzenia
              chrome.runtime.sendMessage({
                  type: 'DATA_UPDATE',
                  data: { url: null, isYoutube: false, isLoading: false, hasError: false, timestamps: null, currentTime: null }
              }).catch(error => {
                  if (error.message !== "Nie można ustanowić połączenia.") {
                      console.warn("[Background] Błąd wysyłania wiadomości do pop up.", error);
                  }
              });
         }
     });
}

// Initializacja przy starcie Service Worker (np. po instalacji/aktualizacji)
// Możemy sprawdzić aktualną kartę przy starcie, ale onActivated i onUpdated
// i tak złapią większość przypadków. Ten listener jest bardziej dla logowania/debugowania.
chrome.runtime.onInstalled.addListener(() => {
    console.log("[Background] Service worker nie zainstalowany");
    // Można tu dodać logikę migracji danych lub ustawień początkowych
});
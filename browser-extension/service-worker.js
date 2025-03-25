// Service-Worker służy do przechwytywania wydarzeń
// w obrębie naszego dodatku


// Wysłuchiwanie eventu gdy naciśniemy dodatek

// chrome.action.onClicked.addListener(tab =>{
//     chrome.scripting.executeScript({
//         target: {tabId: tab.id},
//         func: () => {
//             alert('Hello from extension');
//         }
//     });
// });
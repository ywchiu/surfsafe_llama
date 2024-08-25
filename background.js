chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'inject_and_translate') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        files: ['content.js']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          sendResponse({status: 'error', message: chrome.runtime.lastError.message});
        } else {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'translate'}, (response) => {
            sendResponse(response);
          });
        }
      });
    });
    return true;  // Indicates that the response is sent asynchronously
  }
});

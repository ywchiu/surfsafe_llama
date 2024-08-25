let settings = {};

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
    chrome.storage.sync.get(['apiKey', 'apiUrl', 'alwaysInspect', 'clickInspect', 'systemPrompt'], (result) => {
        settings = result;
        console.log('Initial settings loaded:', settings);
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Received message:', request);
    if (request.action === "updateSettings") {
        settings = request.settings;
        chrome.storage.sync.set(settings, () => {
            console.log('Settings updated:', settings);
            sendResponse({status: 'Settings updated'});
        });
    } else if (request.action === "updateAlwaysInspect") {
        settings.alwaysInspect = request.value;
        chrome.storage.sync.set({alwaysInspect: request.value}, () => {
            console.log('Always Inspect updated:', request.value);
            sendResponse({status: 'Always Inspect updated'});
        });
    } else if (request.action === "updateClickInspect") {
        settings.clickInspect = request.value;
        chrome.storage.sync.set({clickInspect: request.value}, () => {
            console.log('Click Inspect updated:', request.value);
            sendMessageToActiveTab({action: "toggleClickInspect", value: settings.clickInspect});
            sendResponse({status: 'Click Inspect updated'});
        });
    }
    return true;  // Indicates that the response is sent asynchronously
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && settings.alwaysInspect) {
        console.log('Page loaded, starting inspection');
        sendMessageToTab(tabId, {action: "startInspection"});
    }
});

function sendMessageToActiveTab(message) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            sendMessageToTab(tabs[0].id, message);
        }
    });
}

function sendMessageToTab(tabId, message) {
    chrome.tabs.sendMessage(tabId, message, function(response) {
        if (chrome.runtime.lastError) {
            console.log('Error sending message:', chrome.runtime.lastError.message);
            // If content script is not ready, inject it manually
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            }, function() {
                // Retry sending the message after injecting the script
                chrome.tabs.sendMessage(tabId, message, function(response) {
                    if (chrome.runtime.lastError) {
                        console.log('Error sending message after injection:', chrome.runtime.lastError.message);
                    } else {
                        console.log('Message sent successfully after injection');
                    }
                });
            });
        } else {
            console.log('Message sent successfully');
        }
    });
}
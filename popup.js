document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('save');
    const startInspectionButton = document.getElementById('startInspection');
    const setSystemPromptButton = document.getElementById('setSystemPrompt');
    const saveSystemPromptButton = document.getElementById('saveSystemPrompt');
    const backToMainButton = document.getElementById('backToMain');
    const apiKeyInput = document.getElementById('apiKey');
    const apiUrlInput = document.getElementById('apiUrl');
    const modelNameInput = document.getElementById('modelName');
    const clickInspectCheckbox = document.getElementById('clickInspect');
    const systemPromptTextarea = document.getElementById('systemPrompt');
    const mainPage = document.getElementById('mainPage');
    const systemPromptPage = document.getElementById('systemPromptPage');

    console.log('Popup DOM fully loaded and parsed');

    // Load saved settings
    chrome.storage.sync.get(['apiKey', 'apiUrl', 'modelName', 'clickInspect', 'systemPrompt'], function(result) {
        console.log('Loaded settings:', result);
        apiKeyInput.value = result.apiKey || '';
        apiUrlInput.value = result.apiUrl || '';
        modelNameInput.value = result.modelName || 'gpt-4o-mini';
        clickInspectCheckbox.checked = result.clickInspect || false;
        systemPromptTextarea.value = result.systemPrompt || '';
    });

    // Save settings
    saveButton.addEventListener('click', function() {
        console.log('Save button clicked');
        const settings = {
            apiKey: apiKeyInput.value,
            apiUrl: apiUrlInput.value,
            modelName: modelNameInput.value,
            clickInspect: clickInspectCheckbox.checked
        };

        chrome.storage.sync.set(settings, function() {
            console.log('Settings saved:', settings);
            chrome.runtime.sendMessage({action: "updateSettings", settings: settings}, response => {
                console.log('Response from updateSettings:', response);
            });
        });
    });

    // Start Inspection
    startInspectionButton.addEventListener('click', function() {
        console.log('Start Inspection button clicked');
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "startInspection"}, response => {
                console.log('Response from startInspection:', response);
            });
        });
    });

    // Handle Click Inspect checkbox change
    clickInspectCheckbox.addEventListener('change', function() {
        console.log('Click Inspect checkbox changed:', this.checked);
        chrome.storage.sync.set({clickInspect: this.checked});
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "toggleClickInspect", value: clickInspectCheckbox.checked}, response => {
                console.log('Response from toggleClickInspect:', response);
            });
        });
    });

    // Show system prompt page
    setSystemPromptButton.addEventListener('click', function() {
        console.log('Set System Prompt button clicked');
        mainPage.style.display = 'none';
        systemPromptPage.style.display = 'block';
    });

    // Save system prompt and return to main page
    saveSystemPromptButton.addEventListener('click', function() {
        console.log('Save System Prompt button clicked');
        chrome.storage.sync.set({systemPrompt: systemPromptTextarea.value}, function() {
            console.log('System prompt saved:', systemPromptTextarea.value);
            mainPage.style.display = 'block';
            systemPromptPage.style.display = 'none';
        });
    });

    // Return to main page without saving
    backToMainButton.addEventListener('click', function() {
        console.log('Back to Main button clicked');
        mainPage.style.display = 'block';
        systemPromptPage.style.display = 'none';
    });
});
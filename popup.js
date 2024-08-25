document.getElementById('save').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value;
  const apiUrl = document.getElementById('apiUrl').value;
  
  chrome.storage.sync.set({ apiKey, apiUrl }, () => {
    console.log('Settings saved');
  });
});

document.getElementById('translate').addEventListener('click', () => {
  chrome.runtime.sendMessage({action: 'inject_and_translate'}, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else if (response && response.status === 'started') {
      console.log('Translation started');
    } else if (response && response.status === 'error') {
      console.error('Translation error:', response.message);
    }
  });
});

// Load saved settings when popup opens
chrome.storage.sync.get(['apiKey', 'apiUrl'], (result) => {
  document.getElementById('apiKey').value = result.apiKey || '';
  document.getElementById('apiUrl').value = result.apiUrl || '';
});

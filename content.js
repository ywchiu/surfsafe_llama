let clickInspectEnabled = false;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getInspection(text, apiKey, apiUrl, systemPrompt) {
  console.log('Getting inspection for:', text.substring(0, 50) + '...');
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt || "You are an AI assistant that inspects web content for safety and appropriateness. Provide a brief assessment of the following text."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Inspection result:', data.choices[0].message.content);
    return data.choices[0].message.content;
  } catch (error) {
    console.error('There was a problem with the inspection:', error);
    throw error;
  }
}

async function inspectElement(element, apiKey, apiUrl, systemPrompt) {
  if (element.hasAttribute('data-inspected')) {
    console.log('Element already inspected:', element);
    return;
  }

  try {
    const originalText = element.innerText.trim();
    if (originalText && originalText.length > 10) {
      console.log('Inspecting element:', element);
      const inspectionResult = await getInspection(originalText, apiKey, apiUrl, systemPrompt);

      const inspectionDiv = document.createElement('div');
      inspectionDiv.textContent = inspectionResult;
      inspectionDiv.style.backgroundColor = '#f0f0f0';
      inspectionDiv.style.padding = '5px';
      inspectionDiv.style.margin = '5px 0';
      inspectionDiv.style.border = '1px solid #ddd';
      inspectionDiv.style.borderRadius = '3px';
      inspectionDiv.setAttribute('data-inspected', 'true');

      element.parentNode.insertBefore(inspectionDiv, element.nextSibling);
      element.setAttribute('data-inspected', 'true');

      await delay(1000);
    }
  } catch (error) {
    console.error('Inspection error:', error);
  }
}

async function inspectAllText() {
  console.log('Starting inspection of all text');
  const { apiKey, apiUrl, systemPrompt } = await chrome.storage.sync.get(['apiKey', 'apiUrl', 'systemPrompt']);
  
  if (!apiKey || !apiUrl) {
    console.error('API key or URL not set');
    return;
  }

  const elementsToInspect = document.querySelectorAll('div[aria-describedby], p, h1, h2, h3');

  for (let element of elementsToInspect) {
    await inspectElement(element, apiKey, apiUrl, systemPrompt);
  }
}

function enableClickInspect() {
  console.log('Click inspect enabled');
  document.addEventListener('click', handleClickInspect);
}

function disableClickInspect() {
  console.log('Click inspect disabled');
  document.removeEventListener('click', handleClickInspect);
}

async function handleClickInspect(event) {
  console.log('Click inspect triggered');
  const { apiKey, apiUrl, systemPrompt } = await chrome.storage.sync.get(['apiKey', 'apiUrl', 'systemPrompt']);
  
  if (!apiKey || !apiUrl) {
    console.error('API key or URL not set');
    return;
  }

  if (event.target.nodeType === Node.TEXT_NODE || event.target.childNodes.length === 0) {
    const element = event.target.nodeType === Node.TEXT_NODE ? event.target.parentNode : event.target;
    await inspectElement(element, apiKey, apiUrl, systemPrompt);
  }
}

function handleMessage(request, sender, sendResponse) {
  console.log('Received message:', request);
  if (request.action === "startInspection") {
    inspectAllText();
    sendResponse({status: 'Inspection started'});
  } else if (request.action === "toggleClickInspect") {
    clickInspectEnabled = request.value;
    if (clickInspectEnabled) {
      enableClickInspect();
    } else {
      disableClickInspect();
    }
    sendResponse({status: 'Click inspect ' + (clickInspectEnabled ? 'enabled' : 'disabled')});
  }
  return true;  // Indicates that the response is sent asynchronously
}

chrome.runtime.onMessage.addListener(handleMessage);

// Inform the background script that the content script is ready
chrome.runtime.sendMessage({action: "contentScriptReady"});

// Initialize click inspect state
chrome.storage.sync.get('clickInspect', function(result) {
  clickInspectEnabled = result.clickInspect || false;
  console.log('Initial click inspect state:', clickInspectEnabled);
  if (clickInspectEnabled) {
    enableClickInspect();
  }
});

console.log('Content script loaded and ready');
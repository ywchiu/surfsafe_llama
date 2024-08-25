let clickInspectEnabled = false;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getInspection(text, apiKey, apiUrl, modelName, systemPrompt) {
  console.log('Getting inspection for:', text.substring(0, 50) + '...');
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
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

async function inspectElement(element, apiKey, apiUrl, modelName, systemPrompt) {
  if (element.hasAttribute('data-inspected')) {
    console.log('Element already inspected:', element);
    return;
  }

  try {
    const originalText = element.innerText.trim();
    if (originalText && originalText.length > 10) {
      console.log('Inspecting element:', element);

      const inspectionResult = await getInspection(originalText, apiKey, apiUrl, modelName, systemPrompt);

      const inspectionDiv = document.createElement('div');
      
      if (inspectionResult.toLowerCase().includes("nothing wrong")) {
        inspectionDiv.innerHTML = '&#x2705; <span style="color: green;">Nothing wrong</span>';
      } else {
        inspectionDiv.innerHTML = '&#x274C; <span style="color: red;">' + inspectionResult + '</span>';
      }
      
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
  const { apiKey, apiUrl, modelName, systemPrompt } = await chrome.storage.sync.get(['apiKey', 'apiUrl', 'modelName', 'systemPrompt']);
  
  if (!apiKey || !apiUrl) {
    console.error('API key or URL not set');
    return;
  }

  const elementsToInspect = document.querySelectorAll('div[aria-describedby], p, h1, h2, h3');

  for (let element of elementsToInspect) {
    await inspectElement(element, apiKey, apiUrl, modelName, systemPrompt);
  }
}

function enableClickInspect() {
  console.log('Click inspect enabled');
  document.addEventListener('click', handleClickInspect, true);
}

function disableClickInspect() {
  console.log('Click inspect disabled');
  document.removeEventListener('click', handleClickInspect, true);
}

async function handleClickInspect(event) {
  if (!clickInspectEnabled) return;
  
  console.log('Click inspect triggered');
  event.preventDefault();
  event.stopPropagation();
  
  const { apiKey, apiUrl, modelName, systemPrompt } = await chrome.storage.sync.get(['apiKey', 'apiUrl', 'modelName', 'systemPrompt']);
  
  if (!apiKey || !apiUrl) {
    console.error('API key or URL not set');
    return;
  }

  let element = event.target;
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    if (element.innerText && element.innerText.trim().length > 10) {
      await inspectElement(element, apiKey, apiUrl, modelName, systemPrompt);
      break;
    }
    element = element.parentNode;
  }
}

function handleMessage(request, sender, sendResponse) {
  console.log('Received message:', request);
  if (request.action === "startInspection") {
    inspectAllText();
    sendResponse({status: 'Inspection started'});
  } else if (request.action === "toggleClickInspect") {
    clickInspectEnabled = request.value;
    console.log('Toggle click inspect:', clickInspectEnabled);
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
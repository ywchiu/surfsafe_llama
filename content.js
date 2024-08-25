function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Translation function
async function getTranslation(text, apiKey, apiUrl) {
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
            content: "You are a translator. Translate the following text to Chinese. Only respond with the translation, do not include any other text."
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
    const translatedContent = data.choices[0].message.content;
    console.log('Translated content:', translatedContent);
    return translatedContent;
  } catch (error) {
    console.error('There was a problem with the translation:', error);
    throw error; // Re-throw the error to be caught in the calling function
  }
}

async function translateParagraphs() {
  const { apiKey, apiUrl } = await chrome.storage.sync.get(['apiKey', 'apiUrl']);
  
  if (!apiKey || !apiUrl) {
    console.error('API key or URL not set');
    return;
  }

  const paragraphs = document.getElementsByTagName('p');

  for (let p of paragraphs) {
    if (!p.hasAttribute('data-translated')) {
      try {
        const originalText = p.innerText;
        console.log(originalText);
        const translatedText = await getTranslation(originalText, apiKey, apiUrl);
        //
        const translatedP = p.cloneNode(true);
        translatedP.innerText = translatedText;
        translatedP.style.backgroundColor = '#f0f0f0';  // Light gray background to distinguish translated text
        translatedP.setAttribute('data-translated', 'true');
        p.parentNode.insertBefore(translatedP, p.nextSibling);
        //
        p.setAttribute('data-translated', 'true');
      } catch (error) {
        console.error('Translation error:', error);
      }
      await delay(1000);
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    translateParagraphs().then(() => {
      sendResponse({status: 'started'});
    }).catch((error) => {
      console.error('Translation failed:', error);
      sendResponse({status: 'error', message: error.toString()});
    });
    return true;  // Indicates that the response is sent asynchronously
  }
});

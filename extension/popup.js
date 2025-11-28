document.getElementById('captureBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getPageText,
  }, (results) => {
    if (results && results[0]) {
      const text = results[0].result;
      // Store in local storage or pass via URL
      // Since we can't easily access localhost localstorage from extension, we'll use URL param
      // Limit text length for URL safety (this is a hack, better to use a backend endpoint)
      const encodedText = encodeURIComponent(text.substring(0, 5000)); 
      chrome.tabs.create({ url: `http://localhost:3000/dashboard?jd=${encodedText}` });
    }
  });
});

function getPageText() {
  return document.body.innerText;
}

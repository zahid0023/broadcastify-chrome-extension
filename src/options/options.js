document.addEventListener('DOMContentLoaded', () => {
  const aiSelect = document.getElementById('aiProvider');
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('save');
  const status = document.getElementById('status');

  // Save API key for the selected provider
  saveButton.addEventListener('click', () => {
    const provider = aiSelect.value;
    const inputKey = apiKeyInput.value.trim() || chrome.storage.sync.get([providers.provider], (data) => {
    });

    // Load current providers object from storage
    chrome.storage.sync.get(null, (data) => {
      console.log(data);
      const providers = data || {
        chatgpt: null,
        gemini: null,
        claude: null,
        default: 'gemini'
      };

      // Use input value if provided, otherwise keep previous value
      const keyToSave = inputKey !== '' ? inputKey : providers[provider];

      // Update providers object
      providers[provider] = keyToSave;
      providers.default = provider;

      // Save back to storage
      chrome.storage.sync.set(providers, () => {
        console.log(`API key saved for ${provider}:`, keyToSave);
      });
      console.log(providers);
    });
  });
});

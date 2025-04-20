document.addEventListener('DOMContentLoaded', () => {
  const keywordEngine = document.getElementById('keywordEngine');
  const questionEngine = document.getElementById('questionEngine');
  const status = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['keywordEngine', 'questionEngine'], (result) => {
    if (result.keywordEngine) keywordEngine.value = result.keywordEngine;
    if (result.questionEngine) questionEngine.value = result.questionEngine;
  });

  // Save settings when changed
  function saveSettings() {
    chrome.storage.sync.set({
      keywordEngine: keywordEngine.value,
      questionEngine: questionEngine.value
    }, () => {
      status.textContent = 'Settings saved!';
      status.classList.add('success');
      setTimeout(() => {
        status.classList.remove('success');
      }, 2000);
    });
  }

  keywordEngine.addEventListener('change', saveSettings);
  questionEngine.addEventListener('change', saveSettings);
});
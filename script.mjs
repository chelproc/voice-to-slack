(async () => {
  const webhookUrlInput = document.getElementById("webhook-url");
  const searchKeywordsInput = document.getElementById("search-keywords");
  const logContainer = document.getElementById("log-container")

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("音声認識非対応");
    return;
  }

  /** @type {SpeechRecognition} */
  const speechRecognition = new SpeechRecognition();

  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;
  speechRecognition.maxAlternatives = 100;
  
  /** @type {number[]} */
  let observedIndexes = [];
  /** @type {number[]} */
  let finalizedIndexes = [];
  
  speechRecognition.onresult = e => {
    /** @type {string[]} */
    const searchKeywords = searchKeywordsInput
      .value
      .split("\n")
      .filter(keyword => keyword);
    for (const [resultIndex, result] of [...e.results].entries()) {
      if (finalizedIndexes.includes(resultIndex)) continue;
      if (result.isFinal) {
        finalizedIndexes.push(resultIndex);
        const logItem = document.createElement("li");
        logItem.textContent = result[0].transcript;
        logContainer.appendChild(logItem);
      }
      if (observedIndexes.includes(resultIndex)) {
        if (result.isFinal) {
          sendMessage(
            webhookUrlInput.value,
            `確定: ${result[0].transcript}`
          );
          observedIndexes = observedIndexes.filter(index => index != resultIndex);
        }
        continue;
      }
      for (const alternative of result) {
        // 見つかった時点で速報を流す → 監視対象として確定時点でもう一度流す
        if (searchKeywords.some(keyword => alternative.transcript.includes(keyword))) {
          sendMessage(
            webhookUrlInput.value,
            `速報: ${alternative.transcript}`
          );
          observedIndexes.push(resultIndex);
          break;
        }
      }
    }
  }
  speechRecognition.onend = () => {
    speechRecognition.start();
    observedIndexes = [];
    finalizedIndexes = [];
  }
  document.getElementById("start-button").onclick = () => {
    speechRecognition.start();
  }
})();

function sendMessage(webhookUrl, message) {
  return fetch(
    webhookUrl,
    {
      method: "POST",
      headers: {
      },
      body: JSON.stringify({
        "text": message
      })
    }
  );
}

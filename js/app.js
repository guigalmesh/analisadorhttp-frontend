const urlInput = document.getElementById("urlInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const loadingIndicator = document.getElementById("loadingIndicator");
const errorMessage = document.getElementById("errorMessage");
const reportArea = document.getElementById("reportArea");
const presentBox = document.getElementById("presentBox");
const missingList = document.getElementById("missingList");

analyzeBtn.addEventListener("click", handleAnalysis);

async function handleAnalysis() {
  const targetUrl = urlInput.value.trim();

  if (!targetUrl) {
    showError("Please enter a valid URL.");
    return;
  }

  resetUI();
  loadingIndicator.classList.remove("hidden");

  try {
    const reportData = await fetchSecurityReport(targetUrl);

    renderReport(reportData);
  } catch (error) {
    showError(error.message);
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}

function renderReport(data) {
  presentBox.textContent = JSON.stringify(data.present, null, 2);

  missingList.innerHTML = "";

  for (const header of data.missing) {
    const li = document.createElement("li");
    li.textContent = header;
    missingList.appendChild(li);
  }

  reportArea.classList.remove("hidden");
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function resetUI() {
  errorMessage.classList.add("hidden");
  reportArea.classList.add("hidden");
  errorMessage.textContent = "";
}

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
  // 1. Aponta para o contêiner vazio no HTML
  const cardsContainer = document.getElementById("cardsContainer");
  cardsContainer.innerHTML = ""; // Limpa resultados anteriores

  // 2. Loop através de cada cabeçalho retornado pelo Haskell
  data.results.forEach((item) => {
    // Cria a 'div' do card em branco
    const card = document.createElement("div");
    card.className = "card";

    // Lógica de Cores: Define a classe do "Badge" e a cor da borda baseado no Status
    let badgeClass = "";
    if (item.status === "Secure") {
      badgeClass = "status-secure";
      card.style.borderLeftColor = "#2ea043"; // Borda verde
    } else if (item.status === "Vulnerable") {
      badgeClass = "status-vulnerable";
      card.style.borderLeftColor = "#f85149"; // Borda vermelha
    } else {
      badgeClass = "status-missing";
      card.style.borderLeftColor = "#d29922"; // Borda amarela
    }

    // 3. Injeta as informações cruas do JSON formatadas dentro do HTML do card
    // Usamos Template Literals (as crases) para misturar HTML com variáveis facilmente
    card.innerHTML = `
            <h3 class="card-title">${item.headerName}</h3>
            <span class="card-badge ${badgeClass}">${item.status}</span>

            <p><strong>Severity:</strong> ${item.severity}</p>
            <p><strong>Description:</strong> ${item.description}</p>
            <p><strong>Vulnerability:</strong> ${item.vulnerability}</p>
            <p><strong>Value:</strong> <code>${item.foundValue || "Not Found"}</code></p>
        `;

    // 4. Adiciona o card finalizado dentro do contêiner
    cardsContainer.appendChild(card);
  });

  // Exibe a área do relatório que estava escondida
  document.getElementById("reportArea").classList.remove("hidden");
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

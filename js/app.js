const urlInput = document.getElementById("urlInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const loadingIndicator = document.getElementById("loadingIndicator");
const errorMessage = document.getElementById("errorMessage");
const reportArea = document.getElementById("reportArea");
const presentBox = document.getElementById("presentBox");
const missingList = document.getElementById("missingList");

let currentReportData = [];

analyzeBtn.addEventListener("click", handleAnalysis);

async function handleAnalysis() {
  let targetUrl = urlInput.value.trim();

  if (!targetUrl) {
    showError("Please enter a valid URL.");
    return;
  }

  // Se não começar com http:// ou https://, injetamos o https://
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "https://" + targetUrl;

    urlInput.value = targetUrl;
  }

  resetUI();
  loadingIndicator.classList.remove("hidden");

  try {
    const reportData = await fetchSecurityReport(targetUrl);

    currentReportData = reportData.results;

    document.getElementById("filterContainer").classList.remove("hidden");

    renderReport(currentReportData);
  } catch (error) {
    showError(error.message);
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}

function renderReport(dataArray) {
  // 1. Aponta para o contêiner vazio no HTML
  const cardsContainer = document.getElementById("cardsContainer");
  cardsContainer.innerHTML = ""; // Limpa resultados anteriores

  // 2. Loop através de cada cabeçalho retornado pelo Haskell
  dataArray.forEach((item) => {
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

// Captura todos os checkboxes
const filterCheckboxes = document.querySelectorAll(".filter-checkbox");

// Função central de filtragem
function applyFilters() {
  // 1. Descobre quais checkboxes estão marcados no momento
  const activeFilters = Array.from(filterCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  // 2. Regra de UX: Se nenhuma caixa estiver marcada, mostramos o relatório completo
  if (activeFilters.length === 0) {
    renderReport(currentReportData);
    return;
  }

  // 3. Motor de Filtragem Aditiva (Lógica OR)
  const filteredData = currentReportData.filter((item) => {
    // Definimos o que cada estado significa
    const isCritical =
      item.severity === "Critical" &&
      (item.status === "Vulnerable" || item.status === "Missing");
    const isVulnerable =
      item.status === "Vulnerable" || item.status === "Missing";
    const isSecure = item.status === "Secure";

    // Se o filtro está ativo na tela E o item atende àquela condição, ele passa no filtro
    if (activeFilters.includes("critical") && isCritical) return true;
    if (activeFilters.includes("vulnerable") && isVulnerable) return true;
    if (activeFilters.includes("secure") && isSecure) return true;

    // Se não atendeu a nenhum dos filtros ativos, fica de fora da tela
    return false;
  });

  // 4. Limpa a tela e renderiza o novo resultado combinado
  renderReport(filteredData);
}

// Adiciona o ouvinte de eventos para disparar a filtragem sempre que o usuário marcar/desmarcar
filterCheckboxes.forEach((cb) => {
  cb.addEventListener("change", applyFilters);
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function resetUI() {
  errorMessage.classList.add("hidden");
  reportArea.classList.add("hidden");
  errorMessage.textContent = "";
  document.getElementById("filterContainer").classList.add("hidden");
  document
    .querySelectorAll(".filter-checkbox")
    .forEach((cb) => (cb.checked = false));
}

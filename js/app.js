const urlInput = document.getElementById("urlInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const loadingIndicator = document.getElementById("loadingIndicator");
const errorMessage = document.getElementById("errorMessage");
const reportArea = document.getElementById("reportArea");
const presentBox = document.getElementById("presentBox");
const missingList = document.getElementById("missingList");
const scannerSection = document.getElementById("scannerSection");
const historySection = document.getElementById("historySection");
const navScannerBtn = document.getElementById("navScannerBtn");
const navHistoryBtn = document.getElementById("navHistoryBtn");

let currentReportData = [];

analyzeBtn.addEventListener("click", handleAnalysis);
navScannerBtn.addEventListener("click", () => {
  scannerSection.classList.remove("hidden");
  historySection.classList.add("hidden");
});

navHistoryBtn.addEventListener("click", () => {
  scannerSection.classList.add("hidden");
  historySection.classList.remove("hidden");

  loadHistory();
});

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

    const shouldSave = document.getElementById("saveHistoryCheck").checked;

    if (shouldSave) {
      const analysis = calculateGradeAndSummary(currentReportData);
      await saveHistory(targetUrl, analysis.grade, analysis.summary);
      console.log("Análise salva no histórico!");
    }

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

async function loadHistory() {
  const historyContainer = document.getElementById("historyContainer");
  historyContainer.innerHTML = "<p>Buscando registros no banco de dados...</p>";

  try {
    const data = await getHistory();

    // DEBUG: Descomente a linha abaixo para ver no console o que o Haskell está enviando
    // console.log("Dados recebidos do Haskell:", data);

    if (data.length === 0) {
      historyContainer.innerHTML =
        "<p>Nenhuma análise salva no histórico ainda.</p>";
      return;
    }

    let html = '<ul style="list-style: none; padding: 0;">';

    data.forEach((item) => {
      // O Haskell devolve uma lista de itens. A ordem deve ser:
      // item[0] = URL, item[1] = Data, item[2] = Nota, item[3] = Resumo
      const url = item[0] || "URL desconhecida";
      const rawDate = item[1] || "";
      const grade = item[2] || "-";
      const summary = item[3] || ""; // NÃO use JSON.parse aqui, agora é texto puro!

      const formattedDate = rawDate
        ? new Date(rawDate).toLocaleString("pt-BR")
        : "Data inválida";

      // Cor da nota
      const gradeColor = grade === "A" || grade === "B" ? "#2ea043" : "#f85149";

      html += `
        <li style="padding: 15px; margin-bottom: 10px; background-color: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div>
                    <span style="font-weight: bold; font-size: 1.2em; color: ${gradeColor}; margin-right: 10px;">${grade}</span>
                    <strong style="color: #24292f;">${url}</strong>
                </div>
                <div style="color: #57606a; font-size: 0.85em;">${formattedDate}</div>
            </div>
            <div style="font-size: 0.9em; color: #555; background: #fff; padding: 8px; border-radius: 4px; border: 1px dashed #ccc;">
                <strong>Resumo:</strong> ${summary}
            </div>
        </li>
      `;
    });

    html += "</ul>";
    historyContainer.innerHTML = html;
  } catch (error) {
    // Se o código cair aqui com um GET 200, o console dirá o motivo exato (ex: erro de índice ou tipo)
    console.error("Erro interno no processamento do histórico:", error);
    historyContainer.innerHTML = `
      <p style="color: #f85149;">
        <strong>Erro ao processar dados:</strong> Verifique o console (F12) para detalhes técnicos.
      </p>
    `;
  }
}

function calculateGradeAndSummary(reportData) {
  let score = 100;
  let summaryParts = [];

  const ignoredForGrading = [
    "set-cookie",
    "access-control-allow-origin",
    "access-control-allow-credentials",
    "access-control-allow-methods",
    "access-control-allow-headers",
    "cross-origin-embedder-policy",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
  ];

  const leakyHeaders = [
    "server",
    "x-powered-by",
    "x-aspnet-version",
    "x-aspnetmvc-version",
  ];

  // 1. INTELIGÊNCIA DE CONTEXTO: O site possui um CSP Seguro?
  const hasSecureCSP = reportData.some(
    (item) =>
      item.headerName.toLowerCase() === "content-security-policy" &&
      item.status === "Secure",
  );

  reportData.forEach((item) => {
    summaryParts.push(`${item.headerName}:${item.status}`);
    const headerNameLower = item.headerName.toLowerCase();

    if (ignoredForGrading.includes(headerNameLower)) return;

    if (leakyHeaders.includes(headerNameLower) && item.status !== "Secure") {
      score -= 2;
      return;
    }

    if (headerNameLower === "x-frame-options" && hasSecureCSP) {
      return;
    }

    if (headerNameLower === "x-xss-protection") {
      if (item.status === "Missing" || item.value === "0") {
        return;
      }
    }

    if (item.status === "Missing" || item.status === "Vulnerable") {
      // 2. A REGRA DE ANISTIA DO X-FRAME-OPTIONS
      if (headerNameLower === "x-frame-options" && hasSecureCSP) {
        // Como o CSP está presente e seguro, a ausência do XFO não é uma falha.
        // Anistiamos a penalidade e pulamos para o próximo cabeçalho!
        return;
      }

      // O seu switch original continua governando o resto
      switch (item.severity) {
        case "Critical":
          score -= 20;
          break;
        case "Recommended":
          // Diminuí de 5 para 3 para ser menos punitivo com adoções novas (Permissions-Policy)
          score -= 3;
          break;
        case "Other":
          score -= 0;
          break;
        default:
          score -= 2;
      }

      if (item.status === "Vulnerable") {
        score -= 5;
      }
    }
  });

  if (score < 0) score = 0;

  let grade = "A";
  if (score < 40) grade = "F";
  else if (score < 60) grade = "D";
  else if (score < 75) grade = "C";
  else if (score < 90) grade = "B";

  return { grade, summary: summaryParts.join(", ") };
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

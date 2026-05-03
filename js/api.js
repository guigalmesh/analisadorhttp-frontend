/**
 * Sends the target URL to the Haskell backend for analysis.
 * @param {string} targetUrl - The URL to be analyzed.
 * @returns {Promise<Object>} - The JSON report from the server.
 */

const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://analisador-de-headerhttp.onrender.com";

async function fetchSecurityReport(targetUrl) {
  // Agora usa a variável dinâmica em vez do localhost fixo
  const apiEndpoint = `${API_BASE_URL}/analisador`;

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: targetUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error
        ? `${data.error}: ${data.details}`
        : "Failed to communicate with the target.";
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error("[API Error] Request failed:", error);
    throw error;
  }
}

async function saveHistory(targetUrl, gradeValue, summaryValue) {
  // Usando crases e ${API_BASE_URL}
  const response = await fetch(`${API_BASE_URL}/api/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scannedURL: targetUrl,
      grade: gradeValue,
      summary: summaryValue,
    }),
  });

  if (!response.ok) {
    throw new Error("Falha ao salvar no banco de dados.");
  }

  return response.text();
}

async function getHistory() {
  // Substituído o localhost
  const response = await fetch(`${API_BASE_URL}/api/history`);

  if (!response.ok) {
    throw new Error("Falha ao buscar o histórico.");
  }

  return response.json();
}

async function getRanking() {
  // Substituído o localhost
  const response = await fetch(`${API_BASE_URL}/api/ranking`);

  if (!response.ok) {
    throw new Error("Falha ao buscar o ranking.");
  }

  return response.json();
}

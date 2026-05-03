/**
 * Sends the target URL to the Haskell backend for analysis.
 * @param {string} targetUrl - The URL to be analyzed.
 * @returns {Promise<Object>} - The JSON report from the server.
 */
async function fetchSecurityReport(targetUrl) {
  const apiEndpoint = "http://localhost:3000/analisador";

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
  const response = await fetch("http://localhost:3000/api/history", {
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
  const response = await fetch("http://localhost:3000/api/history");

  if (!response.ok) {
    throw new Error("Falha ao buscar o histórico.");
  }

  return response.json();
}

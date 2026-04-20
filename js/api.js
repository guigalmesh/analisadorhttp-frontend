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
      const errorMessage = data.erro
        ? `${data.erro}: ${data.detalhes}`
        : "Failed to communicate with the target.";
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error("[API Error] Request failed:", error);

    throw error;
  }
}

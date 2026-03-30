/**
 * Tavus AI Configuration
 * Central configuration for Tavus AI API integration
 * Based on tavus-whisperer implementation
 */

const TAVUS_API_KEY =
  process.env.TAVUS_API_KEY || "af7e66d99b70478a85e92f9794c2220e";
const TAVUS_API_URL = process.env.TAVUS_API_URL || "https://tavusapi.com/v2";
const TAVUS_PERSONA_ID = process.env.TAVUS_PERSONA_ID || "p8d9c57def77";
const TAVUS_REPLICA_ID = process.env.TAVUS_REPLICA_ID || "r55e6793f10f";

// Validate configuration on module load
const validateConfig = () => {
  if (!TAVUS_API_KEY || !TAVUS_PERSONA_ID || !TAVUS_REPLICA_ID) {
    console.warn(
      "⚠️ Tavus configuration incomplete. Using defaults. Set environment variables: TAVUS_API_KEY, TAVUS_PERSONA_ID, TAVUS_REPLICA_ID",
    );
  }
};

const getTavusConfig = () => {
  validateConfig();
  return {
    apiKey: TAVUS_API_KEY,
    apiUrl: TAVUS_API_URL,
    personaId: TAVUS_PERSONA_ID,
    replicaId: TAVUS_REPLICA_ID,
    headers: {
      "x-api-key": TAVUS_API_KEY,
      "Content-Type": "application/json",
    },
  };
};

/**
 * Get language-specific Tavus configuration
 * Based on tavus-whisperer - same persona/replica for all languages
 * @param {string} language - Language code ('en', 'tw')
 * @returns {Object} - Language-specific configuration with API headers
 */
const getLanguageConfig = (language = "en") => {
  validateConfig();
  const langCode = language.toLowerCase() === "twi" ? "tw" : "en";

  const languageConfigs = {
    en: {
      persona_id: TAVUS_PERSONA_ID,
      replica_id: TAVUS_REPLICA_ID,
      language: "English",
      name: "Prenatal Care Assistant",
      description: "English-speaking prenatal care AI assistant",
      apiUrl: TAVUS_API_URL,
      apiKey: TAVUS_API_KEY,
      headers: {
        "x-api-key": TAVUS_API_KEY,
        "Content-Type": "application/json",
      },
    },
    tw: {
      persona_id: TAVUS_PERSONA_ID,
      replica_id: TAVUS_REPLICA_ID,
      language: "Twi",
      name: "Pre-Natal Care Dɔkita",
      description: "Twi-speaking prenatal care AI assistant",
      apiUrl: TAVUS_API_URL,
      apiKey: TAVUS_API_KEY,
      headers: {
        "x-api-key": TAVUS_API_KEY,
        "Content-Type": "application/json",
      },
    },
  };

  return languageConfigs[langCode];
};

module.exports = {
  getTavusConfig,
  getLanguageConfig,
  TAVUS_API_KEY,
  TAVUS_API_URL,
  TAVUS_PERSONA_ID,
  TAVUS_REPLICA_ID,
};

/**
 * Tavus AI Configuration
 * Central configuration for Tavus AI API integration
 */

const getTavusConfig = () => {
  const apiKey = process.env.TAVUS_API_KEY;
  const apiUrl = process.env.TAVUS_API_URL;
  const personaId = process.env.TAVUS_PERSONA_ID;
  const replicaId = process.env.TAVUS_REPLICA_ID;

  // Validate configuration
  if (!apiKey || !apiUrl || !personaId || !replicaId) {
    throw new Error(
      "Missing Tavus configuration. Please check your environment variables: TAVUS_API_KEY, TAVUS_API_URL, TAVUS_PERSONA_ID, TAVUS_REPLICA_ID",
    );
  }

  return {
    apiKey,
    apiUrl,
    personaId,
    replicaId,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  };
};

/**
 * Get language-specific Tavus configuration
 * @param {string} language - Language code ('en', 'tw')
 * @returns {Object} - Language-specific configuration
 */
const getLanguageConfig = (language = "en") => {
  const baseConfig = getTavusConfig();

  // Language-specific persona configurations
  const languagePersonas = {
    en: {
      persona_id: process.env.TAVUS_PERSONA_ID,
      replica_id: process.env.TAVUS_REPLICA_ID,
      language: "English",
      name: "Prenatal Care Assistant",
      description: "English-speaking prenatal care AI assistant",
    },
    tw: {
      persona_id: process.env.TAVUS_PERSONA_ID, // Using same persona for now
      replica_id: process.env.TAVUS_REPLICA_ID, // Using same replica for now
      language: "Twi",
      name: "Pre-Natal Care Dɔkita",
      description: "Twi-speaking prenatal care AI assistant",
    },
  };

  const langConfig = languagePersonas[language] || languagePersonas.en;

  return {
    ...baseConfig,
    ...langConfig,
  };
};

module.exports = {
  getTavusConfig,
  getLanguageConfig,
};

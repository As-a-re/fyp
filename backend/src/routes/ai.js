const express = require("express");
const { body, validationResult } = require("express-validator");
const supabase = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const axios = require("axios");
const { getLanguageConfig } = require("../config/tavus");

// Dummy autoTranslate function for demonstration; replace with real implementation or import as needed
async function autoTranslate(text, target_language) {
  // This is a placeholder. Replace with actual translation logic or API call.
  if (target_language === "en") {
    return `[EN] ${text}`;
  } else if (target_language === "tw") {
    return `[TW] ${text}`;
  }
  return text;
}

const router = express.Router();

// Create AI conversation (replaces start-session for better alignment with tavus-whisperer)
router.post("/create-conversation", authenticateToken, async (req, res) => {
  try {
    const { language = "en" } = req.body;

    // Normalize language code
    const normalizedLanguage = language.toLowerCase() === "twi" ? "tw" : "en";

    try {
      // Get language-specific configuration
      const langConfig = getLanguageConfig(normalizedLanguage);

      // Call Tavus API to create conversation (like tavus-whisperer)
      const response = await axios.post(
        `${langConfig.apiUrl}/conversations`,
        {
          replica_id: langConfig.replica_id,
          persona_id: langConfig.persona_id,
        },
        {
          headers: {
            "x-api-key": langConfig.apiKey,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );

      const conversationData = response.data;

      // Save conversation to database
      const { data: conversation, error } = await supabase
        .from("ai_sessions")
        .insert([
          {
            user_id: req.user.id,
            session_url: conversationData.conversation_url,
            session_id: conversationData.conversation_id,
            session_status: "active",
            started_at: new Date().toISOString(),
            language: normalizedLanguage,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Failed to save conversation:", error);
        return res.status(500).json({ error: "Failed to create conversation" });
      }

      res.status(201).json({
        message: "Conversation created successfully",
        conversation: {
          id: conversation.id,
          conversation_url: conversationData.conversation_url,
          conversation_id: conversationData.conversation_id,
          status: conversation.session_status,
          started_at: conversation.started_at,
          language: conversation.language,
        },
      });
    } catch (tavusError) {
      console.error("Tavus API error:", tavusError.message);
      return res.status(500).json({
        error: "Failed to create conversation",
        details: tavusError.message,
      });
    }
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start AI assistant session (maintains backward compatibility)
router.post("/start-session", authenticateToken, async (req, res) => {
  try {
    const { language = "en" } = req.body;

    // Normalize language code
    const normalizedLanguage = language.toLowerCase() === "twi" ? "tw" : "en";

    // Check if user has an active session
    const { data: activeSession } = await supabase
      .from("ai_sessions")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("session_status", "active")
      .single();

    if (activeSession) {
      return res.json({
        success: true,
        message: "Active session already exists",
        session: activeSession,
      });
    }

    try {
      // Get language-specific configuration
      const langConfig = getLanguageConfig(normalizedLanguage);

      console.log(
        `\n🟦 [Tavus] Starting session for language: ${normalizedLanguage}`,
      );
      console.log(`📍 [Tavus] API URL: ${langConfig.apiUrl}/conversations`);
      console.log(`👤 [Tavus] Persona ID: ${langConfig.persona_id}`);
      console.log(`🔄 [Tavus] Replica ID: ${langConfig.replica_id}\n`);

      // Call Tavus API to create conversation (exactly like tavus-whisperer)
      const response = await axios.post(
        `${langConfig.apiUrl}/conversations`,
        {
          replica_id: langConfig.replica_id,
          persona_id: langConfig.persona_id,
        },
        {
          headers: {
            "x-api-key": langConfig.apiKey,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );

      console.log(`✅ [Tavus] API Response Status: ${response.status}`);
      console.log(`📦 [Tavus] Conversation URL received\n`);

      const sessionData = response.data;

      // Save session to database
      const { data: session, error } = await supabase
        .from("ai_sessions")
        .insert([
          {
            user_id: req.user.id,
            session_url: sessionData.conversation_url,
            session_id: sessionData.conversation_id,
            session_status: "active",
            started_at: new Date().toISOString(),
            language: normalizedLanguage,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("❌ Failed to save AI session:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to save session",
        });
      }

      return res.status(201).json({
        success: true,
        message: "AI session started successfully",
        session: {
          id: session.id,
          session_url: session.session_url,
          session_id: session.session_id,
          status: session.session_status,
          started_at: session.started_at,
          language: session.language,
        },
      });
    } catch (tavusError) {
      console.error("\n❌ [Tavus] API Error occurred:");
      console.error("Error Message:", tavusError.message);

      if (tavusError.response) {
        console.error("HTTP Status:", tavusError.response.status);
        console.error(
          "Response Data:",
          JSON.stringify(tavusError.response.data, null, 2),
        );
      }

      // Return proper error response instead of fallback
      return res.status(500).json({
        success: false,
        error: "Failed to create Tavus conversation",
        details: tavusError.response?.data?.message || tavusError.message,
      });
    }
  } catch (error) {
    console.error("❌ Start session error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// End AI assistant session
router.post(
  "/end-session",
  authenticateToken,
  [body("session_id").notEmpty().withMessage("Session ID required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { session_id } = req.body;

      // Update session status in database
      const { data: session, error } = await supabase
        .from("ai_sessions")
        .update({
          session_status: "ended",
          ended_at: new Date().toISOString(),
        })
        .eq("user_id", req.user.id)
        .eq("session_id", session_id)
        .eq("session_status", "active")
        .select()
        .single();

      if (error || !session) {
        return res.status(404).json({
          success: false,
          error: "Active session not found",
        });
      }

      console.log(`✅ [Tavus] Session ended: ${session_id}`);

      return res.json({
        success: true,
        message: "Session ended successfully",
        session,
      });
    } catch (error) {
      console.error("❌ End session error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
);

// Get session history
router.get("/sessions", authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const { data: sessions, error } = await supabase
      .from("ai_sessions")
      .select("*")
      .eq("user_id", req.user.id)
      .order("started_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch sessions",
        details: error.message,
      });
    }

    res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("❌ Sessions history error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Get active session
router.get("/active-session", authenticateToken, async (req, res) => {
  try {
    const { data: session, error } = await supabase
      .from("ai_sessions")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("session_status", "active")
      .single();

    if (error && error.code !== "PGRST116") {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch active session",
        details: error.message,
      });
    }

    res.json({
      success: true,
      session: session || null,
    });
  } catch (error) {
    console.error("❌ Active session error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Analyze symptom with AI
router.post(
  "/analyze-symptom",
  authenticateToken,
  [
    body("symptom_text")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Symptom description must be at least 5 characters"),
    body("severity_level")
      .optional()
      .isIn(["Low", "Medium", "High"])
      .withMessage("Invalid severity level"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { symptom_text, severity_level = "Medium" } = req.body;

      // Save symptom report
      const { data: symptom, error } = await supabase
        .from("symptoms")
        .insert([
          {
            user_id: req.user.id,
            symptom_text,
            severity_level,
            ai_prediction: null, // Will be updated after AI analysis
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          error: "Failed to save symptom report",
          details: error.message,
        });
      }

      try {
        // Analyze symptom with AI (simplified for demo)
        const aiAnalysis = await analyzeSymptomWithAI(
          symptom_text,
          severity_level,
        );

        // Update symptom with AI prediction
        const { data: updatedSymptom } = await supabase
          .from("symptoms")
          .update({
            ai_prediction: aiAnalysis.prediction,
            ai_confidence: aiAnalysis.confidence,
            ai_recommendations: aiAnalysis.recommendations,
          })
          .eq("id", symptom.id)
          .select()
          .single();

        res.status(201).json({
          message: "Symptom analyzed successfully",
          symptom: updatedSymptom,
          analysis: aiAnalysis,
        });
      } catch (aiError) {
        console.error("AI analysis error:", aiError.message);

        // Return symptom without AI analysis
        res.status(201).json({
          message: "Symptom recorded (AI analysis unavailable)",
          symptom,
          warning: "AI analysis temporarily unavailable",
        });
      }
    } catch (error) {
      console.error("Symptom analysis error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Helper function for symptom analysis
async function analyzeSymptomWithAI(symptomText, severityLevel) {
  // Simplified AI analysis for demo
  // In production, this would call a more sophisticated AI service

  const keywords = {
    headache: { risk: "Low", confidence: 0.6 },
    swelling: { risk: "Medium", confidence: 0.7 },
    pain: { risk: "Medium", confidence: 0.6 },
    dizziness: { risk: "Medium", confidence: 0.7 },
    bleeding: { risk: "High", confidence: 0.9 },
    fever: { risk: "Medium", confidence: 0.8 },
    nausea: { risk: "Low", confidence: 0.5 },
  };

  let analysis = { risk: "Low", confidence: 0.5 };

  for (const [keyword, result] of Object.entries(keywords)) {
    if (symptomText.toLowerCase().includes(keyword)) {
      analysis = result;
      break;
    }
  }

  // Adjust based on severity level
  if (severityLevel === "High") {
    analysis.confidence = Math.min(analysis.confidence + 0.2, 1.0);
    if (analysis.risk === "Low") analysis.risk = "Medium";
    if (analysis.risk === "Medium") analysis.risk = "High";
  }

  const recommendations = {
    Low: ["Monitor symptoms", "Rest and hydrate", "Contact if symptoms worsen"],
    Medium: [
      "Monitor closely",
      "Schedule doctor appointment",
      "Rest and avoid stress",
    ],
    High: [
      "Seek immediate medical attention",
      "Contact emergency services",
      "Do not wait",
    ],
  };

  return {
    prediction: analysis.risk,
    confidence: analysis.confidence,
    recommendations: recommendations[analysis.risk],
  };
}

// Translate text endpoint
router.post(
  "/translate",
  authenticateToken,
  [
    body("text")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Text is required for translation"),
    body("target_language")
      .isIn(["en", "tw"])
      .withMessage("Target language must be 'en' or 'tw'"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { text, target_language } = req.body;

      try {
        const translatedText = await autoTranslate(text, target_language);

        res.json({
          message: "Translation successful",
          original_text: text,
          translated_text: translatedText,
          target_language,
        });
      } catch (translationError) {
        console.error("Translation error:", translationError.message);

        res.status(500).json({
          error: "Translation failed",
          message: "Unable to translate text at this time",
        });
      }
    } catch (error) {
      console.error("Translate endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Dummy detectLanguage function for demonstration; replace with real implementation or import as needed
async function detectLanguage(text) {
  // Simple heuristic: if text contains certain Twi characters, return 'tw', else 'en'
  // Replace with actual language detection logic or API call as needed
  const twiKeywords = ["ɛ", "ɔ", "wo", "me", "yɛ", "nkyerɛkyerɛ"];
  const lowerText = text.toLowerCase();
  for (const kw of twiKeywords) {
    if (lowerText.includes(kw)) {
      return "tw";
    }
  }
  return "en";
}

// Detect language endpoint
router.post(
  "/detect-language",
  authenticateToken,
  [
    body("text")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Text is required for language detection"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { text } = req.body;

      try {
        const detectedLanguage = await detectLanguage(text);

        res.json({
          message: "Language detection successful",
          text,
          detected_language: detectedLanguage,
          language_name: detectedLanguage === "tw" ? "Twi" : "English",
        });
      } catch (detectionError) {
        console.error("Language detection error:", detectionError.message);

        res.status(500).json({
          error: "Language detection failed",
          message: "Unable to detect language at this time",
        });
      }
    } catch (error) {
      console.error("Detect language endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

module.exports = router;

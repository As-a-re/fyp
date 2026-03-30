const express = require("express");
const { body, validationResult } = require("express-validator");
const supabase = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get doctor's patients
router.get("/patients", authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Get all patients assigned to this doctor
    const { data: patients, error } = await supabase
      .from("users")
      .select("id, name, email, phone, created_at")
      .eq("doctor_id", doctorId)
      .eq("role", "Mother");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ patients: patients || [] });
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// Get patient details
router.get("/patients/:patientId", authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user.id;

    // Verify doctor has access to this patient
    const { data: patient, error } = await supabase
      .from("users")
      .select("*, pregnancy_profiles(*)")
      .eq("id", patientId)
      .eq("doctor_id", doctorId)
      .single();

    if (error || !patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({ patient });
  } catch (error) {
    console.error("Get patient details error:", error);
    res.status(500).json({ error: "Failed to fetch patient details" });
  }
});

// Get patient health history
router.get(
  "/patients/:patientId/history",
  authenticateToken,
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const doctorId = req.user.id;

      // Verify doctor has access to this patient
      const { data: patient } = await supabase
        .from("users")
        .select("doctor_id")
        .eq("id", patientId)
        .single();

      if (!patient || patient.doctor_id !== doctorId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get health records
      const { data: healthRecords, error } = await supabase
        .from("health_records")
        .select("*")
        .eq("user_id", patientId)
        .order("recorded_at", { ascending: false })
        .limit(50);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ healthRecords: healthRecords || [] });
    } catch (error) {
      console.error("Get patient history error:", error);
      res.status(500).json({ error: "Failed to fetch patient history" });
    }
  },
);

// Add clinical note
router.post(
  "/patients/:patientId/notes",
  authenticateToken,
  [body("note").trim().notEmpty().withMessage("Note is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { patientId } = req.params;
      const doctorId = req.user.id;
      const { note } = req.body;

      // Verify doctor has access
      const { data: patient } = await supabase
        .from("users")
        .select("doctor_id")
        .eq("id", patientId)
        .single();

      if (!patient || patient.doctor_id !== doctorId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Add clinical note
      const { data: clinicalNote, error } = await supabase
        .from("clinical_notes")
        .insert([
          {
            user_id: patientId,
            doctor_id: doctorId,
            note,
          },
        ])
        .select();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.status(201).json({ clinicalNote: clinicalNote[0] });
    } catch (error) {
      console.error("Add note error:", error);
      res.status(500).json({ error: "Failed to add clinical note" });
    }
  },
);

module.exports = router;

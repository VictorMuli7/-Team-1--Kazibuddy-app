
const express = require("express");
const router = express.Router();
const hospitalQ = require("../services/hospitalQService");

router.get("/departments", async (req, res) => {
  try {
    res.json(await hospitalQ.departments());
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

router.get("/queue/:department", async (req, res) => {
  try {
    res.json(await hospitalQ.queue(req.params.department));
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

router.get("/queue/:department/stats", async (req, res) => {
  try {
    res.json(await hospitalQ.waitStats(req.params.department));
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

router.post("/queue", async (req, res) => {
  try {
    const { patientName, department } = req.body;

    if (
      typeof patientName !== "string" ||
      !patientName.trim() ||
      typeof department !== "string" ||
      !department.trim()
    ) {
      return res.status(400).json({
        error: "Patient name and department are required"
      });
    }

    const result = await hospitalQ.checkIn(
      patientName.trim(),
      department.trim()
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

router.get("/analytics/overview", async (req, res) => {
  try {
    res.json(await hospitalQ.overview());
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;

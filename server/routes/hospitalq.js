
const express = require("express");
const hospitalQ = require("../services/hospitalQService");

const router = express.Router();

// List HospitalQ departments.
router.get("/departments", async (req, res) => {
  try {
    res.json(await hospitalQ.getDepartments());
  } catch (error) {
    res.status(error.status || 502).json({
      message: "Could not retrieve HospitalQ departments",
    });
  }
});

// View a department's queue.
router.get("/queue/:department", async (req, res) => {
  try {
    res.json(await hospitalQ.getQueue(req.params.department));
  } catch (error) {
    res.status(error.status || 502).json({
      message: "Could not retrieve the HospitalQ queue",
    });
  }
});

// View waiting-time statistics.
router.get("/queue/:department/stats", async (req, res) => {
  try {
    res.json(await hospitalQ.getWaitTime(req.params.department));
  } catch (error) {
    res.status(error.status || 502).json({
      message: "Could not retrieve waiting-time statistics",
    });
  }
});

// Check in a patient.
// Attach your EXISTING KaziBuddy authentication middleware here.
router.post("/check-in", async (req, res) => {
  const { patientName, department } = req.body;

  if (
    typeof patientName !== "string" ||
    !patientName.trim() ||
    typeof department !== "string" ||
    !/^[a-z0-9-]+$/i.test(department)
  ) {
    return res.status(400).json({
      message: "A valid patient name and department are required",
    });
  }

  try {
    const result = await hospitalQ.checkIn(
      patientName.trim(),
      department
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 502).json({
      message: "HospitalQ check-in failed",
    });
  }
});

// Protected upstream analytics.
// Attach your EXISTING KaziBuddy authentication middleware here.
router.get("/overview", async (req, res) => {
  try {
    res.json(await hospitalQ.getOverview());
  } catch (error) {
    res.status(error.status || 502).json({
      message: "Could not retrieve HospitalQ analytics",
    });
  }
});

module.exports = router;

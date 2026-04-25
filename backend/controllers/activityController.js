const Activity = require('../models/Activity');

exports.createActivity = async (req, res) => {
  try {
    const { title, description, courseId, section, facultyId, maxScore } = req.body;
    const instructionsFile = req.files?.instructionsFile?.[0]?.path;
    const rubricFile = req.files?.rubricFile?.[0]?.path;

    const activity = new Activity({
      title, description, courseId, section, facultyId, maxScore,
      instructionsFile, rubricFile
    });
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActivitiesBySection = async (req, res) => {
  try {
    const { courseId, section } = req.params;
    const activities = await Activity.find({ courseId, section });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

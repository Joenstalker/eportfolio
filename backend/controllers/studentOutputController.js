const StudentOutput = require('../models/StudentOutput');

exports.submitOutput = async (req, res) => {
  try {
    const { activityId, studentId } = req.body;
    const file = req.file?.path;
    const output = new StudentOutput({ activityId, studentId, file });
    await output.save();
    res.status(201).json(output);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOutputsByActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const outputs = await StudentOutput.find({ activityId }).populate('studentId');
    res.json(outputs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

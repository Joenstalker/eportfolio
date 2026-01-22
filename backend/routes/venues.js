const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// Get all venues
router.get('/', auth, async (req, res) => {
  try {
    const venues = await Venue.find().sort({ name: 1 });
    res.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new venue
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if venue already exists
    const existingVenue = await Venue.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existingVenue) {
      return res.status(400).json({ message: 'Venue already exists' });
    }

    const venue = new Venue({
      name,
      description
    });

    await venue.save();
    res.status(201).json({ message: 'Venue created successfully', venue });
  } catch (error) {
    console.error('Error creating venue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a venue
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      { 
        name,
        description,
        updatedAt: Date.now
      },
      { new: true }
    );

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    res.json({ message: 'Venue updated successfully', venue });
  } catch (error) {
    console.error('Error updating venue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a venue
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Error deleting venue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
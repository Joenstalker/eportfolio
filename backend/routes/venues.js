// Venue routes
const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');

// Get all venues
router.get('/', async (req, res) => {
  try {
    console.log('Fetching venues...');
    const venues = await Venue.find().sort({ name: 1 });
    console.log('Found venues:', venues.length);
    res.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ message: 'Error fetching venues' });
  }
});

// Create a new venue
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Venue name is required' });
    }

    // Check if venue already exists
    const existingVenue = await Venue.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    
    if (existingVenue) {
      return res.status(400).json({ message: 'Venue already exists' });
    }

    const venue = new Venue({
      name: name.trim(),
      description: description?.trim() || ''
    });

    await venue.save();
    res.status(201).json(venue);
  } catch (error) {
    console.error('Error creating venue:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Venue already exists' });
    }
    res.status(500).json({ message: 'Error creating venue' });
  }
});

// Update a venue
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Venue name is required' });
    }

    // Check if venue already exists (excluding current one)
    const existingVenue = await Venue.findOne({ 
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    
    if (existingVenue) {
      return res.status(400).json({ message: 'Venue already exists' });
    }

    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      { 
        name: name.trim(),
        description: description?.trim() || ''
      },
      { new: true, runValidators: true }
    );

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    res.json(venue);
  } catch (error) {
    console.error('Error updating venue:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Venue already exists' });
    }
    res.status(500).json({ message: 'Error updating venue' });
  }
});

// Delete a venue
router.delete('/:id', async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Error deleting venue:', error);
    res.status(500).json({ message: 'Error deleting venue' });
  }
});

module.exports = router;
const express = require('express');
const Note = require('../models/Note');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ tenantId: req.tenantId })
      .sort({ createdAt: -1 });
    res.json({ notes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/', async (req, res) => {
  try {
    if (req.tenant.plan === 'free') {
      const noteCount = await Note.countDocuments({ tenantId: req.tenantId });
      if (noteCount >= req.tenant.settings.maxNotes) {
        return res.status(403).json({ 
          error: 'Note limit reached',
          upgradeRequired: true 
        });
      }
    }
    
    const { title, content } = req.body;
    const note = new Note({
      title,
      content,
      tenantId: req.tenantId,
      userId: req.userId
    });
    
    await note.save();
    res.status(201).json({ note });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create note' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id, 
      tenantId: req.tenantId 
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId, userId: req.userId },
      { title, content, updatedAt: new Date() },
      { new: true }
    );
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ note });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update note' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ 
      _id: req.params.id, 
      tenantId: req.tenantId, 
      userId: req.userId 
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;


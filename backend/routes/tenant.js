const express = require('express');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { name, slug, adminEmail, adminPassword } = req.body;
    
    const tenant = new Tenant({ name, slug });
    await tenant.save();
    
    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      tenantId: tenant._id,
      role: 'admin'
    });
    await adminUser.save();
    
    res.status(201).json({ 
      message: 'Tenant created successfully',
      tenant: { id: tenant._id, name, slug }
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create tenant' });
  }
});

router.use(auth);

router.post('/upgrade', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { 
        plan: 'pro',
        'settings.maxNotes': -1
      },
      { new: true }
    );
    
    res.json({ 
      message: 'Upgraded to Pro plan',
      tenant 
    });
  } catch (error) {
    res.status(500).json({ error: 'Upgrade failed' });
  }
});

module.exports = router;


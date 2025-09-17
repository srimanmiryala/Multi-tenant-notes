cconst express = require('express');
const bcrypt = require('bcryptjs');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const connectDB = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Create tenant (no auth required)
router.post('/create', async (req, res) => {
  try {
    console.log('=== TENANT CREATION START ===');
    console.log('Request body:', req.body);
    
    // Ensure database connection
    await connectDB();
    console.log('Database connected');
    
    const { name, slug, adminEmail, adminPassword } = req.body;
    
    // Validate input
    if (!name || !slug || !adminEmail || !adminPassword) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    console.log('Creating tenant with:', { name, slug, adminEmail });
    
    // Check if tenant exists
    const existingTenant = await Tenant.findOne({ slug });
    if (existingTenant) {
      console.log('Tenant already exists with slug:', slug);
      return res.status(400).json({ error: 'Tenant with this slug already exists' });
    }
    console.log('No existing tenant found');
    
    // Create tenant
    const tenant = new Tenant({ 
      name, 
      slug,
      plan: 'free',
      settings: {
        maxNotes: 3,
        maxUsers: 5
      }
    });
    console.log('Saving tenant...');
    await tenant.save();
    console.log('Tenant saved successfully:', tenant._id);
    
    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    console.log('Password hashed');
    
    // Create admin user
    console.log('Creating admin user...');
    const adminUser = new User({
      email: adminEmail,
      password: hashedPassword,
      tenantId: tenant._id,
      role: 'admin'
    });
    await adminUser.save();
    console.log('Admin user created successfully');
    
    console.log('=== TENANT CREATION SUCCESS ===');
    
    res.status(201).json({ 
      message: 'Tenant created successfully',
      tenant: { 
        id: tenant._id, 
        name: tenant.name, 
        slug: tenant.slug,
        plan: tenant.plan 
      }
    });
    
  } catch (error) {
    console.error('=== TENANT CREATION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    res.status(500).json({ 
      error: 'Failed to create tenant',
      details: error.message,
      code: error.code,
      name: error.name
    });
  }
});

// Apply authentication middleware to remaining routes
router.use(auth);

// Upgrade tenant to pro plan
router.post('/upgrade', async (req, res) => {
  try {
    await connectDB();
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { 
        plan: 'pro',
        'settings.maxNotes': -1,
        'settings.maxUsers': -1
      },
      { new: true }
    );
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json({ 
      message: 'Upgraded to Pro plan successfully',
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        settings: tenant.settings
      }
    });
    
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Upgrade failed' });
  }
});

// Get tenant information
router.get('/info', async (req, res) => {
  try {
    await connectDB();
    
    const tenant = await Tenant.findById(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json({
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        settings: tenant.settings,
        createdAt: tenant.createdAt
      }
    });
    
  } catch (error) {
    console.error('Get tenant info error:', error);
    res.status(500).json({ error: 'Failed to get tenant information' });
  }
});

module.exports = router;



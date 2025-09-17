const express = require('express');
const cors = require('cors');
const app = express();

// Enable trust proxy for Vercel
app.set('trust proxy', 1);

// CORS - Allow your frontend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'https://multi-tenant-notes-iz5m.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));

// Parse JSON
app.use(express.json({ limit: '10mb' }));

// Simple in-memory storage (for demo)
let tenants = [
  {
    id: 'testco',
    name: 'Test Company',
    slug: 'testco',
    plan: 'free',
    adminEmail: 'admin@testco.com',
    adminPassword: 'Test123!',
    createdAt: new Date()
  }
];

let users = [
  {
    id: 'user1',
    email: 'admin@testco.com',
    password: 'Test123!',
    tenantId: 'testco',
    role: 'admin'
  }
];

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Multi-tenant Notes API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      createTenant: '/api/tenants/create',
      login: '/api/auth/login'
    },
    timestamp: new Date()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Create tenant
app.post('/api/tenants/create', (req, res) => {
  try {
    const { name, slug, adminEmail, adminPassword } = req.body;
    
    console.log('Creating tenant:', { name, slug, adminEmail });
    
    // Validate
    if (!name || !slug || !adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    // Check if exists
    const existing = tenants.find(t => t.slug === slug);
    if (existing) {
      return res.status(400).json({ error: 'Tenant already exists' });
    }
    
    // Create tenant
    const tenant = {
      id: slug,
      name,
      slug,
      plan: 'free',
      adminEmail,
      adminPassword,
      createdAt: new Date()
    };
    
    tenants.push(tenant);
    
    // Create admin user
    const user = {
      id: 'user' + Date.now(),
      email: adminEmail,
      password: adminPassword,
      tenantId: slug,
      role: 'admin'
    };
    
    users.push(user);
    
    console.log('Tenant created successfully');
    
    res.status(201).json({
      message: 'Tenant created successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan
      }
    });
    
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ 
      error: 'Failed to create tenant',
      details: error.message 
    });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const tenantId = req.headers['x-tenant-id'];
    
    console.log('Login attempt:', { email, tenantId });
    
    if (!email || !password || !tenantId) {
      return res.status(400).json({ error: 'Email, password and tenant required' });
    }
    
    // Find tenant
    const tenant = tenants.find(t => t.slug === tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Find user
    const user = users.find(u => u.email === email && u.tenantId === tenantId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check password (simple comparison for demo)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Generate simple token
    const token = `token_${user.id}_${Date.now()}`;
    
    console.log('Login successful');
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        createdAt: tenant.createdAt
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: error.message 
    });
  }
});

// Get all tenants (for debugging)
app.get('/api/tenants', (req, res) => {
  res.json({
    tenants: tenants.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      plan: t.plan,
      createdAt: t.createdAt
    }))
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export for Vercel
module.exports = app;

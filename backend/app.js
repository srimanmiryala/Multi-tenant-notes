const express = require('express');
const app = express();

app.set('trust proxy', 1);
const cors = require('cors');

app.set('trust proxy', 1);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const tenantRoutes = require('./routes/tenant');
const tenantResolver = require('./middleware/tenantResolver');

const app = express();

app.use(helmet());
app.use(cors());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());

// Health check (no tenant required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Tenant creation route (no tenant middleware)
app.use('/api/tenants', tenantRoutes);

// Apply tenant middleware to other routes
app.use('/api', tenantResolver);

// Other routes (require tenant)
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
// Root route (add this after the health check)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Multi-tenant Notes API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      createTenant: '/api/tenants/create',
      login: '/api/auth/login'
    }
  });
});


module.exports = app;



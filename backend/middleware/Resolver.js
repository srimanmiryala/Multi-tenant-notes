const Tenant = require('../models/Tenant');

const tenantResolver = async (req, res, next) => {
  try {
    let tenantId = req.get('X-Tenant-ID') || req.query.tenant;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    const tenant = await Tenant.findOne({ slug: tenantId });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    req.tenant = tenant;
    req.tenantId = tenant._id;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Tenant resolution failed' });
  }
};

module.exports = tenantResolver;


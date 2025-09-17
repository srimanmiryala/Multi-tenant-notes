const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  settings: {
    maxNotes: { type: Number, default: 3 }
  }
});

module.exports = mongoose.model('Tenant', tenantSchema);


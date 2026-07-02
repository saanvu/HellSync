const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema({
  guildId:    String,
  userId:     String,
  xp:         { type: Number, default: 0 },
  level:      { type: Number, default: 0 },
  voiceXp:    { type: Number, default: 0 },
  voiceLevel: { type: Number, default: 0 },
  lastMessage:{ type: Date, default: null }
});

module.exports = mongoose.model('Level', levelSchema);
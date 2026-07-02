const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  guildId:         { type: String, required: true, unique: true },
  prefix:          { type: String, default: process.env.PREFIX || '!' },
  levelChannel:    String,
  ticketCategory:  String,
  ticketLogChannel:String,
  levelUpMessage:  { type: Boolean, default: true },
  voiceLevels:     { type: Boolean, default: true },
});

module.exports = mongoose.model('GuildSettings', schema);

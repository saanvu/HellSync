const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  guildId:      { type: String, required: true },
  channelId:    { type: String, required: true },
  userId:       { type: String, required: true },
  ticketNumber: { type: Number, default: 1 },
  status:       { type: String, default: 'open', enum: ['open', 'closed'] },
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);

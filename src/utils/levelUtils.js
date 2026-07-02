const Level = require('../models/Level');

const COOLDOWN = 60_000;

function getXpForLevel(level) {
  return 5 * level ** 2 + 50 * level + 100;
}

async function addXp(guildId, userId) {
  let entry = await Level.findOne({ guildId, userId }) || new Level({ guildId, userId });

  if (entry.lastMessage && Date.now() - entry.lastMessage < COOLDOWN) return null;

  const gain = Math.floor(Math.random() * 11) + 15; // 15–25 XP
  entry.xp += gain;
  entry.lastMessage = new Date();

  const needed = getXpForLevel(entry.level);
  let leveledUp = false;
  if (entry.xp >= needed) {
    entry.level++;
    entry.xp -= needed;
    leveledUp = true;
  }

  await entry.save();
  return { leveledUp, newLevel: entry.level };
}

module.exports = { addXp, getXpForLevel };
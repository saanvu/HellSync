const Level = require('../models/Level');
const GuildSettings = require('../models/GuildSettings');
const { getXpForLevel } = require('../utils/levelUtils');

const sessions = new Map();
const XP_PER_MIN = 10;

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    try {
      const userId  = newState.id ?? oldState.id;
      const guildId = (newState.guild ?? oldState.guild)?.id;
      if (!guildId || !userId) return;

      const key = `${guildId}-${userId}`;

      if (!oldState.channel && newState.channel) {
        sessions.set(key, Date.now()); // joined
      } else if (oldState.channel && !newState.channel) {
        const joinTime = sessions.get(key);
        if (!joinTime) return;
        sessions.delete(key);

        const mins = Math.floor((Date.now() - joinTime) / 60_000);
        if (mins < 1) return;

        let entry = await Level.findOne({ guildId, userId }) || new Level({ guildId, userId });
        entry.voiceXp += mins * XP_PER_MIN;

        const needed = getXpForLevel(entry.voiceLevel);
        let leveledUp = false;
        if (entry.voiceXp >= needed) {
          entry.voiceLevel++;
          entry.voiceXp -= needed;
          leveledUp = true;
        }
        await entry.save();

        if (leveledUp) {
          const s = await GuildSettings.findOne({ guildId });
          const ch = s?.levelChannel
            ? client.guilds.cache.get(guildId)?.channels.cache.get(s.levelChannel)
            : null;
          ch?.send(`🎙️ <@${userId}> reached **Voice Level ${entry.voiceLevel}**!`).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Voice XP update failed:', error?.message || error);
    }
  }
};

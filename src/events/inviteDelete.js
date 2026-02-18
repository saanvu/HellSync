const { Events } = require('discord.js');

module.exports = {
    name: Events.InviteDelete,
    async execute(invite, client) {
        // Update cached invites when an invite is deleted
        if (!client.guildInvites) {
            client.guildInvites = new Map();
        }

        try {
            const invites = await invite.guild.invites.fetch();
            const codeUses = new Map();
            
            invites.each(inv => codeUses.set(inv.code, inv.uses));
            
            client.guildInvites.set(invite.guild.id, codeUses);
            console.log(`🗑️ Invite deleted: ${invite.code} in ${invite.guild.name}`);
        } catch (error) {
            console.error('InviteDelete error:', error);
        }
    }
};

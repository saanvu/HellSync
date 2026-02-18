const { Events } = require('discord.js');

module.exports = {
    name: Events.InviteCreate,
    async execute(invite, client) {
        // Update cached invites when a new invite is created
        if (!client.guildInvites) {
            client.guildInvites = new Map();
        }

        try {
            const invites = await invite.guild.invites.fetch();
            const codeUses = new Map();
            
            invites.each(inv => codeUses.set(inv.code, inv.uses));
            
            client.guildInvites.set(invite.guild.id, codeUses);
            console.log(`✅ Invite created: ${invite.code} in ${invite.guild.name}`);
        } catch (error) {
            console.error('InviteCreate error:', error);
        }
    }
};

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    category: 'Utility',
    name: 'invites',
    description: 'Check invite statistics for a user',
    slashOnly: false,

    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Check invite statistics for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check invites for')
                .setRequired(false)),

    async executePrefix(message, args, client) {
        const user = message.mentions.users.first() || message.author;
        await showInvites(message, user, client, false);
    },

    async executeSlash(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        await showInvites(interaction, user, interaction.client, true);
    }
};

async function showInvites(context, user, client, isSlash) {
    const guild = isSlash ? context.guild : context.guild;

    try {
        // Fetch all invites
        const invites = await guild.invites.fetch();
        
        // Filter invites created by the user
        const userInvites = invites.filter(invite => invite.inviter && invite.inviter.id === user.id);
        
        // Calculate total uses
        let totalInvites = 0;
        let validInvites = 0;
        let fakeInvites = 0;
        let leftInvites = 0;

        userInvites.forEach(invite => {
            totalInvites += invite.uses || 0;
        });

        // Get stored invite data if available
        if (client.inviteData && client.inviteData.has(guild.id)) {
            const guildData = client.inviteData.get(guild.id);
            if (guildData.has(user.id)) {
                const userData = guildData.get(user.id);
                validInvites = userData.valid || totalInvites;
                fakeInvites = userData.fake || 0;
                leftInvites = userData.left || 0;
            } else {
                validInvites = totalInvites;
            }
        } else {
            validInvites = totalInvites;
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ 
                name: `${user.username}'s Invites`, 
                iconURL: user.displayAvatarURL() 
            })
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: '📊 Total Invites', value: totalInvites.toString(), inline: true },
                { name: '✅ Valid', value: validInvites.toString(), inline: true },
                { name: '❌ Fake/Left', value: (fakeInvites + leftInvites).toString(), inline: true }
            )
            .setFooter({ text: `Requested by ${isSlash ? context.user.tag : context.author.tag}` })
            .setTimestamp();

        // Show active invite codes
        if (userInvites.size > 0) {
            const inviteList = userInvites
                .map(invite => `\`${invite.code}\` - ${invite.uses} uses`)
                .slice(0, 10)
                .join('\n');
            
            embed.addFields({
                name: `🔗 Active Invite Codes (${userInvites.size})`,
                value: inviteList || 'None'
            });
        }

        if (isSlash) {
            await context.reply({ embeds: [embed] });
        } else {
            await context.reply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Invites command error:', error);
        const errorMsg = 'Failed to fetch invite data. Make sure I have **Manage Server** permission!';
        
        if (isSlash) {
            await context.reply({ content: errorMsg, flags: [64] });
        } else {
            await context.reply({ content: errorMsg, flags: [64] });
        }
    }
}

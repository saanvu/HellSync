const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Utility',
    name: 'leaderboard',
    description: 'Show the server invite leaderboard',
    slashOnly: false,

    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the server invite leaderboard')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number')
                .setRequired(false)
                .setMinValue(1)),

    async executePrefix(message, args, client) {
        const page = parseInt(args[0]) || 1;
        await showLeaderboard(message, client, page, false);
    },

    async executeSlash(interaction) {
        const page = interaction.options.getInteger('page') || 1;
        await showLeaderboard(interaction, interaction.client, page, true);
    }
};

async function showLeaderboard(context, client, page, isSlash) {
    const guild = isSlash ? context.guild : context.guild;

    try {
        const invites = await guild.invites.fetch();
        
        // Create a map to store total invites per user
        const inviteCount = new Map();

        invites.forEach(invite => {
            if (!invite.inviter) return;
            
            const userId = invite.inviter.id;
            const currentCount = inviteCount.get(userId) || 0;
            inviteCount.set(userId, currentCount + (invite.uses || 0));
        });

        // Sort by invite count
        const sorted = [...inviteCount.entries()]
            .sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0) {
            const errorMsg = '❌ No invite data available for this server!';
            if (isSlash) {
                return context.reply({ content: errorMsg, flags: [64] });
            } else {
                return context.reply({ content: errorMsg, flags: [64] });
            }
        }

        // Pagination
        const itemsPerPage = 10;
        const maxPage = Math.ceil(sorted.length / itemsPerPage);
        const currentPage = Math.min(Math.max(page, 1), maxPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;

        const pageData = sorted.slice(start, end);

        // Build leaderboard
        const leaderboard = await Promise.all(
            pageData.map(async ([userId, count], index) => {
                const user = await client.users.fetch(userId).catch(() => null);
                const position = start + index + 1;
                const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `\`${position}\``;
                const username = user ? user.username : 'Unknown User';
                
                return `${medal} **${username}** - ${count} invites`;
            })
        );

        const embed = new EmbedBuilder()
            .setColor(0xFADE13)
            .setTitle('📊 Invite Leaderboard')
            .setDescription(leaderboard.join('\n'))
            .setFooter({ text: `Page ${currentPage}/${maxPage} • Total ${sorted.length} inviters` })
            .setTimestamp();

        if (isSlash) {
            await context.reply({ embeds: [embed] });
        } else {
            await context.reply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Leaderboard error:', error);
        const errorMsg = 'Failed to fetch leaderboard data. Make sure I have **Manage Server** permission!';
        
        if (isSlash) {
            await context.reply({ content: errorMsg, flags: [64] });
        } else {
            await context.reply({ content: errorMsg, flags: [64] });
        }
    }
}

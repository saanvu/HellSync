const {
    EmbedBuilder,
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType,
} = require('discord.js');

/**
 * Prefix commands that exist in your OTHER bot (anti-raid/anti-nuke bot).
 * These are display-only in this help bot.
 */
const ANTI_NUKE_PREFIX = 'hs!';
const ANTI_NUKE_COMMANDS = [
    { usage: `${ANTI_NUKE_PREFIX}antispam on`, desc: 'Turn anti-spam ON (server owner only)' },
    { usage: `${ANTI_NUKE_PREFIX}antispam off`, desc: 'Turn anti-spam OFF (server owner only)' },
    { usage: `${ANTI_NUKE_PREFIX}antinuke on`, desc: 'Turn anti-nuke ON (server owner only)' },
    { usage: `${ANTI_NUKE_PREFIX}antinuke off`, desc: 'Turn anti-nuke OFF (server owner only)' },
    { usage: `${ANTI_NUKE_PREFIX}addtrusted @user`, desc: 'Add a trusted user (server owner only)' },
    { usage: `${ANTI_NUKE_PREFIX}removetrusted @user`, desc: 'Remove a trusted user (server owner only)' },
    { usage: `${ANTI_NUKE_PREFIX}trustedlist`, desc: 'Show trusted users list' },
    { usage: `${ANTI_NUKE_PREFIX}untimeout @user [reason]`, desc: 'Remove timeout (needs Moderate Members permission)' },
    { usage: `${ANTI_NUKE_PREFIX}config`, desc: 'Show config placeholder/status' },
];

const ANTI_NUKE_CATEGORY_NAME = 'Anti-Nuke (Prefix)';

module.exports = {
    category: 'Info',
    name: 'help',
    description: 'Show all available commands',
    slashOnly: false,

    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands'),

    // Prefix help (for THIS help bot)
    async executePrefix(message, args, client) {
        const prefix = client.config?.prefix ?? process.env.PREFIX ?? '!';
        const cmds = Array.from(client.commands?.values?.() ?? []).filter((c) => !c.slashOnly);

        const embed = new EmbedBuilder()
            .setColor(0xfade13)
            .setAuthor({
                name: 'HellSync Help',
                iconURL: client.user.displayAvatarURL({ size: 256 }),
            })
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setDescription(
                [
                    `Use \`${prefix}help\` or \`/help\`.`,
                    ``,
                    `The Anti-Nuke commands use prefix commands \`${ANTI_NUKE_PREFIX}\``,
                ].join('\n')
            )
            .setTimestamp();

        embed.addFields(
            {
                name: 'This bot commands',
                value: cmds.map((c) => `\`${prefix}${c.name}\``).slice(0, 50).join(', ') || 'None',
            },
            {
                name: 'Anti-Nuke (Prefix) commands',
                value: ANTI_NUKE_COMMANDS.map((c) => `• \`${c.usage}\` — ${c.desc}`).join('\n').slice(0, 1024),
            }
        );

        return message.reply({ embeds: [embed] });
    },

    // Slash help with dropdown categories
    async executeSlash(interaction) {
        const { client } = interaction;

        // Real slash commands in THIS bot
        const allSlash = Array.from(client.commands?.values?.() ?? []).filter((cmd) => cmd?.data);

        // Build category map (DON'T skip Setup this time)
        const categories = {};
        for (const cmd of allSlash) {
            if (!cmd.category) continue;
            if (!categories[cmd.category]) categories[cmd.category] = [];
            categories[cmd.category].push(cmd);
        }

        // Inject an extra dropdown category for the other bot's prefix commands
        categories[ANTI_NUKE_CATEGORY_NAME] = ANTI_NUKE_COMMANDS.map((c) => ({
            __prefixOnly: true,
            usage: c.usage,
            description: c.desc,
        }));

        const categoryKeys = Object.keys(categories);
        if (!categoryKeys.length) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('No commands are registered.')],
                ephemeral: true,
            });
        }

        // Stats (count slash + injected prefix list - but count Setup commands)
        const totalSlash = allSlash.length;
        const totalCommands = totalSlash + ANTI_NUKE_COMMANDS.length;
        const serverCount = client.guilds.cache.size;
        const totalMembers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount ?? 0), 0);

        const mainList = [
            'Setup',
            'Moderation',
            'Utility',
            'Anti-Nuke'
        ];

        const extrasList = [
            'Info',
            'Music',
            'Economy',
            'Fun'
        ];

        const options = categoryKeys.slice(0, 25).map((cat) => ({
            label: cat,
            value: cat.toLowerCase(),
            description: cat === ANTI_NUKE_CATEGORY_NAME ? `View prefix commands (${ANTI_NUKE_PREFIX})` : `View ${cat} commands`,
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help-category-select')
            .setPlaceholder('Select a command category')
            .addOptions(options);

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        const avatar = client.user.displayAvatarURL({ size: 1024 });

        const baseEmbed = new EmbedBuilder()
            .setColor(0xfade13)
            .setAuthor({ name: 'HellSync Help', iconURL: avatar })
            .setThumbnail(avatar)
            .setImage(avatar)
            .setDescription(
                [
                    `• Hey! ${interaction.user.globalName ?? interaction.user.username}`,
                    `• I've total ${totalCommands} commands`,
                    `• I'm in ${serverCount} servers with ${totalMembers} members`,
                    `• The Anti-Nuke commands use prefix commands \`${ANTI_NUKE_PREFIX}\``,
                ].join('\n')
            )
            .addFields(
                {
                    name: 'Main',
                    value: mainList.map((x) => `• ${x}`).join('\n'),
                    inline: true,
                },
                {
                    name: 'Extras',
                    value: extrasList.map((x) => `• ${x}`).join('\n'),
                    inline: true,
                }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({
            embeds: [baseEmbed],
            components: [selectRow],
            ephemeral: false,
        });

        const msg = await interaction.fetchReply();

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60_000,
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: 'Only the user who ran this command can use this menu.',
                    ephemeral: true,
                });
            }

            const selected = i.values[0];
            const realKey = categoryKeys.find((k) => k.toLowerCase() === selected) ?? categoryKeys[0];
            const cmds = categories[realKey] || [];

            const embed = new EmbedBuilder()
                .setColor(0xfade13)
                .setAuthor({ name: 'HellSync Help', iconURL: avatar })
                .setThumbnail(avatar)
                .setTitle(`${realKey} Commands`)
                .setTimestamp();

            // If Anti-Nuke category selected, show prefix commands with hs!
            if (realKey === ANTI_NUKE_CATEGORY_NAME) {
                embed.setDescription(`These commands use prefix \`${ANTI_NUKE_PREFIX}\` (not slash commands).`);
                const list = ANTI_NUKE_COMMANDS
                    .map((c) => `• \`${c.usage}\` — ${c.desc}`)
                    .join('\n')
                    .slice(0, 4096);
                embed.addFields({ name: 'Commands', value: list || 'None' });
                return i.update({ embeds: [embed], components: [selectRow] });
            }

            // If Setup category selected, show special setup message
            if (realKey.toLowerCase() === 'setup') {
                embed.setDescription([
                    '🛡️ **Automod Setup**',
                    '',
                    'Use `/setup` to configure the Automod feature for your server.',
                    '',
                    'The interactive setup wizard will guide you through:',
                    '• Anti-Spam Protection',
                    '• Anti-Links Protection',
                    '• Anti-Caps Protection',
                    '• Bad Words Filter',
                    '• Anti-Mention Spam',
                    '',
                    'You can also use `/automod` for manual configuration.'
                ].join('\n'));
                
                embed.addFields({
                    name: '📝 Quick Start',
                    value: [
                        '1. Run `/setup` to start the interactive wizard',
                        '2. Follow the step-by-step prompts',
                        '3. Configure features based on your needs',
                        '4. Use `/automod config` to view your settings'
                    ].join('\n')
                });
                
                return i.update({ embeds: [embed], components: [selectRow] });
            }

            // Otherwise show normal slash commands
            embed.setDescription(cmds.length ? 'Here are the commands in this category:' : 'No commands found in this category.');
            if (cmds.length) {
                const commandList = cmds
                    .map((cmd) => `• \`/${cmd.data.name}\` - ${cmd.data.description || 'No description'}`)
                    .join('\n')
                    .slice(0, 4096);
                embed.addFields({ name: 'Commands', value: commandList || 'None' });
            }

            await i.update({ embeds: [embed], components: [selectRow] });
        });

        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder().addComponents(selectMenu.setDisabled(true));
            await msg.edit({ components: [disabledRow] }).catch(() => {});
        });
    },
};

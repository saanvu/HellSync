const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ChannelType,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType
} = require('discord.js');

// Counter types available
const COUNTER_TYPES = {
    'members': { emoji: '👥', description: 'Total members', getValue: (guild) => guild.memberCount },
    'humans': { emoji: '👤', description: 'Human members', getValue: (guild) => guild.members.cache.filter(m => !m.user.bot).size },
    'bots': { emoji: '🤖', description: 'Bot members', getValue: (guild) => guild.members.cache.filter(m => m.user.bot).size },
    'online': { emoji: '🟢', description: 'Online members', getValue: (guild) => guild.members.cache.filter(m => m.presence?.status === 'online').size },
    'offline': { emoji: '⚫', description: 'Offline members', getValue: (guild) => guild.members.cache.filter(m => !m.presence || m.presence.status === 'offline').size },
    'idle': { emoji: '🟡', description: 'Idle members', getValue: (guild) => guild.members.cache.filter(m => m.presence?.status === 'idle').size },
    'dnd': { emoji: '🔴', description: 'DND members', getValue: (guild) => guild.members.cache.filter(m => m.presence?.status === 'dnd').size },
    'channels': { emoji: '📝', description: 'Total channels', getValue: (guild) => guild.channels.cache.size },
    'text-channels': { emoji: '#️⃣', description: 'Text channels', getValue: (guild) => guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size },
    'voice-channels': { emoji: '🔊', description: 'Voice channels', getValue: (guild) => guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size },
    'categories': { emoji: '📁', description: 'Categories', getValue: (guild) => guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size },
    'roles': { emoji: '🎭', description: 'Total roles', getValue: (guild) => guild.roles.cache.size - 1 },
    'boosts': { emoji: '⭐', description: 'Server boosts', getValue: (guild) => guild.premiumSubscriptionCount || 0 },
    'boost-level': { emoji: '🚀', description: 'Boost level', getValue: (guild) => guild.premiumTier },
    'emojis': { emoji: '😀', description: 'Total emojis', getValue: (guild) => guild.emojis.cache.size },
    'static-emojis': { emoji: '😊', description: 'Static emojis', getValue: (guild) => guild.emojis.cache.filter(e => !e.animated).size },
    'animated-emojis': { emoji: '✨', description: 'Animated emojis', getValue: (guild) => guild.emojis.cache.filter(e => e.animated).size },
    'stickers': { emoji: '🎨', description: 'Total stickers', getValue: (guild) => guild.stickers.cache.size },
};

module.exports = {
    category: 'Info',
    name: 'serverstats',
    description: 'Advanced server statistics system (ServerStats clone)',
    slashOnly: false,

    data: new SlashCommandBuilder()
        .setName('serverstats')
        .setDescription('Advanced server statistics system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup server stats with default counters'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new counter')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Counter type')
                        .setRequired(true)
                        .addChoices(
                            { name: '👥 Members', value: 'members' },
                            { name: '👤 Humans', value: 'humans' },
                            { name: '🤖 Bots', value: 'bots' },
                            { name: '🟢 Online', value: 'online' },
                            { name: '⚫ Offline', value: 'offline' },
                            { name: '🟡 Idle', value: 'idle' },
                            { name: '🔴 DND', value: 'dnd' },
                            { name: '📝 Channels', value: 'channels' },
                            { name: '#️⃣ Text Channels', value: 'text-channels' },
                            { name: '🔊 Voice Channels', value: 'voice-channels' },
                            { name: '📁 Categories', value: 'categories' },
                            { name: '🎭 Roles', value: 'roles' },
                            { name: '⭐ Boosts', value: 'boosts' },
                            { name: '🚀 Boost Level', value: 'boost-level' },
                            { name: '😀 Emojis', value: 'emojis' },
                            { name: '😊 Static Emojis', value: 'static-emojis' },
                            { name: '✨ Animated Emojis', value: 'animated-emojis' },
                            { name: '🎨 Stickers', value: 'stickers' }
                        ))
                .addStringOption(option =>
                    option.setName('format')
                        .setDescription('Custom format (use {count} for number, e.g. "Members: {count}")')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a counter'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Remove all counters and reset'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all active counters'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('serverinfo')
                .setDescription('View detailed server information'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async executePrefix(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply({ content: 'You need Manage Channels permission!', flags: [64] });
        }

        const subcommand = args[0]?.toLowerCase() || 'serverinfo';
        await handleSubcommand(message, subcommand, args.slice(1), client, false);
    },

    async executeSlash(interaction) {
        const subcommand = interaction.options.getSubcommand();
        await handleSubcommand(interaction, subcommand, [], interaction.client, true);
    }
};

async function handleSubcommand(context, subcommand, args, client, isSlash) {
    const guild = isSlash ? context.guild : context.guild;

    // Initialize config
    if (!client.serverStatsConfig) client.serverStatsConfig = new Map();

    switch (subcommand) {
        case 'setup':
            await setupStats(guild, context, client, isSlash);
            break;
        case 'create':
            const counterType = args[0] || (isSlash ? context.options.getString('type') : null);
            const format = args[1] || (isSlash ? context.options.getString('format') : null);
            await createCounter(guild, counterType, format, context, client, isSlash);
            break;
        case 'delete':
            await deleteCounter(guild, context, client, isSlash);
            break;
        case 'reset':
            await resetStats(guild, context, client, isSlash);
            break;
        case 'list':
            await listCounters(guild, context, client, isSlash);
            break;
        case 'serverinfo':
            await showServerInfo(guild, context, client, isSlash);
            break;
        default:
            const msg = 'Invalid subcommand! Use: `setup`, `create`, `delete`, `reset`, `list`, or `serverinfo`.';
            if (isSlash) {
                await context.reply({ content: msg, flags: [64] });
            } else {
                await context.reply({ content: msg, flags: [64] });
            }
    }
}

async function setupStats(guild, context, client, isSlash) {
    try {
        // Create category
        const category = await guild.channels.create({
            name: '📊 Server Stats',
            type: ChannelType.GuildCategory,
            position: 0
        });

        // Default counters to create
        const defaultCounters = [
            { type: 'members', format: '👥 Members: {count}' },
            { type: 'humans', format: '👤 Humans: {count}' },
            { type: 'bots', format: '🤖 Bots: {count}' },
            { type: 'online', format: '🟢 Online: {count}' },
            { type: 'channels', format: '📝 Channels: {count}' }
        ];

        const counters = [];

        for (const counter of defaultCounters) {
            const channel = await guild.channels.create({
                name: counter.format.replace('{count}', '...'),
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: ['Connect', 'Speak']
                    }
                ]
            });

            counters.push({
                id: channel.id,
                type: counter.type,
                format: counter.format
            });
        }

        // Save config
        client.serverStatsConfig.set(guild.id, {
            categoryId: category.id,
            counters: counters
        });

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('✅ Server Stats Setup Complete!')
            .setDescription(`Created **${counters.length}** default counters in ${category}`)
            .addFields({
                name: '📊 Default Counters',
                value: defaultCounters.map(c => `• ${c.format.replace('{count}', '...')}`).join('\n')
            })
            .setFooter({ text: 'Use /serverstats create to add more counters!' })
            .setTimestamp();

        if (isSlash) {
            await context.reply({ embeds: [embed] });
        } else {
            await context.reply({ embeds: [embed] });
        }

        // Update immediately
        await updateAllCounters(guild, client);

    } catch (error) {
        console.error('Setup error:', error);
        const msg = 'Failed to setup server stats! Make sure I have Manage Channels permission.';
        if (isSlash) {
            await context.reply({ content: msg, flags: [64] });
        } else {
            await context.reply({ content: msg, flags: [64] });
        }
    }
}

async function createCounter(guild, counterType, format, context, client, isSlash) {
    try {
        if (!COUNTER_TYPES[counterType]) {
            return isSlash ?
                context.reply({ content: '❌ Invalid counter type!', flags: [64] }) :
                context.reply({ content: '❌ Invalid counter type!', flags: [64] });
        }

        const config = client.serverStatsConfig.get(guild.id);
        if (!config) {
            return isSlash ?
                context.reply({ content: '❌ Run `/serverstats setup` first!', flags: [64] }) :
                context.reply({ content: '❌ Run `/serverstats setup` first!', flags: [64] });
        }

        const category = guild.channels.cache.get(config.categoryId);
        if (!category) {
            return isSlash ?
                context.reply({ content: '❌ Stats category not found! Run setup again.', flags: [64] }) :
                context.reply({ content: '❌ Stats category not found! Run setup again.', flags: [64] });
        }

        const counterFormat = format || `${COUNTER_TYPES[counterType].emoji} ${COUNTER_TYPES[counterType].description}: {count}`;

        const channel = await guild.channels.create({
            name: counterFormat.replace('{count}', '...'),
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ['Connect', 'Speak']
                }
            ]
        });

        config.counters.push({
            id: channel.id,
            type: counterType,
            format: counterFormat
        });

        client.serverStatsConfig.set(guild.id, config);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('✅ Counter Created!')
            .setDescription(`Added ${channel} with format:\n\`${counterFormat}\``)
            .setTimestamp();

        if (isSlash) {
            await context.reply({ embeds: [embed] });
        } else {
            await context.reply({ embeds: [embed] });
        }

        await updateAllCounters(guild, client);

    } catch (error) {
        console.error('Create counter error:', error);
        const msg = 'Failed to create counter!';
        if (isSlash) {
            await context.reply({ content: msg, flags: [64] });
        } else {
            await context.reply({ content: msg, flags: [64] });
        }
    }
}

async function deleteCounter(guild, context, client, isSlash) {
    try {
        const config = client.serverStatsConfig.get(guild.id);
        if (!config || !config.counters.length) {
            return isSlash ?
                context.reply({ content: '❌ No counters found!', flags: [64] }) :
                context.reply({ content: '❌ No counters found!', flags: [64] });
        }

        // Create select menu
        const options = config.counters.map((counter, index) => ({
            label: `${COUNTER_TYPES[counter.type].emoji} ${COUNTER_TYPES[counter.type].description}`,
            description: counter.format,
            value: index.toString()
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('delete-counter-select')
            .setPlaceholder('Select a counter to delete')
            .addOptions(options.slice(0, 25)); // Discord max 25 options

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🗑️ Delete Counter')
            .setDescription('Select a counter to delete from the menu below:')
            .setTimestamp();

        const reply = isSlash ?
            await context.reply({ embeds: [embed], components: [row], fetchReply: true }) :
            await context.reply({ embeds: [embed], components: [row], fetchReply: true });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60000
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== (isSlash ? context.user.id : context.author.id)) {
                return i.reply({ content: 'Only the command user can use this menu!', flags: [64] });
            }

            const selectedIndex = parseInt(i.values[0]);
            const counter = config.counters[selectedIndex];

            const channel = guild.channels.cache.get(counter.id);
            if (channel) await channel.delete();

            config.counters.splice(selectedIndex, 1);
            client.serverStatsConfig.set(guild.id, config);

            await i.update({
                embeds: [new EmbedBuilder().setColor(0x57F287).setTitle('✅ Counter Deleted!').setTimestamp()],
                components: []
            });
        });

    } catch (error) {
        console.error('Delete counter error:', error);
    }
}

async function resetStats(guild, context, client, isSlash) {
    try {
        const config = client.serverStatsConfig.get(guild.id);
        if (!config) {
            return isSlash ?
                context.reply({ content: '❌ No stats configured!', flags: [64] }) :
                context.reply({ content: '❌ No stats configured!', flags: [64] });
        }

        const category = guild.channels.cache.get(config.categoryId);
        if (category) {
            for (const child of category.children.cache.values()) {
                await child.delete();
            }
            await category.delete();
        }

        client.serverStatsConfig.delete(guild.id);

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🗑️ Stats Reset')
            .setDescription('All counters have been removed.')
            .setTimestamp();

        if (isSlash) {
            await context.reply({ embeds: [embed] });
        } else {
            await context.reply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Reset error:', error);
    }
}

async function listCounters(guild, context, client, isSlash) {
    try {
        const config = client.serverStatsConfig.get(guild.id);
        if (!config || !config.counters.length) {
            return isSlash ?
                context.reply({ content: '❌ No counters configured!', flags: [64] }) :
                context.reply({ content: '❌ No counters configured!', flags: [64] });
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📊 Active Counters')
            .setDescription(config.counters.map((c, i) => `**${i + 1}.** ${c.format}`).join('\n'))
            .setFooter({ text: `Total: ${config.counters.length} counters` })
            .setTimestamp();

        if (isSlash) {
            await context.reply({ embeds: [embed] });
        } else {
            await context.reply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('List error:', error);
    }
}

async function showServerInfo(guild, context, client, isSlash) {
    try {
        await guild.members.fetch();

        const totalMembers = guild.memberCount;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const humans = totalMembers - bots;
        const online = guild.members.cache.filter(m => m.presence?.status === 'online').size;

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`${guild.name} Server Information`)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .addFields(
                { name: '👥 Members', value: `**${totalMembers}** total\n${humans} humans • ${bots} bots`, inline: true },
                { name: '📝 Channels', value: guild.channels.cache.size.toString(), inline: true },
                { name: '🎭 Roles', value: (guild.roles.cache.size - 1).toString(), inline: true },
                { name: '⭐ Boosts', value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
                { name: '👑 Owner', value: `${guild.owner}`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `Server ID: ${guild.id}` })
            .setTimestamp();

        if (isSlash) {
            await context.reply({ embeds: [embed] });
        } else {
            await context.reply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Server info error:', error);
    }
}

// Auto-update function (called every 10 minutes)
async function updateAllCounters(guild, client) {
    try {
        const config = client.serverStatsConfig.get(guild.id);
        if (!config) return;

        await guild.members.fetch();

        for (const counter of config.counters) {
            const channel = guild.channels.cache.get(counter.id);
            if (!channel) continue;

            const counterType = COUNTER_TYPES[counter.type];
            if (!counterType) continue;

            const value = counterType.getValue(guild);
            const newName = counter.format.replace('{count}', value.toString());

            if (channel.name !== newName) {
                await channel.setName(newName).catch(() => {});
            }
        }
    } catch (error) {
        // Silently ignore errors
    }
}

// Update all guilds every 10 minutes
setInterval(async () => {
    if (!global.client?.guilds) return;
    
    for (const guild of global.client.guilds.cache.values()) {
        await updateAllCounters(guild, global.client);
    }
}, 600000); // 10 minutes

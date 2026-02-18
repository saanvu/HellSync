const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ChannelType 
} = require('discord.js');

module.exports = {
    category: 'Moderation',
    name: 'logs',
    description: 'Configure server logging (Dyno-style)',
    slashOnly: false,

    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Configure server logging system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup logging channels')
                .addChannelOption(option =>
                    option.setName('actionlog')
                        .setDescription('Channel for action logs (message delete, edits, etc)')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('modlog')
                        .setDescription('Channel for moderation logs (ban, kick, warn, etc)')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('joinlog')
                        .setDescription('Channel for join/leave logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Toggle specific log types')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Log type to toggle')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Message Delete', value: 'messageDelete' },
                            { name: 'Message Edit', value: 'messageEdit' },
                            { name: 'Message Bulk Delete', value: 'messageBulkDelete' },
                            { name: 'Member Join', value: 'memberJoin' },
                            { name: 'Member Leave', value: 'memberLeave' },
                            { name: 'Member Ban', value: 'memberBan' },
                            { name: 'Member Unban', value: 'memberUnban' },
                            { name: 'Member Kick', value: 'memberKick' },
                            { name: 'Nickname Change', value: 'nicknameChange' },
                            { name: 'Role Update', value: 'roleUpdate' },
                            { name: 'Channel Create', value: 'channelCreate' },
                            { name: 'Channel Delete', value: 'channelDelete' },
                            { name: 'Channel Update', value: 'channelUpdate' },
                            { name: 'Voice State', value: 'voiceState' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ignore')
                .setDescription('Ignore a channel or role from logging')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to ignore')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to ignore')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current logging configuration'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable all logging'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async executePrefix(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply({ content: 'You need Manage Server permission!', flags: [64] });
        }

        const subcommand = args[0]?.toLowerCase() || 'view';
        await handleSubcommand(message, subcommand, args.slice(1), client, false);
    },

    async executeSlash(interaction) {
        const subcommand = interaction.options.getSubcommand();
        await handleSubcommand(interaction, subcommand, [], interaction.client, true);
    }
};

async function handleSubcommand(context, subcommand, args, client, isSlash) {
    const guild = isSlash ? context.guild : context.guild;

    // Initialize logging config
    if (!client.loggingConfig) client.loggingConfig = new Map();

    switch (subcommand) {
        case 'setup':
            await setupLogs(guild, context, client, isSlash);
            break;
        case 'toggle':
            const logType = isSlash ? context.options.getString('type') : args[0];
            await toggleLog(guild, logType, context, client, isSlash);
            break;
        case 'ignore':
            await ignoreChannelOrRole(guild, context, client, isSlash);
            break;
        case 'view':
            await viewConfig(guild, context, client, isSlash);
            break;
        case 'disable':
            await disableLogs(guild, context, client, isSlash);
            break;
        default:
            const msg = 'Invalid subcommand! Use: `setup`, `toggle`, `ignore`, `view`, or `disable`.';
            if (isSlash) {
                await context.reply({ content: msg, flags: [64] });
            } else {
                await context.reply({ content: msg, flags: [64] });
            }
    }
}

async function setupLogs(guild, context, client, isSlash) {
    try {
        const actionLogChannel = isSlash ? context.options.getChannel('actionlog') : null;
        const modLogChannel = isSlash ? context.options.getChannel('modlog') : null;
        const joinLogChannel = isSlash ? context.options.getChannel('joinlog') : null;

        const config = client.loggingConfig.get(guild.id) || {
            actionLogChannel: null,
            modLogChannel: null,
            joinLogChannel: null,
            ignoredChannels: [],
            ignoredRoles: [],
            enabledLogs: {
                messageDelete: true,
                messageEdit: true,
                messageBulkDelete: true,
                memberJoin: true,
                memberLeave: true,
                memberBan: true,
                memberUnban: true,
                memberKick: true,
                nicknameChange: true,
                roleUpdate: true,
                channelCreate: true,
                channelDelete: true,
                channelUpdate: true,
                voiceState: true
            }
        };

        if (actionLogChannel) config.actionLogChannel = actionLogChannel.id;
        if (modLogChannel) config.modLogChannel = modLogChannel.id;
        if (joinLogChannel) config.joinLogChannel = joinLogChannel.id;

        client.loggingConfig.set(guild.id, config);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setTitle('✅ Logging Configured!')
            .setDescription('Your logging channels have been set up successfully.')
            .addFields(
                { 
                    name: '📝 Action Log', 
                    value: actionLogChannel ? `${actionLogChannel}` : 'Not set', 
                    inline: true 
                },
                { 
                    name: '🔨 Mod Log', 
                    value: modLogChannel ? `${modLogChannel}` : 'Not set', 
                    inline: true 
                },
                { 
                    name: '👋 Join/Leave Log', 
                    value: joinLogChannel ? `${joinLogChannel}` : 'Not set', 
                    inline: true 
                }
            )
            .setFooter({ text: 'Use /logs toggle to enable/disable specific log types' })
            .setTimestamp();

        if (isSlash) {
            await context.reply({ embeds: [embed] });
        } else {
            await context.reply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Setup logs error:', error);
        const msg = 'Failed to setup logging!';
        if (isSlash) {
            await context.reply({ content: msg, flags: [64] });
        } else {
            await context.reply({ content: msg, flags: [64] });
        }
    }
}

async function toggleLog(guild, logType, context, client, isSlash) {
    try {
        const config = client.loggingConfig.get(guild.id);
        if (!config) {
            return isSlash ?
                context.reply({ content: '❌ Run `/logs setup` first!', flags: [64] }) :
                context.reply({ content: '❌ Run `/logs setup` first!', flags: [64] });
        }

        config.enabledLogs[logType] = !config.enabledLogs[logType];
        client.loggingConfig.set(guild.id, config);

        const status = config.enabledLogs[logType] ? '✅ Enabled' : '❌ Disabled';

        const embed = new EmbedBuilder()
            .setColor(config.enabledLogs[logType] ? 0x57F287 : 0xFF0000)
            .setTitle(`${status}: ${logType}`)
            .setTimestamp();

        if (isSlash) {
            await context.reply({ embeds: [embed] });
        } else {
            await context.reply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Toggle log error:', error);
    }
}

async function ignoreChannelOrRole(guild, context, client, isSlash) {
    try {
        const config = client.loggingConfig.get(guild.id);
        if (!config) {
            return isSlash ?
                context.reply({ content: '❌ Run `/logs setup` first!', flags: [64] }) :
                context.reply({ content: '❌ Run `/logs setup` first!', flags: [64] });
        }

        const channel = isSlash ? context.options.getChannel('channel') : null;
        const role = isSlash ? context.options.getRole('role') : null;

        if (channel) {
            if (config.ignoredChannels.includes(channel.id)) {
                config.ignoredChannels = config.ignoredChannels.filter(id => id !== channel.id);
                var message = `🔓 Removed ${channel} from ignored channels.`;
            } else {
                config.ignoredChannels.push(channel.id);
                var message = `🔒 Added ${channel} to ignored channels.`;
            }
        } else if (role) {
            if (config.ignoredRoles.includes(role.id)) {
                config.ignoredRoles = config.ignoredRoles.filter(id => id !== role.id);
                var message = `🔓 Removed ${role} from ignored roles.`;
            } else {
                config.ignoredRoles.push(role.id);
                var message = `🔒 Added ${role} to ignored roles.`;
            }
        } else {
            return isSlash ?
                context.reply({ content: '❌ Provide a channel or role!', flags: [64] }) :
                context.reply({ content: '❌ Provide a channel or role!', flags: [64] });
        }

        client.loggingConfig.set(guild.id, config);

        if (isSlash) {
            await context.reply({ content: message });
        } else {
            await context.reply({ content: message });
        }

    } catch (error) {
        console.error('Ignore error:', error);
    }
}

async function viewConfig(guild, context, client, isSlash) {
    try {
        const config = client.loggingConfig.get(guild.id);
        if (!config) {
            return isSlash ?
                context.reply({ content: '❌ Logging not configured! Run `/logs setup`', flags: [64] }) :
                context.reply({ content: '❌ Logging not configured! Run `/logs setup`', flags: [64] });
        }

        const actionLog = config.actionLogChannel ? `<#${config.actionLogChannel}>` : 'Not set';
        const modLog = config.modLogChannel ? `<#${config.modLogChannel}>` : 'Not set';
        const joinLog = config.joinLogChannel ? `<#${config.joinLogChannel}>` : 'Not set';

        const enabledLogs = Object.entries(config.enabledLogs)
            .filter(([_, enabled]) => enabled)
            .map(([type, _]) => `✅ ${type}`)
            .join('\n') || 'None enabled';

        const disabledLogs = Object.entries(config.enabledLogs)
            .filter(([_, enabled]) => !enabled)
            .map(([type, _]) => `❌ ${type}`)
            .join('\n') || 'All enabled';

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('📊 Logging Configuration')
            .addFields(
                { name: '📝 Action Log', value: actionLog, inline: true },
                { name: '🔨 Mod Log', value: modLog, inline: true },
                { name: '👋 Join/Leave Log', value: joinLog, inline: true },
                { name: '✅ Enabled Logs', value: enabledLogs, inline: true },
                { name: '❌ Disabled Logs', value: disabledLogs, inline: true }
            )
            .setTimestamp();

        if (config.ignoredChannels.length > 0) {
            embed.addFields({
                name: '🔒 Ignored Channels',
                value: config.ignoredChannels.map(id => `<#${id}>`).join(', ')
            });
        }

        if (config.ignoredRoles.length > 0) {
            embed.addFields({
                name: '🔒 Ignored Roles',
                value: config.ignoredRoles.map(id => `<@&${id}>`).join(', ')
            });
        }

        if (isSlash) {
            await context.reply({ embeds: [embed] });
        } else {
            await context.reply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('View config error:', error);
    }
}

async function disableLogs(guild, context, client, isSlash) {
    try {
        client.loggingConfig.delete(guild.id);

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🗑️ Logging Disabled')
            .setDescription('All logging has been disabled for this server.')
            .setTimestamp();

        if (isSlash) {
            await context.reply({ embeds: [embed] });
        } else {
            await context.reply({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Disable logs error:', error);
    }
}

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    category: 'Moderation',
    name: 'automod',
    description: 'Configure automod settings',
    slashOnly: false,

    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configure automod settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup automod for this server'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable or disable automod')
                .addStringOption(option =>
                    option.setName('feature')
                        .setDescription('Feature to toggle')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Anti-Spam', value: 'antispam' },
                            { name: 'Anti-Links', value: 'antilinks' },
                            { name: 'Anti-Caps', value: 'anticaps' },
                            { name: 'Bad Words Filter', value: 'badwords' },
                            { name: 'Anti-Mention Spam', value: 'antimention' }
                        ))
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('View current automod configuration'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('addword')
                .setDescription('Add a word to the bad words filter')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('Word to block')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('removeword')
                .setDescription('Remove a word from the bad words filter')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('Word to unblock')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Whitelist a channel or role from automod')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to whitelist')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to whitelist')
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async executePrefix(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({ content: 'You need Administrator permission to use this command!', flags: [64] });
        }

        const subcommand = args[0]?.toLowerCase();
        
        if (!subcommand) {
            return message.reply({ content: 'Please specify a subcommand: setup, toggle, config, addword, removeword, whitelist', flags: [64] });
        }

        // Initialize automod config if not exists
        if (!client.automodConfig) {
            client.automodConfig = new Map();
        }

        if (!client.automodConfig.has(message.guild.id)) {
            client.automodConfig.set(message.guild.id, {
                antispam: { enabled: false, messageLimit: 5, timeWindow: 5000 },
                antilinks: { enabled: false, allowWhitelisted: true },
                anticaps: { enabled: false, percentage: 70, minLength: 10 },
                badwords: { enabled: false, words: [] },
                antimention: { enabled: false, mentionLimit: 5 },
                whitelistedChannels: [],
                whitelistedRoles: [],
                logChannel: null
            });
        }

        const config = client.automodConfig.get(message.guild.id);

        switch(subcommand) {
            case 'setup':
                await message.reply({ content: '✅ Automod system has been initialized for this server! Use `/automod toggle` to enable features.' });
                break;

            case 'toggle':
                const feature = args[1]?.toLowerCase();
                const enabled = args[2]?.toLowerCase() === 'true';
                
                if (!feature || !['antispam', 'antilinks', 'anticaps', 'badwords', 'antimention'].includes(feature)) {
                    return message.reply({ content: 'Invalid feature! Choose: antispam, antilinks, anticaps, badwords, antimention', flags: [64] });
                }

                config[feature].enabled = enabled;
                client.automodConfig.set(message.guild.id, config);
                await message.reply({ content: `✅ ${feature} has been ${enabled ? 'enabled' : 'disabled'}!` });
                break;

            case 'config':
                const embed = new EmbedBuilder()
                    .setTitle('🛡️ Automod Configuration')
                    .setColor('#5865F2')
                    .addFields(
                        { name: 'Anti-Spam', value: config.antispam.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: 'Anti-Links', value: config.antilinks.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: 'Anti-Caps', value: config.anticaps.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: 'Bad Words Filter', value: config.badwords.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: 'Anti-Mention Spam', value: config.antimention.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: 'Blocked Words', value: config.badwords.words.length > 0 ? config.badwords.words.join(', ') : 'None', inline: false }
                    )
                    .setTimestamp();
                
                await message.reply({ embeds: [embed] });
                break;

            case 'addword':
                const wordToAdd = args.slice(1).join(' ').toLowerCase();
                if (!wordToAdd) {
                    return message.reply({ content: 'Please specify a word to add!', flags: [64] });
                }

                if (!config.badwords.words.includes(wordToAdd)) {
                    config.badwords.words.push(wordToAdd);
                    client.automodConfig.set(message.guild.id, config);
                    await message.reply({ content: `✅ Added "${wordToAdd}" to the bad words filter!` });
                } else {
                    await message.reply({ content: 'This word is already in the filter!', flags: [64] });
                }
                break;

            case 'removeword':
                const wordToRemove = args.slice(1).join(' ').toLowerCase();
                if (!wordToRemove) {
                    return message.reply({ content: 'Please specify a word to remove!', flags: [64] });
                }

                const index = config.badwords.words.indexOf(wordToRemove);
                if (index > -1) {
                    config.badwords.words.splice(index, 1);
                    client.automodConfig.set(message.guild.id, config);
                    await message.reply({ content: `✅ Removed "${wordToRemove}" from the bad words filter!` });
                } else {
                    await message.reply({ content: 'This word is not in the filter!', flags: [64] });
                }
                break;

            case 'whitelist':
                const channelMention = message.mentions.channels.first();
                const roleMention = message.mentions.roles.first();

                if (!channelMention && !roleMention) {
                    return message.reply({ content: 'Please mention a channel or role to whitelist!', flags: [64] });
                }

                if (channelMention) {
                    if (!config.whitelistedChannels.includes(channelMention.id)) {
                        config.whitelistedChannels.push(channelMention.id);
                        await message.reply({ content: `✅ Whitelisted channel ${channelMention}!` });
                    } else {
                        await message.reply({ content: 'This channel is already whitelisted!', flags: [64] });
                    }
                }

                if (roleMention) {
                    if (!config.whitelistedRoles.includes(roleMention.id)) {
                        config.whitelistedRoles.push(roleMention.id);
                        await message.reply({ content: `✅ Whitelisted role ${roleMention}!` });
                    } else {
                        await message.reply({ content: 'This role is already whitelisted!', flags: [64] });
                    }
                }

                client.automodConfig.set(message.guild.id, config);
                break;

            default:
                await message.reply({ content: 'Invalid subcommand! Use: setup, toggle, config, addword, removeword, whitelist', flags: [64] });
        }
    },

    async executeSlash(interaction) {
        const subcommand = interaction.options.getSubcommand();

        // Initialize automod config if not exists
        if (!interaction.client.automodConfig) {
            interaction.client.automodConfig = new Map();
        }

        if (!interaction.client.automodConfig.has(interaction.guild.id)) {
            interaction.client.automodConfig.set(interaction.guild.id, {
                antispam: { enabled: false, messageLimit: 5, timeWindow: 5000 },
                antilinks: { enabled: false, allowWhitelisted: true },
                anticaps: { enabled: false, percentage: 70, minLength: 10 },
                badwords: { enabled: false, words: [] },
                antimention: { enabled: false, mentionLimit: 5 },
                whitelistedChannels: [],
                whitelistedRoles: [],
                logChannel: null
            });
        }

        const config = interaction.client.automodConfig.get(interaction.guild.id);

        switch(subcommand) {
            case 'setup':
                await interaction.reply({ content: '✅ Automod system has been initialized for this server! Use `/automod toggle` to enable features.' });
                break;

            case 'toggle':
                const feature = interaction.options.getString('feature');
                const enabled = interaction.options.getBoolean('enabled');
                
                config[feature].enabled = enabled;
                interaction.client.automodConfig.set(interaction.guild.id, config);
                
                const featureNames = {
                    antispam: 'Anti-Spam',
                    antilinks: 'Anti-Links',
                    anticaps: 'Anti-Caps',
                    badwords: 'Bad Words Filter',
                    antimention: 'Anti-Mention Spam'
                };
                
                await interaction.reply({ content: `✅ ${featureNames[feature]} has been ${enabled ? 'enabled' : 'disabled'}!` });
                break;

            case 'config':
                const embed = new EmbedBuilder()
                    .setTitle('🛡️ Automod Configuration')
                    .setColor('#5865F2')
                    .addFields(
                        { name: 'Anti-Spam', value: config.antispam.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: 'Anti-Links', value: config.antilinks.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: 'Anti-Caps', value: config.anticaps.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: 'Bad Words Filter', value: config.badwords.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: 'Anti-Mention Spam', value: config.antimention.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
                        { name: 'Blocked Words', value: config.badwords.words.length > 0 ? config.badwords.words.join(', ') : 'None', inline: false }
                    )
                    .setTimestamp();
                
                await interaction.reply({ embeds: [embed] });
                break;

            case 'addword':
                const wordToAdd = interaction.options.getString('word').toLowerCase();

                if (!config.badwords.words.includes(wordToAdd)) {
                    config.badwords.words.push(wordToAdd);
                    interaction.client.automodConfig.set(interaction.guild.id, config);
                    await interaction.reply({ content: `✅ Added "${wordToAdd}" to the bad words filter!` });
                } else {
                    await interaction.reply({ content: 'This word is already in the filter!', flags: [64] });
                }
                break;

            case 'removeword':
                const wordToRemove = interaction.options.getString('word').toLowerCase();

                const index = config.badwords.words.indexOf(wordToRemove);
                if (index > -1) {
                    config.badwords.words.splice(index, 1);
                    interaction.client.automodConfig.set(interaction.guild.id, config);
                    await interaction.reply({ content: `✅ Removed "${wordToRemove}" from the bad words filter!` });
                } else {
                    await interaction.reply({ content: 'This word is not in the filter!', flags: [64] });
                }
                break;

            case 'whitelist':
                const channel = interaction.options.getChannel('channel');
                const role = interaction.options.getRole('role');

                if (!channel && !role) {
                    return interaction.reply({ content: 'Please specify a channel or role to whitelist!', flags: [64] });
                }

                if (channel) {
                    if (!config.whitelistedChannels.includes(channel.id)) {
                        config.whitelistedChannels.push(channel.id);
                        await interaction.reply({ content: `✅ Whitelisted channel ${channel}!` });
                    } else {
                        await interaction.reply({ content: 'This channel is already whitelisted!', flags: [64] });
                    }
                }

                if (role) {
                    if (!config.whitelistedRoles.includes(role.id)) {
                        config.whitelistedRoles.push(role.id);
                        await interaction.reply({ content: `✅ Whitelisted role ${role}!` });
                    } else {
                        await interaction.reply({ content: 'This role is already whitelisted!', flags: [64] });
                    }
                }

                interaction.client.automodConfig.set(interaction.guild.id, config);
                break;
        }
    }
};

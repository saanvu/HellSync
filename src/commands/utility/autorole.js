const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits 
} = require('discord.js');

module.exports = {
    category: 'Utility',
    name: 'autorole',
    description: 'Configure auto-role for new members',

    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Configure auto-role for new members')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the auto-role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to assign to new members')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable auto-role'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test auto-role on yourself'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current auto-role configuration'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const { client, guild } = interaction;
        const subcommand = interaction.options.getSubcommand();

        // Initialize if missing
        if (!client.autoroleConfig) client.autoroleConfig = new Map();

        switch (subcommand) {
            case 'set':
                const role = interaction.options.getRole('role');
                
                // Check bot permissions
                if (!guild.members.me.permissions.has('ManageRoles')) {
                    return interaction.reply({ 
                        content: '❌ I need the **Manage Roles** permission!', 
                        flags: [64] 
                    });
                }

                // Check role hierarchy
                const botHighestRole = guild.members.me.roles.highest;
                if (role.position >= botHighestRole.position) {
                    return interaction.reply({ 
                        content: `❌ I cannot assign ${role} because it's higher than or equal to my highest role (${botHighestRole})!\n\n💡 **Solution:** Move my role above ${role} in Server Settings > Roles`, 
                        flags: [64] 
                    });
                }

                // Check if role is managed
                if (role.managed) {
                    return interaction.reply({ 
                        content: `❌ ${role} is managed by an integration and cannot be assigned!`, 
                        flags: [64] 
                    });
                }

                // Save config
                client.autoroleConfig.set(guild.id, {
                    roleId: role.id,
                    enabled: true
                });

                const embed = new EmbedBuilder()
                    .setColor(0x57F287)
                    .setTitle('✅ Auto-Role Configured!')
                    .setDescription(`New members will now receive ${role}`)
                    .addFields(
                        { name: '🎭 Role', value: `${role}`, inline: true },
                        { name: '🆔 Role ID', value: `\`${role.id}\``, inline: true },
                        { name: '📊 Position', value: `${role.position}`, inline: true }
                    )
                    .setFooter({ text: 'Use /autorole test to verify it works' })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
                break;

            case 'disable':
                const config = client.autoroleConfig.get(guild.id);
                if (!config || !config.enabled) {
                    return interaction.reply({ 
                        content: '❌ Auto-role is already disabled!', 
                        flags: [64] 
                    });
                }

                config.enabled = false;
                client.autoroleConfig.set(guild.id, config);

                await interaction.reply({ 
                    content: '✅ Auto-role has been disabled!', 
                    ephemeral: true 
                });
                break;

            case 'test':
                const testConfig = client.autoroleConfig.get(guild.id);
                if (!testConfig || !testConfig.enabled) {
                    return interaction.reply({ 
                        content: '❌ Auto-role is not configured! Use `/autorole set` first.', 
                        flags: [64] 
                    });
                }

                const testRole = guild.roles.cache.get(testConfig.roleId);
                if (!testRole) {
                    return interaction.reply({ 
                        content: '❌ Configured role no longer exists! Reconfigure with `/autorole set`.', 
                        flags: [64] 
                    });
                }

                try {
                    // Test by adding then removing
                    await interaction.member.roles.add(testRole);
                    
                    await interaction.reply({ 
                        content: `✅ Auto-role test successful! I can assign ${testRole}.\n\nRemoving it now...`, 
                        flags: [64] 
                    });

                    setTimeout(async () => {
                        await interaction.member.roles.remove(testRole).catch(() => {});
                    }, 3000);

                } catch (error) {
                    let errorMsg = '❌ Auto-role test failed!\n\n';
                    
                    if (error.code === 50013) {
                        errorMsg += '**Error:** Missing permissions\n**Solution:** Move my role above the auto-role in Server Settings > Roles';
                    } else {
                        errorMsg += `**Error:** ${error.message}`;
                    }

                    await interaction.reply({ content: errorMsg, flags: [64] });
                }
                break;

            case 'view':
                const viewConfig = client.autoroleConfig.get(guild.id);
                if (!viewConfig) {
                    return interaction.reply({ 
                        content: '❌ Auto-role is not configured!', 
                        flags: [64] 
                    });
                }

                const viewRole = guild.roles.cache.get(viewConfig.roleId);
                const status = viewConfig.enabled ? '✅ Enabled' : '❌ Disabled';

                const viewEmbed = new EmbedBuilder()
                    .setColor(viewConfig.enabled ? 0x57F287 : 0xFF0000)
                    .setTitle('⚙️ Auto-Role Configuration')
                    .addFields(
                        { name: 'Status', value: status, inline: true },
                        { name: 'Role', value: viewRole ? `${viewRole}` : 'Role deleted', inline: true },
                        { name: 'Role ID', value: `\`${viewConfig.roleId}\``, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [viewEmbed] });
                break;
        }
    }
};

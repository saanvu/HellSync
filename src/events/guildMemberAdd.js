const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        console.log(`\n🔔 Member joined: ${member.user.tag} (${member.id}) in ${member.guild.name}`);

        // ========== AUTO-ROLE (WITH DEBUGGING) ==========
        await handleAutoRole(member, client);

        // ========== INVITE TRACKING ==========
        await trackInvite(member, client);

        // ========== JOIN LOGGING ==========
        await logMemberJoin(member, client);
    }
};

// ========== AUTO-ROLE FUNCTION ==========
async function handleAutoRole(member, client) {
    try {
        const config = client.autoroleConfig?.get(member.guild.id);
        
        console.log(`🔍 Auto-role config for ${member.guild.name}:`, config ? 'Found' : 'Not found');
        
        if (!config || !config.enabled) {
            console.log(`⚠️ Auto-role disabled or not configured for ${member.guild.name}`);
            return;
        }

        const role = member.guild.roles.cache.get(config.roleId);
        
        if (!role) {
            console.log(`❌ Role ID ${config.roleId} not found in ${member.guild.name}`);
            return;
        }

        console.log(`✅ Role found: ${role.name} (ID: ${role.id})`);

        // Check bot permissions
        const botMember = member.guild.members.me;
        if (!botMember.permissions.has('ManageRoles')) {
            console.log(`❌ Bot missing "Manage Roles" permission in ${member.guild.name}`);
            return;
        }

        // Check role hierarchy
        const botHighestRole = botMember.roles.highest;
        console.log(`📊 Bot highest role: ${botHighestRole.name} (Position: ${botHighestRole.position})`);
        console.log(`📊 Target role: ${role.name} (Position: ${role.position})`);

        if (role.position >= botHighestRole.position) {
            console.log(`❌ Role "${role.name}" is higher or equal to bot's highest role!`);
            console.log(`💡 Solution: Move bot's role above "${role.name}" in Server Settings > Roles`);
            return;
        }

        // Check if role is managed (bot roles can't be assigned)
        if (role.managed) {
            console.log(`❌ Role "${role.name}" is managed by an integration and cannot be assigned`);
            return;
        }

        // Assign role
        console.log(`🔄 Attempting to assign "${role.name}" to ${member.user.tag}...`);
        
        await member.roles.add(role, 'Auto-role on join');
        
        console.log(`✅ Successfully assigned "${role.name}" to ${member.user.tag}`);

    } catch (error) {
        console.error(`❌ Auto-role error for ${member.user.tag}:`, error.message);
        
        if (error.code === 50013) {
            console.log(`💡 Error 50013: Missing permissions. Check role hierarchy!`);
        } else if (error.code === 10011) {
            console.log(`💡 Error 10011: Role doesn't exist. Reconfigure auto-role!`);
        }
    }
}

// ========== INVITE TRACKING FUNCTION ==========
async function trackInvite(member, client) {
    if (!client.guildInvites) client.guildInvites = new Map();
    if (!client.inviteData) client.inviteData = new Map();

    const guildId = member.guild.id;
    
    try {
        // Initialize cache if missing
        if (!client.guildInvites.has(guildId)) {
            const invites = await member.guild.invites.fetch().catch(() => new Map());
            const inviteMap = new Map();
            invites.forEach(inv => inviteMap.set(inv.code, inv.uses || 0));
            client.guildInvites.set(guildId, inviteMap);
            console.log(`📋 Initialized invite cache for ${member.guild.name}`);
        }

        // Fetch current invites
        const currentInvites = await member.guild.invites.fetch().catch(() => new Map());
        const cachedInvites = client.guildInvites.get(guildId);

        // Find used invite
        let usedInvite = null;
        let inviteCode = null;
        let inviter = null;
        let uses = 0;

        currentInvites.forEach((inv, code) => {
            const cachedUses = cachedInvites.get(code) || 0;
            if (inv.uses > cachedUses) {
                usedInvite = inv;
                inviteCode = code;
                inviter = inv.inviter;
                uses = inv.uses;
            }
        });

        // Handle vanity URL
        if (!usedInvite && member.guild.vanityURLCode) {
            inviteCode = member.guild.vanityURLCode;
            inviter = { id: 'vanity', tag: 'Vanity URL' };
        }

        // Fallback
        if (!inviteCode) {
            inviteCode = 'Unknown';
            inviter = { id: 'unknown', tag: 'Unknown' };
        }

        // Store data
        if (!client.inviteData.has(guildId)) {
            client.inviteData.set(guildId, new Map());
        }
        client.inviteData.get(guildId).set(member.id, {
            code: inviteCode,
            inviter: inviter.tag || inviter,
            uses,
            timestamp: Date.now()
        });

        // Update cache
        const newCache = new Map();
        currentInvites.forEach(inv => newCache.set(inv.code, inv.uses || 0));
        client.guildInvites.set(guildId, newCache);

        console.log(`📨 ${member.user.tag} joined via ${inviteCode} by ${inviter.tag || inviter}`);

    } catch (error) {
        console.error('Invite tracking error:', error);
    }
}

// ========== JOIN LOGGING FUNCTION ==========
async function logMemberJoin(member, client) {
    try {
        const config = client.loggingConfig?.get(member.guild.id);
        if (!config?.enabledLogs?.memberJoin || !config.joinLogChannel) return;

        const logChannel = member.guild.channels.cache.get(config.joinLogChannel);
        if (!logChannel) return;

        const inviteInfo = client.inviteData?.get(member.guild.id)?.get(member.id);
        const inviteText = inviteInfo ? 
            `${inviteInfo.inviter} (\`${inviteInfo.code}\`)` : 
            'Unknown';

        const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));
        const suspicious = accountAge < 7 ? '⚠️ New Account' : '';

        const embed = new EmbedBuilder()
            .setColor(accountAge < 7 ? 0xFF6B6B : 0x57F287)
            .setAuthor({ 
                name: '👋 Member Joined', 
                iconURL: member.user.displayAvatarURL() 
            })
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: '👤 User', value: `${member}`, inline: true },
                { name: '🆔 ID', value: `\`${member.id}\``, inline: true },
                { name: '📅 Account Age', value: `${accountAge} days ${suspicious}`, inline: true },
                { name: '📅 Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '🔗 Invite', value: inviteText, inline: true },
                { name: '📊 Members', value: `${member.guild.memberCount}`, inline: true }
            )
            .setFooter({ text: `Member #${member.guild.memberCount}` })
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });

    } catch (error) {
        console.error('Join logging error:', error);
    }
}

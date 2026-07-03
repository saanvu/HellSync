const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');

const PAGE_SIZE = 25;
const COLLECTOR_TIME = 120_000;

function canUseCommand(member) {
  return (
    member.permissions.has(PermissionFlagsBits.ManageRoles) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

function getRoleBlockReason(role, interaction, botMember) {
  if (!role) return 'unknown';
  if (role.id === interaction.guild.id) return '@everyone';
  if (role.managed) return 'managed';
  if (role.permissions.has(PermissionFlagsBits.Administrator)) return 'administrator';
  if (role.position >= botMember.roles.highest.position) return 'above_bot';
  if (
    interaction.guild.ownerId !== interaction.user.id &&
    role.position >= interaction.member.roles.highest.position
  ) {
    return 'above_user';
  }

  return null;
}

function isRoleSafeToDelete(role, interaction, botMember) {
  return getRoleBlockReason(role, interaction, botMember) === null;
}

function getSafeRoles(interaction, query = '') {
  const botMember = interaction.guild.members.me;
  const normalizedQuery = query.trim().toLowerCase();

  return interaction.guild.roles.cache
    .filter((role) => isRoleSafeToDelete(role, interaction, botMember))
    .filter((role) => !normalizedQuery || role.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => b.position - a.position)
    .map((role) => role);
}

function buildNoRolesMessage(interaction, query = '') {
  const botMember = interaction.guild.members.me;
  const normalizedQuery = query.trim().toLowerCase();
  const matchingRoles = interaction.guild.roles.cache
    .filter((role) => !normalizedQuery || role.name.toLowerCase().includes(normalizedQuery));

  const counts = {
    '@everyone': 0,
    managed: 0,
    administrator: 0,
    above_bot: 0,
    above_user: 0,
    unknown: 0,
  };

  for (const role of matchingRoles.values()) {
    const reason = getRoleBlockReason(role, interaction, botMember);
    if (reason) counts[reason] = (counts[reason] || 0) + 1;
  }

  const reasonLines = [
    counts['@everyone'] ? `${counts['@everyone']} @everyone role` : null,
    counts.managed ? `${counts.managed} managed/integration role(s)` : null,
    counts.administrator ? `${counts.administrator} administrator role(s)` : null,
    counts.above_bot ? `${counts.above_bot} role(s) above or equal to my highest role` : null,
    counts.above_user ? `${counts.above_user} role(s) above or equal to your highest role` : null,
  ].filter(Boolean);

  const lines = [
    query
      ? `No deletable roles matched "${query}".`
      : 'There are no roles I can safely delete.',
    '',
    `Matched roles checked: ${matchingRoles.size}`,
    reasonLines.length ? `Skipped because: ${reasonLines.join(', ')}.` : null,
    counts.above_bot
      ? 'Move my bot role above the roles you want me to delete, then try again.'
      : null,
  ].filter(Boolean);

  return lines.join('\n').slice(0, 2000);
}

function buildEmbed(interaction, roles, selectedRoleIds, page, query) {
  const totalPages = Math.max(Math.ceil(roles.length / PAGE_SIZE), 1);
  const selectedCount = selectedRoleIds.size;

  return new EmbedBuilder()
    .setColor(0xfade13)
    .setTitle('Delete Roles')
    .setDescription(
      [
        'Select roles from the dropdown, move between pages if needed, then press Delete Selected.',
        '',
        `Page: ${page + 1}/${totalPages}`,
        `Matching roles: ${roles.length}`,
        `Selected roles: ${selectedCount}`,
        query ? `Filter: ${query}` : null,
      ].filter(Boolean).join('\n')
    )
    .setFooter({ text: `Requested by ${interaction.user.tag}` })
    .setTimestamp();
}

function buildComponents(interaction, roles, selectedRoleIds, page, disabled = false) {
  const totalPages = Math.max(Math.ceil(roles.length / PAGE_SIZE), 1);
  const pageRoles = roles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const customIdBase = `delete_roles:${interaction.user.id}`;

  const roleSelect = new StringSelectMenuBuilder()
    .setCustomId(`${customIdBase}:select`)
    .setPlaceholder(pageRoles.length ? 'Select roles to delete on this page' : 'No roles available')
    .setMinValues(0)
    .setMaxValues(Math.max(pageRoles.length, 1))
    .setDisabled(disabled || pageRoles.length === 0)
    .addOptions(
      pageRoles.length
        ? pageRoles.map((role) => ({
            label: role.name.slice(0, 100),
            value: role.id,
            description: `Members: ${role.members.size} | Position: ${role.position}`.slice(0, 100),
            default: selectedRoleIds.has(role.id),
          }))
        : [{ label: 'No roles found', value: 'none', description: 'Try a different filter' }]
    );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${customIdBase}:prev`)
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || page === 0),
    new ButtonBuilder()
      .setCustomId(`${customIdBase}:next`)
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || page >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(`${customIdBase}:delete`)
      .setLabel('Delete Selected')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled || selectedRoleIds.size === 0),
    new ButtonBuilder()
      .setCustomId(`${customIdBase}:cancel`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  );

  return [new ActionRowBuilder().addComponents(roleSelect), buttons];
}

function getCurrentPageRoleIds(roles, page) {
  return new Set(roles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((role) => role.id));
}

module.exports = {
  category: 'Moderation',
  name: 'deleteroles',
  description: 'Delete multiple safe server roles with a dropdown',
  slashOnly: false,

  data: new SlashCommandBuilder()
    .setName('deleteroles')
    .setDescription('Delete multiple safe server roles with a dropdown')
    .addStringOption((option) =>
      option
        .setName('filter')
        .setDescription('Only show roles whose names include this text')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false),

  async executePrefix(message) {
    if (!canUseCommand(message.member)) {
      return message.reply('You need Manage Roles or Administrator permission to use this command.');
    }

    return message.reply('Use `/deleteroles` for the interactive role deletion menu.');
  },

  async executeSlash(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!canUseCommand(interaction.member)) {
      return interaction.reply({
        content: 'You need Manage Roles or Administrator permission to use this command.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.guild.roles.fetch().catch(() => {});
    const botMember = await interaction.guild.members.fetchMe().catch(() => interaction.guild.members.me);

    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        content: 'I need Manage Roles permission before I can delete roles.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const query = interaction.options.getString('filter') || '';
    const roles = getSafeRoles(interaction, query);

    if (!roles.length) {
      return interaction.reply({
        content: buildNoRolesMessage(interaction, query),
        flags: MessageFlags.Ephemeral,
      });
    }

    let page = 0;
    const selectedRoleIds = new Set();

    await interaction.reply({
      embeds: [buildEmbed(interaction, roles, selectedRoleIds, page, query)],
      components: buildComponents(interaction, roles, selectedRoleIds, page),
      flags: MessageFlags.Ephemeral,
    });

    const message = await interaction.fetchReply();
    const customIdBase = `delete_roles:${interaction.user.id}`;
    const collector = message.createMessageComponentCollector({
      time: COLLECTOR_TIME,
      filter: (i) => i.user.id === interaction.user.id && i.customId.startsWith(customIdBase),
    });

    collector.on('collect', async (i) => {
      try {
        if (i.isStringSelectMenu()) {
          const pageRoleIds = getCurrentPageRoleIds(roles, page);
          const pageSelectedIds = new Set(i.values);

          for (const roleId of pageRoleIds) {
            if (pageSelectedIds.has(roleId)) {
              selectedRoleIds.add(roleId);
            } else {
              selectedRoleIds.delete(roleId);
            }
          }

          return i.update({
            embeds: [buildEmbed(interaction, roles, selectedRoleIds, page, query)],
            components: buildComponents(interaction, roles, selectedRoleIds, page),
          });
        }

        if (!i.isButton()) return;

        if (i.customId.endsWith(':prev')) {
          page = Math.max(page - 1, 0);
          return i.update({
            embeds: [buildEmbed(interaction, roles, selectedRoleIds, page, query)],
            components: buildComponents(interaction, roles, selectedRoleIds, page),
          });
        }

        if (i.customId.endsWith(':next')) {
          page = Math.min(page + 1, Math.ceil(roles.length / PAGE_SIZE) - 1);
          return i.update({
            embeds: [buildEmbed(interaction, roles, selectedRoleIds, page, query)],
            components: buildComponents(interaction, roles, selectedRoleIds, page),
          });
        }

        if (i.customId.endsWith(':cancel')) {
          collector.stop('cancelled');
          return i.update({
            content: 'Role deletion cancelled.',
            embeds: [],
            components: [],
          });
        }

        if (i.customId.endsWith(':delete')) {
          if (!selectedRoleIds.size) {
            return i.reply({
              content: 'Select at least one role first.',
              flags: MessageFlags.Ephemeral,
            });
          }

          await i.deferUpdate();

          const deleted = [];
          const skipped = [];

          for (const roleId of selectedRoleIds) {
            const role = interaction.guild.roles.cache.get(roleId);

            if (!isRoleSafeToDelete(role, interaction, botMember)) {
              skipped.push(role?.name || roleId);
              continue;
            }

            try {
              await role.delete(`Deleted by ${interaction.user.tag} using /deleteroles`);
              deleted.push(role.name);
            } catch (error) {
              console.error(`Delete role error (${role.name}):`, error);
              skipped.push(role.name);
            }
          }

          collector.stop('deleted');

          const lines = [
            deleted.length ? `Deleted ${deleted.length} role(s): ${deleted.join(', ')}` : 'No roles were deleted.',
            skipped.length ? `Skipped ${skipped.length} role(s): ${skipped.join(', ')}` : null,
          ].filter(Boolean);

          return interaction.editReply({
            content: lines.join('\n').slice(0, 2000),
            embeds: [],
            components: [],
          });
        }
      } catch (error) {
        console.error('Delete roles interaction error:', error);

        const payload = {
          content: 'There was an error processing the role deletion menu.',
          flags: MessageFlags.Ephemeral,
        };

        if (i.deferred || i.replied) {
          await i.followUp(payload).catch(() => {});
        } else {
          await i.reply(payload).catch(() => {});
        }
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'deleted' || reason === 'cancelled') return;

      await interaction.editReply({
        embeds: [buildEmbed(interaction, roles, selectedRoleIds, page, query)],
        components: buildComponents(interaction, roles, selectedRoleIds, page, true),
      }).catch(() => {});
    });
  },
};

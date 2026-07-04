const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');

const COLLECTOR_TIME = 120_000;

const SELECTABLE_CHANNEL_TYPES = [
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.GuildVoice,
  ChannelType.GuildStageVoice,
  ChannelType.GuildForum,
  ChannelType.GuildMedia,
  ChannelType.GuildCategory,
];

function canUseCommand(member) {
  return (
    member.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

function getTargetChannels(guild, selectedChannelIds, includeChildren) {
  const channels = new Map();

  for (const channelId of selectedChannelIds) {
    const channel = guild.channels.cache.get(channelId);
    if (!channel) continue;

    channels.set(channel.id, channel);

    if (includeChildren && channel.type === ChannelType.GuildCategory) {
      guild.channels.cache
        .filter((child) => child.parentId === channel.id)
        .forEach((child) => channels.set(child.id, child));
    }
  }

  return [...channels.values()];
}

function buildEmbed(interaction, role, selectedChannelIds, includeChildren) {
  const selectedCount = selectedChannelIds.size;

  return new EmbedBuilder()
    .setColor(0xfade13)
    .setTitle('Make Channels Public For Role')
    .setDescription(
      [
        `Role: ${role}`,
        `Selected channels/categories: ${selectedCount}`,
        `Include category children: ${includeChildren ? 'Yes' : 'No'}`,
        '',
        'This grants View Channel to the selected role. It does not grant Send Messages, Connect, or admin permissions.',
      ].join('\n')
    )
    .setFooter({ text: `Requested by ${interaction.user.tag}` })
    .setTimestamp();
}

function buildComponents(interaction, selectedChannelIds, disabled = false) {
  const customIdBase = `public_role:${interaction.user.id}`;

  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId(`${customIdBase}:channels`)
    .setPlaceholder('Select channels and categories')
    .setMinValues(1)
    .setMaxValues(25)
    .setChannelTypes(...SELECTABLE_CHANNEL_TYPES)
    .setDisabled(disabled);

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${customIdBase}:apply`)
      .setLabel('Apply')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled || selectedChannelIds.size === 0),
    new ButtonBuilder()
      .setCustomId(`${customIdBase}:cancel`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  );

  return [new ActionRowBuilder().addComponents(channelSelect), buttons];
}

module.exports = {
  category: 'Moderation',
  name: 'publicrole',
  description: 'Make selected channels or categories visible to a role',
  slashOnly: false,

  data: new SlashCommandBuilder()
    .setName('publicrole')
    .setDescription('Make selected channels or categories visible to a role')
    .addRoleOption((option) =>
      option
        .setName('role')
        .setDescription('The role that should be able to see the selected channels')
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('include_children')
        .setDescription('Also apply category selections to channels inside them')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async executePrefix(message) {
    if (!canUseCommand(message.member)) {
      return message.reply('You need Manage Channels or Administrator permission to use this command.');
    }

    return message.reply('Use `/publicrole` for the interactive role/channel selection menu.');
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
        content: 'You need Manage Channels or Administrator permission to use this command.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const botMember = await interaction.guild.members.fetchMe().catch(() => interaction.guild.members.me);
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: 'I need Manage Channels permission before I can edit channel permissions.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.guild.channels.fetch().catch(() => {});

    const role = interaction.options.getRole('role');
    const includeChildren = interaction.options.getBoolean('include_children') ?? true;
    const selectedChannelIds = new Set();

    await interaction.reply({
      embeds: [buildEmbed(interaction, role, selectedChannelIds, includeChildren)],
      components: buildComponents(interaction, selectedChannelIds),
      flags: MessageFlags.Ephemeral,
    });

    const message = await interaction.fetchReply();
    const customIdBase = `public_role:${interaction.user.id}`;
    const collector = message.createMessageComponentCollector({
      time: COLLECTOR_TIME,
      filter: (i) => i.user.id === interaction.user.id && i.customId.startsWith(customIdBase),
    });

    collector.on('collect', async (i) => {
      try {
        if (i.isChannelSelectMenu()) {
          selectedChannelIds.clear();
          for (const channelId of i.values) selectedChannelIds.add(channelId);

          return i.update({
            embeds: [buildEmbed(interaction, role, selectedChannelIds, includeChildren)],
            components: buildComponents(interaction, selectedChannelIds),
          });
        }

        if (!i.isButton()) return;

        if (i.customId.endsWith(':cancel')) {
          collector.stop('cancelled');
          return i.update({
            content: 'Public role update cancelled.',
            embeds: [],
            components: [],
          });
        }

        if (i.customId.endsWith(':apply')) {
          if (!selectedChannelIds.size) {
            return i.reply({
              content: 'Select at least one channel or category first.',
              flags: MessageFlags.Ephemeral,
            });
          }

          await i.deferUpdate();

          const targets = getTargetChannels(interaction.guild, selectedChannelIds, includeChildren);
          const updated = [];
          const failed = [];

          for (const channel of targets) {
            try {
              await channel.permissionOverwrites.edit(
                role,
                { ViewChannel: true },
                { reason: `Made public for ${role.name} by ${interaction.user.tag} using /publicrole` }
              );
              updated.push(channel.name);
            } catch (error) {
              console.error(`Public role update error (${channel.name}):`, error);
              failed.push(channel.name);
            }
          }

          collector.stop('applied');

          const lines = [
            updated.length
              ? `Updated ${updated.length} channel/category permission overwrite(s): ${updated.join(', ')}`
              : 'No channels were updated.',
            failed.length ? `Failed ${failed.length}: ${failed.join(', ')}` : null,
          ].filter(Boolean);

          return interaction.editReply({
            content: lines.join('\n').slice(0, 2000),
            embeds: [],
            components: [],
          });
        }
      } catch (error) {
        console.error('Public role interaction error:', error);

        const payload = {
          content: 'There was an error processing the public role menu.',
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
      if (reason === 'applied' || reason === 'cancelled') return;

      await interaction.editReply({
        embeds: [buildEmbed(interaction, role, selectedChannelIds, includeChildren)],
        components: buildComponents(interaction, selectedChannelIds, true),
      }).catch(() => {});
    });
  },
};

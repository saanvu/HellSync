const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

module.exports = {
  category: 'Moderation',
  name: 'embed',
  description: 'Create beautiful embedded messages (Dyno-style)',
  slashOnly: false,
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create beautiful embedded messages')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a custom embed with modal editor')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel to send the embed to')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('json')
        .setDescription('Create embed from JSON code')
        .addStringOption(option =>
          option.setName('code')
            .setDescription('JSON embed code')
            .setRequired(true))
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel to send to')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('rules')
        .setDescription('Send professional server rules embed'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('preset')
        .setDescription('Quick preset templates')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('Preset template')
            .setRequired(true)
            .addChoices(
              { name: 'ℹ️ Info', value: 'info' },
              { name: '👋 Welcome', value: 'welcome' },
              { name: '📢 Announce', value: 'announce' }
            )))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ **Manage Messages** permission required!', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    await handleSubcommand(interaction, subcommand, [], interaction.client, true);
  },

  async executePrefix(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply({ content: '❌ **Manage Messages** permission required!' });
    }

    const subcommand = args[0]?.toLowerCase() || 'create';
    await handleSubcommand(message, subcommand, args.slice(1), client, false);
  }
};

async function handleSubcommand(context, subcommand, args, client, isSlash) {
  switch (subcommand) {
    case 'create':
      await createEmbedModal(context, args, client, isSlash);
      break;
    case 'json':
      await createEmbedFromJSON(context, args, client, isSlash);
      break;
    case 'rules':
      await sendRulesPreset(context, client, isSlash);
      break;
    case 'preset':
      const presetType = isSlash ? context.options.getString('type') : args[0];
      await sendPreset(context, presetType, client, isSlash);
      break;
    default:
      await context.reply({
        content: `**Usage:**\n\`/embed create\` - Modal embed builder\n\`/embed json [code]\` - Create from JSON\n\`/embed rules\` - Server rules\n\`/embed preset [type]\` - Quick templates`,
        ephemeral: true
      });
  }
}

async function createEmbedModal(context, args, client, isSlash) {
  if (!isSlash) {
    return context.reply({ content: '❌ Use `/embed create` for the modal editor or `/embed json` for prefix commands!' });
  }

  try {
    const targetChannel = context.options.getChannel('channel') || context.channel;

    // Create modal for multiline input
    const modal = new ModalBuilder()
      .setCustomId('embed_modal')
      .setTitle('Embed Builder');

    const titleInput = new TextInputBuilder()
      .setCustomId('embed_title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder('⛏️ THE ABYSS NETWORK');

    const descInput = new TextInputBuilder()
      .setCustomId('embed_description')
      .setLabel('Description (use \\n for new lines)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setPlaceholder('Line 1\\nLine 2\\n\\n**Bold text**');

    const colorInput = new TextInputBuilder()
      .setCustomId('embed_color')
      .setLabel('Color (hex or name)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder('#5865F2 or blue');

    const fieldsInput = new TextInputBuilder()
      .setCustomId('embed_fields')
      .setLabel('Fields (name|value|inline, one per line)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setPlaceholder('Field Name|Field Value|true\nField 2|Value 2|false');

    const imagesInput = new TextInputBuilder()
      .setCustomId('embed_images')
      .setLabel('Images (thumbnail|image URLs, separated by |)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder('https://thumbnail.url|https://main-image.url');

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descInput),
      new ActionRowBuilder().addComponents(colorInput),
      new ActionRowBuilder().addComponents(fieldsInput),
      new ActionRowBuilder().addComponents(imagesInput)
    );

    await context.showModal(modal);

    // Store target channel for modal submit
    const filter = (i) => i.customId === 'embed_modal' && i.user.id === context.user.id;
    context.client.embedModalData = context.client.embedModalData || new Map();
    context.client.embedModalData.set(context.user.id, { channel: targetChannel });

  } catch (error) {
    console.error('Modal error:', error);
  }
}

async function createEmbedFromJSON(context, args, client, isSlash) {
  try {
    const targetChannel = isSlash
      ? context.options.getChannel('channel') || context.channel
      : context.mentions.channels.first() || context.channel;

    const jsonInput = isSlash ? context.options.getString('code') : args.join(' ');

    if (!jsonInput) {
      return context.reply({
        content: '❌ Please provide JSON code!\n\n**Example:**\n```json\n{\n  "title": "My Title",\n  "description": "My description",\n  "color": "#5865F2"\n}\n```',
        ephemeral: true
      });
    }

    let embedData;
    try {
      embedData = JSON.parse(jsonInput);
    } catch (e) {
      return context.reply({ content: '❌ Invalid JSON format!', ephemeral: true });
    }

    const embed = new EmbedBuilder();

    if (embedData.title) embed.setTitle(embedData.title);
    if (embedData.description) embed.setDescription(embedData.description);
    if (embedData.color) embed.setColor(parseColor(embedData.color));
    if (embedData.url) embed.setURL(embedData.url);
    if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);
    if (embedData.image) embed.setImage(embedData.image);
    if (embedData.timestamp) embed.setTimestamp();

    if (embedData.author) {
      embed.setAuthor({
        name: embedData.author.name,
        iconURL: embedData.author.icon_url,
        url: embedData.author.url
      });
    }

    if (embedData.footer) {
      embed.setFooter({
        text: embedData.footer.text,
        iconURL: embedData.footer.icon_url
      });
    }

    if (embedData.fields && Array.isArray(embedData.fields)) {
      embedData.fields.forEach(field => {
        embed.addFields({
          name: field.name,
          value: field.value,
          inline: field.inline ?? false
        });
      });
    }

    await sendEmbedWithPreview(context, embed, targetChannel, isSlash);

  } catch (error) {
    console.error('JSON embed error:', error);
    if (!context.replied) {
      await context.reply({ content: '❌ Failed to create embed!', ephemeral: true });
    }
  }
}

async function sendEmbedWithPreview(context, embed, targetChannel, isSlash) {
  if (isSlash) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('embed_send')
        .setLabel('✅ Send')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('embed_cancel')
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Danger)
    );

    const reply = await context.reply({
      content: `**📋 Embed Preview**\n**Target Channel:** ${targetChannel}\n\nClick **Send** to post or **Cancel** to discard.`,
      embeds: [embed],
      components: [row],
      ephemeral: true,
      fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({
      time: 60_000,
      filter: (i) => i.user.id === context.user.id
    });

    collector.on('collect', async (i) => {
      if (i.customId === 'embed_send') {
        await targetChannel.send({ embeds: [embed] });
        await i.update({
          content: `✅ **Embed sent to ${targetChannel}!**`,
          embeds: [],
          components: []
        });
        collector.stop('sent');
      } else if (i.customId === 'embed_cancel') {
        await i.update({
          content: '❌ Embed creation cancelled.',
          embeds: [],
          components: []
        });
        collector.stop('cancelled');
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        try {
          await context.editReply({
            content: '⏰ Embed creation timed out.',
            embeds: [],
            components: []
          });
        } catch (e) {}
      }
    });
  } else {
    await targetChannel.send({ embeds: [embed] });
    await context.reply({ content: `✅ Embed sent to ${targetChannel}!` });
  }
}

async function sendRulesPreset(context, client, isSlash) {
  try {
    const guild = context.guild;
    const embed = new EmbedBuilder()
      .setTitle('📜 Server Code of Conduct')
      .setDescription(`By participating in this server, you agree to comply with the guidelines outlined below. These rules exist to ensure a safe, respectful, and enjoyable environment for all members.`)
      .setColor('#ED4245')
      .addFields(
        { name: '🛑 1. Appropriate Content', value: 'All content shared within the server must remain suitable for a general audience. Explicit, suggestive, or adult material is strictly prohibited.', inline: false },
        { name: '🤝 2. Mutual Respect', value: 'Members must treat one another with professionalism and courtesy. Harassment, hate speech, or discrimination will not be tolerated.', inline: false },
        { name: '💬 3. Responsible Communication', value: 'Spam, message flooding, or unsolicited advertisements are not permitted. Promotional content requires approval.', inline: false },
        { name: '⚠️ 4. Enforcement', value: 'Violations may result in warnings, restrictions, or permanent bans depending on severity.', inline: false }
      );

    await context.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Rules error:', error);
  }
}

async function sendPreset(context, presetType, client, isSlash) {
  try {
    const guild = context.guild;
    const presets = {
      info: {
        title: 'ℹ️ Server Information',
        description: `**Server Name:** ${guild.name}\n**Members:** ${guild.memberCount}\n**Channels:** ${guild.channels.cache.size}\n**Roles:** ${guild.roles.cache.size - 1}`,
        color: '#5865F2'
      },
      welcome: {
        title: `👋 Welcome to ${guild.name}!`,
        description: `We're glad to have you here!\n\nMake sure to read the rules and introduce yourself.\n\nEnjoy your stay!`,
        color: '#57F287'
      },
      announce: {
        title: '📢 Announcement',
        description: 'Important server announcement!\n\nStay tuned for updates.',
        color: '#FEE75C'
      }
    };

    const preset = presets[presetType];
    if (!preset) return;

    const embed = new EmbedBuilder()
      .setTitle(preset.title)
      .setDescription(preset.description)
      .setColor(preset.color);

    await context.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Preset error:', error);
  }
}

function parseColor(colorInput) {
  if (!colorInput) return '#5865F2';
  if (colorInput.match(/^#?[0-9a-fA-F]{6}$/)) {
    return colorInput.startsWith('#') ? colorInput : `#${colorInput}`;
  }
  const colors = {
    red: '#ED4245',
    blue: '#5865F2',
    green: '#57F287',
    yellow: '#FEE75C',
    purple: '#5865F2',
    orange: '#F26522',
    blurple: '#5865F2'
  };
  return colors[colorInput.toLowerCase()] || '#5865F2';
}

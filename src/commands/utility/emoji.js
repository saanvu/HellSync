const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  category: 'Utility',
  name: 'emoji',
  description: 'Copy/steal emoji(s) from another server',
  slashOnly: false,
  data: new SlashCommandBuilder()
    .setName('emoji')
    .setDescription('Copy/steal emoji(s) from another server')
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('The emoji(s) to copy (paste one or more separated by space)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Custom name for the emoji (only works with single emoji)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),

  async executePrefix(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
      return message.reply({ content: '❌ You need **Manage Emojis** permission to use this command!', flags: [64] });
    }

    if (!args.length) {
      return message.reply({ content: '❌ Please provide emoji(s) to copy!', flags: [64] });
    }

    const emojiRegex = /<(a)?:(\w+):(\d+)>/g;
    const matches = args.join(' ').matchAll(emojiRegex);
    const emojis = [...matches];

    if (!emojis.length) {
      return message.reply({ content: '❌ Please provide valid custom emojis! (Not default Unicode emojis)', flags: [64] });
    }

    const results = [];

    for (const match of emojis) {
      const animated = match[1] === 'a';
      const defaultName = match[2];
      const id = match[3];
      const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}`;

      try {
        const created = await message.guild.emojis.create({
          attachment: url,
          name: defaultName
        });

        results.push(`✅ ${created} \`${created.name}\` (ID: ${created.id})`);
      } catch (error) {
        if (error.code === 30008) {
          results.push('❌ Maximum number of emojis reached for this server!');
          break;
        } else if (error.code === 50035) {
          results.push(`❌ Invalid name for \`:${defaultName}:\``);
        } else {
          results.push(`❌ Failed \`:${defaultName}:\` - ${error.message}`);
        }
      }
    }

    const embed = new EmbedBuilder()
      .setColor(results.some(r => r.startsWith('✅')) ? 0x57F287 : 0xED4245)
      .setTitle('🎭 Emoji Import Results')
      .setDescription(results.join('\n'))
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ size: 64 }) })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
      return interaction.reply({ content: '❌ You need **Manage Emojis** permission to use this command!', flags: [64] });
    }

    const emojiInput = interaction.options.getString('emoji');
    const customName = interaction.options.getString('name');

    const emojiRegex = /<(a)?:(\w+):(\d+)>/g;
    const matches = emojiInput.matchAll(emojiRegex);
    const emojis = [...matches];

    if (!emojis.length) {
      return interaction.reply({
        content: '❌ Please provide valid custom emojis! (Not default Unicode emojis)',
        flags: [64]
      });
    }

    const results = [];

    for (const match of emojis) {
      const animated = match[1] === 'a';
      const defaultName = match[2];
      const id = match[3];
      const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}`;

      // Use custom name only if there's exactly one emoji
      const emojiName = (emojis.length === 1 && customName) ? customName : defaultName;

      try {
        const created = await interaction.guild.emojis.create({
          attachment: url,
          name: emojiName
        });

        results.push(`✅ ${created} \`${created.name}\` (ID: ${created.id})`);
      } catch (error) {
        if (error.code === 30008) {
          results.push('❌ Maximum number of emojis reached for this server!');
          break;
        } else if (error.code === 50035) {
          results.push(`❌ Invalid name for \`:${emojiName}:\``);
        } else {
          results.push(`❌ Failed \`:${emojiName}:\` - ${error.message}`);
        }
      }
    }

    const embed = new EmbedBuilder()
      .setColor(results.some(r => r.startsWith('✅')) ? 0x57F287 : 0xED4245)
      .setTitle('🎭 Emoji Import Results')
      .setDescription(results.join('\n'))
      .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ size: 64 }) })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};

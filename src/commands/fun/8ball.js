const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Fun',
  name: '8ball',
  description: 'Ask the magic 8-ball a question',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball a question')
    .addStringOption(option => 
      option.setName('question')
        .setDescription('Your question for the 8-ball')
        .setRequired(true)),

  async executePrefix(message, args, client) {
    const question = args.join(' ');
    if (!question) {
      return message.reply({ content: 'Please ask a question!', flags: [64] });
    }

    const responses = [
      'It is certain.',
      'It is decidedly so.',
      'Without a doubt.',
      'Yes - definitely.',
      'You may rely on it.',
      'As I see it, yes.',
      'Most likely.',
      'Outlook good.',
      'Yes.',
      'Signs point to yes.',
      'Reply hazy, try again.',
      'Ask again later.',
      'Better not tell you now.',
      'Cannot predict now.',
      'Concentrate and ask again.',
      'Don\'t count on it.',
      'My reply is no.',
      'My sources say no.',
      'Outlook not so good.',
      'Very doubtful.'
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    const embed = {
      color: 0x9B59B6,
      title: '🎱 Magic 8-Ball',
      description: `**Question:** ${question}\n\n**Answer:** ${response}`,
      timestamp: new Date().toISOString()
    };

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    const question = interaction.options.getString('question');

    const responses = [
      'It is certain.',
      'It is decidedly so.',
      'Without a doubt.',
      'Yes - definitely.',
      'You may rely on it.',
      'As I see it, yes.',
      'Most likely.',
      'Outlook good.',
      'Yes.',
      'Signs point to yes.',
      'Reply hazy, try again.',
      'Ask again later.',
      'Better not tell you now.',
      'Cannot predict now.',
      'Concentrate and ask again.',
      'Don\'t count on it.',
      'My reply is no.',
      'My sources say no.',
      'Outlook not so good.',
      'Very doubtful.'
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    const embed = {
      color: 0x9B59B6,
      title: '🎱 Magic 8-Ball',
      description: `**Question:** ${question}\n\n**Answer:** ${response}`,
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  }
};
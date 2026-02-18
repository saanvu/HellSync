const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Fun',
  name: 'roll',
  description: 'Roll a dice with specified sides',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a dice with specified sides')
    .addIntegerOption(option => 
      option.setName('sides')
        .setDescription('Number of sides on the dice')
        .setRequired(false)
        .setMinValue(2)
        .setMaxValue(1000)),

  async executePrefix(message, args, client) {
    const sides = parseInt(args[0]) || 6;
    
    if (sides < 2 || sides > 1000) {
      return message.reply({ content: 'Please choose a number between 2 and 1000!', flags: [64] });
    }

    const roll = Math.floor(Math.random() * sides) + 1;

    const embed = {
      color: 0x2ECC71,
      title: '🎲 Dice Roll',
      description: `You rolled a **${sides}**-sided dice and got: **${roll}**`,
      timestamp: new Date().toISOString()
    };

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    const sides = interaction.options.getInteger('sides') || 6;

    const roll = Math.floor(Math.random() * sides) + 1;

    const embed = {
      color: 0x2ECC71,
      title: '🎲 Dice Roll',
      description: `You rolled a **${sides}**-sided dice and got: **${roll}**`,
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  }
};
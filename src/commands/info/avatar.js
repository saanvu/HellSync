const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Info',
  name: 'avatar',
  description: 'Get a user\'s avatar',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Get a user\'s avatar')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to get the avatar of')
        .setRequired(false)),

  async executePrefix(message, args, client) {
    const user = message.mentions.users.first() || message.author;
    
    const embed = {
      color: 0x00D26A,
      title: `${user.username}'s Avatar`,
      image: { 
        url: user.displayAvatarURL({ 
          dynamic: true, 
          size: 1024 
        }) 
      },
      footer: { 
        text: `Click the image to open in browser` 
      },
      timestamp: new Date().toISOString()
    };

    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    
    const embed = {
      color: 0x00D26A,
      title: `${user.username}'s Avatar`,
      image: { 
        url: user.displayAvatarURL({ 
          dynamic: true, 
          size: 1024 
        }) 
      },
      footer: { 
        text: `Click the image to open in browser` 
      },
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  }
};
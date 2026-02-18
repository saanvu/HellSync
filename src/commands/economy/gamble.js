const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'Economy',
  name: 'gamble',
  description: 'Gamble your money for a chance to win more',
  slashOnly: false,
  
  data: new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Gamble your money for a chance to win more')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Amount to gamble')
        .setRequired(true)
        .setMinValue(10)
        .setMaxValue(10000))
    .addStringOption(option => 
      option.setName('type')
        .setDescription('Type of gambling game')
        .addChoices(
          { name: '🎲 Dice Roll (50% chance)', value: 'dice' },
          { name: '🪙 Coin Flip (50% chance)', value: 'coin' },
          { name: '🎰 Slot Machine (30% chance)', value: 'slots' },
          { name: '🎯 Number Guess (10% chance, 5x win)', value: 'number' }
        ))
    .addIntegerOption(option => 
      option.setName('number')
        .setDescription('Your guess (1-10, for number game)')
        .setMinValue(1)
        .setMaxValue(10)),

  async executePrefix(message, args, client) {
    const User = require('../../models/User');
    
    if (!args[0]) {
      return message.reply({ 
        content: 'Usage: `!gamble <amount> [dice|coin|slots|number] [guess]`\nExample: `!gamble 100 dice`', 
        flags: [64] 
      });
    }

    const amount = parseInt(args[0]);
    const gameType = args[1]?.toLowerCase() || 'dice';
    const guess = parseInt(args[2]);

    try {
      let userData = await User.findOne({ userId: message.author.id });
      
      if (!userData || userData.balance < amount) {
        return message.reply({ 
          content: `You don't have enough money! You need $${amount} but only have $${userData?.balance || 0}.`,
          flags: [64]
        });
      }

      let result, winMultiplier, winChance, description;
      
      switch (gameType) {
        case 'dice':
          const dice = Math.floor(Math.random() * 6) + 1;
          winChance = 50;
          result = dice >= 4; // 4, 5, 6 wins
          winMultiplier = 2;
          description = `🎲 Dice rolled: **${dice}** (Need 4-6 to win)`;
          break;
          
        case 'coin':
          const coin = Math.random() < 0.5 ? 'heads' : 'tails';
          winChance = 50;
          result = coin === 'heads'; // Always bet on heads
          winMultiplier = 2;
          description = `🪙 Coin flipped: **${coin.toUpperCase()}**`;
          break;
          
        case 'slots':
          const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
          const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
          const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
          const slot3 = symbols[Math.floor(Math.random() * symbols.length)];
          winChance = 30;
          result = slot1 === slot2 && slot2 === slot3;
          winMultiplier = result ? (slot1 === '💎' ? 10 : (slot1 === '7️⃣' ? 20 : 5)) : 0;
          description = `🎰 | ${slot1} | ${slot2} | ${slot3} |`;
          break;
          
        case 'number':
          if (!guess || guess < 1 || guess > 10) {
            return message.reply({ content: 'For number guessing, provide a guess between 1-10!', flags: [64] });
          }
          const winningNumber = Math.floor(Math.random() * 10) + 1;
          winChance = 10;
          result = winningNumber === guess;
          winMultiplier = 5;
          description = `🎯 Your guess: **${guess}** | Winning number: **${winningNumber}**`;
          break;
          
        default:
          return message.reply({ content: 'Invalid game type! Use: dice, coin, slots, or number', flags: [64] });
      }

      userData.balance -= amount;
      
      let embed = {
        color: result ? 0x00D26A : 0xFF4444,
        title: result ? '🎉 You Won!' : '😔 You Lost!',
        description: description,
        fields: [
          { name: '💰 Bet Amount', value: `$${amount}`, inline: true },
          { name: `${result ? '💵' : '💸'} Result`, value: result ? `+$${amount * winMultiplier}` : `-$${amount}`, inline: true },
          { name: '📊 Balance', value: `$${userData.balance.toLocaleString()}`, inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      if (result) {
        userData.balance += amount * winMultiplier;
        embed.footer = { text: `🎊 ${gameType.charAt(0).toUpperCase() + gameType.slice(1)} Winner!` };
      } else {
        embed.footer = { text: `💔 Better luck next time! Win chance: ${winChance}%` };
      }

      await userData.save();
      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Gamble error:', error);
      await message.reply({ content: 'There was an error gambling!', flags: [64] });
    }
  },

  async executeSlash(interaction) {
    const User = require('../../models/User');
    
    const amount = interaction.options.getInteger('amount');
    const gameType = interaction.options.getString('type') || 'dice';
    const guess = interaction.options.getInteger('number');

    try {
      let userData = await User.findOne({ userId: interaction.user.id });
      
      if (!userData || userData.balance < amount) {
        return interaction.reply({ 
          content: `You don't have enough money! You need $${amount} but only have $${userData?.balance || 0}.`,
          flags: [64]
        });
      }

      let result, winMultiplier, winChance, description;
      
      switch (gameType) {
        case 'dice':
          const dice = Math.floor(Math.random() * 6) + 1;
          winChance = 50;
          result = dice >= 4;
          winMultiplier = 2;
          description = `🎲 Dice rolled: **${dice}** (Need 4-6 to win)`;
          break;
          
        case 'coin':
          const coin = Math.random() < 0.5 ? 'heads' : 'tails';
          winChance = 50;
          result = coin === 'heads';
          winMultiplier = 2;
          description = `🪙 Coin flipped: **${coin.toUpperCase()}**`;
          break;
          
        case 'slots':
          const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'];
          const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
          const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
          const slot3 = symbols[Math.floor(Math.random() * symbols.length)];
          winChance = 30;
          result = slot1 === slot2 && slot2 === slot3;
          winMultiplier = result ? (slot1 === '💎' ? 10 : (slot1 === '7️⃣' ? 20 : 5)) : 0;
          description = `🎰 | ${slot1} | ${slot2} | ${slot3} |`;
          break;
          
        case 'number':
          if (!guess) {
            return interaction.reply({ content: 'For number guessing, provide a guess between 1-10!', flags: [64] });
          }
          const winningNumber = Math.floor(Math.random() * 10) + 1;
          winChance = 10;
          result = winningNumber === guess;
          winMultiplier = 5;
          description = `🎯 Your guess: **${guess}** | Winning number: **${winningNumber}**`;
          break;
      }

      userData.balance -= amount;
      
      let embed = {
        color: result ? 0x00D26A : 0xFF4444,
        title: result ? '🎉 You Won!' : '😔 You Lost!',
        description: description,
        fields: [
          { name: '💰 Bet Amount', value: `$${amount}`, inline: true },
          { name: `${result ? '💵' : '💸'} Result`, value: result ? `+$${amount * winMultiplier}` : `-$${amount}`, inline: true },
          { name: '📊 Balance', value: `$${userData.balance.toLocaleString()}`, inline: true }
        ],
        timestamp: new Date().toISOString()
      };

      if (result) {
        userData.balance += amount * winMultiplier;
        embed.footer = { text: `🎊 ${gameType.charAt(0).toUpperCase() + gameType.slice(1)} Winner!` };
      } else {
        embed.footer = { text: `💔 Better luck next time! Win chance: ${winChance}%` };
      }

      await userData.save();
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Gamble error:', error);
      await interaction.reply({ content: 'There was an error gambling!', flags: [64] });
    }
  }
};
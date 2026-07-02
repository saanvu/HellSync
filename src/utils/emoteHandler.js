const { EmbedBuilder } = require('discord.js');

const msgs = {
  cry:   '**{u}** is crying 😭',
  grin:  '**{u}** grins 😁',
  pout:  '**{u}** is pouting 😤',
  blush: '**{u}** is blushing 😊',
  dance: '**{u}** is dancing 💃',
  shrug: '**{u}** shrugs 🤷',
};

module.exports = async (message, emote) => {
  try {
    const res = await fetch(`https://nekos.best/api/v2/${emote}`);
    const data = await res.json();
    const gif = data.results[0].url;

    await message.channel.send({
      embeds: [new EmbedBuilder()
        .setColor(0xA78BFA)
        .setDescription(msgs[emote].replace('{u}', message.author.username))
        .setImage(gif)
        .setFooter({ text: 'nekos.best' })
      ]
    });
  } catch {
    message.channel.send('❌ Could not fetch GIF — try again later.');
  }
};
const { EmbedBuilder } = require('discord.js');

const messages = {
    slap: ['**{u}** slaps the air 👋', '**{u}** slaps **{t}** 👋'],
    smug: ['**{u}** smirks smugly 😏', '**{u}** smugs **{t}** 😏'],
    kiss: ['**{u}** blows a kiss 💋', '**{u}** kisses **{t}** 💋'],
    boop: ['**{u}** boops the air 👆', '**{u}** boops **{t}\'s nose** 👆'],
    lick: ['**{u}** licks the air 👅', '**{u}** licks **{t}** 👅'],
    bite: ['**{u}** bites the void 🦷', '**{u}** bites **{t}** 🦷'],
    pat: ['**{u}** pats themselves 🫶', '**{u}** pats **{t}** 🫶'],
    hug: ['**{u}** hugs themselves 🤗', '**{u}** hugs **{t}** 🤗']
};

module.exports = async (message, action) => {
    try {
        const target = message.mentions.members?.first();
        const response = await fetch(`https://nekos.best/api/v2/${action}`);
        const data = await response.json();
        const gif = data.url;

        const msg = target 
            ? messages[action][1].replace('{u}', message.author).replace('{t}', target.user.username)
            : messages[action][0].replace('{u}', message.author.username);

        const embed = new EmbedBuilder()
            .setColor(0xFF69B4)
            .setDescription(msg)
            .setImage(gif)
            .setFooter({ text: 'Powered by nekos.best' });

        await message.channel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Action ${action} failed:`, error);
        await message.channel.send('❌ **Failed to fetch action GIF!** Try again later.');
    }
};
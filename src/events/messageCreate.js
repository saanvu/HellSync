const { PermissionFlagsBits } = require('discord.js');

// Track user messages for spam detection
const userMessages = new Map();
const userWarnings = new Map();

module.exports = {
    name: 'messageCreate',
    
    async execute(message, client) {
        if (message.author.bot) return;
        if (!message.guild) return;

        // ========== AUTOMOD CHECKS ==========
        await runAutomod(message, client);

        // ========== PREFIX COMMAND HANDLING ==========
        const config = client.config || require('../config');
        const prefix = config.prefix;

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);

        if (!command || command.slashOnly) return;

        try {
            await command.executePrefix(message, args, client);
        } catch (error) {
            console.error('Error executing prefix command:', error);
            await message.reply('There was an error while executing this command!');
        }
    }
};

// ========== AUTOMOD FUNCTION ==========
async function runAutomod(message, client) {
    // Get automod config
    const config = client.automodConfig?.get(message.guild.id);
    if (!config) return;

    // Check if channel is whitelisted
    if (config.whitelistedChannels.includes(message.channel.id)) return;

    // Check if user has whitelisted role
    const hasWhitelistedRole = message.member.roles.cache.some(role => 
        config.whitelistedRoles.includes(role.id)
    );
    if (hasWhitelistedRole) return;

    // Check if user has admin/mod permissions
    if (message.member.permissions.has(PermissionFlagsBits.Administrator) || 
        message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

    let violated = false;
    let reason = '';

    // ========== ANTI-SPAM DETECTION ==========
    if (config.antispam.enabled) {
        const userId = message.author.id;
        const now = Date.now();
        
        if (!userMessages.has(userId)) {
            userMessages.set(userId, []);
        }

        const messages = userMessages.get(userId);
        messages.push(now);

        // Remove old messages outside time window
        const recentMessages = messages.filter(timestamp => 
            now - timestamp < config.antispam.timeWindow
        );
        userMessages.set(userId, recentMessages);

        if (recentMessages.length >= config.antispam.messageLimit) {
            violated = true;
            reason = 'Spam detected';
            
            // Clear user messages
            userMessages.delete(userId);
            
            try {
                await message.member.timeout(60000, 'Automod: Spam detected');
                await message.channel.send({ content: `⚠️ ${message.author} has been timed out for spam!` })
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
            } catch (error) {
                console.error('Automod timeout error:', error);
            }
        }
    }

    // ========== BAD WORDS FILTER ==========
    if (config.badwords.enabled && config.badwords.words.length > 0 && !violated) {
        const content = message.content.toLowerCase();
        const foundBadWord = config.badwords.words.some(word => {
            const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            return regex.test(content);
        });

        if (foundBadWord) {
            violated = true;
            reason = 'Bad word detected';
            
            try {
                await message.delete();
                await message.channel.send({ content: `⚠️ ${message.author}, your message was deleted for containing prohibited words!` })
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
            } catch (error) {
                console.error('Automod delete error:', error);
            }
        }
    }

    // ========== ANTI-LINKS DETECTION ==========
    if (config.antilinks.enabled && !violated) {
        const linkRegex = /(https?:\/\/[^\s]+)|(discord\.gg\/[^\s]+)|(discord\.com\/invite\/[^\s]+)/gi;
        const hasLinks = linkRegex.test(message.content);

        if (hasLinks) {
            violated = true;
            reason = 'Unauthorized link detected';
            
            try {
                await message.delete();
                await message.channel.send({ content: `⚠️ ${message.author}, links are not allowed in this server!` })
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
            } catch (error) {
                console.error('Automod delete error:', error);
            }
        }
    }

    // ========== ANTI-CAPS DETECTION ==========
    if (config.anticaps.enabled && !violated) {
        const content = message.content;
        if (content.length >= config.anticaps.minLength) {
            const capsCount = (content.match(/[A-Z]/g) || []).length;
            const totalLetters = (content.match(/[A-Za-z]/g) || []).length;
            
            if (totalLetters > 0) {
                const capsPercentage = (capsCount / totalLetters) * 100;
                
                if (capsPercentage >= config.anticaps.percentage) {
                    violated = true;
                    reason = 'Excessive caps usage';
                    
                    try {
                        await message.delete();
                        await message.channel.send({ content: `⚠️ ${message.author}, please don't use excessive caps!` })
                            .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
                    } catch (error) {
                        console.error('Automod delete error:', error);
                    }
                }
            }
        }
    }

    // ========== ANTI-MENTION SPAM DETECTION ==========
    if (config.antimention.enabled && !violated) {
        const mentions = message.mentions.users.size + message.mentions.roles.size;
        
        if (mentions >= config.antimention.mentionLimit) {
            violated = true;
            reason = 'Mention spam detected';
            
            try {
                await message.delete();
                await message.member.timeout(120000, 'Automod: Mention spam');
                await message.channel.send({ content: `⚠️ ${message.author} has been timed out for mention spam!` })
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
            } catch (error) {
                console.error('Automod timeout error:', error);
            }
        }
    }

    // ========== LOG VIOLATIONS & ESCALATE ==========
    if (violated) {
        console.log(`[Automod] ${message.author.tag} violated automod: ${reason}`);
        
        // Track warnings
        const userId = message.author.id;
        if (!userWarnings.has(userId)) {
            userWarnings.set(userId, 0);
        }
        userWarnings.set(userId, userWarnings.get(userId) + 1);

        // Auto-action on repeated violations (3+ strikes)
        const warningCount = userWarnings.get(userId);
        if (warningCount >= 3) {
            try {
                await message.member.timeout(600000, 'Automod: Multiple violations');
                await message.channel.send({ content: `⚠️ ${message.author} has been timed out for 10 minutes due to repeated automod violations!` })
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
                userWarnings.delete(userId);
            } catch (error) {
                console.error('Automod escalation error:', error);
            }
        }
    }
}

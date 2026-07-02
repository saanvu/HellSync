const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        // ========== HANDLE MODAL SUBMISSIONS ==========
        if (interaction.isModalSubmit() && interaction.customId === 'embed_modal') {
            try {
                // Get stored channel data
                const modalData = client.embedModalData?.get(interaction.user.id);
                const targetChannel = modalData?.channel || interaction.channel;

                // Get modal inputs with fallbacks
                const title = interaction.fields.getTextInputValue('embed_title')?.trim() || null;
                let description = interaction.fields.getTextInputValue('embed_description')?.trim() || null;
                const colorInput = interaction.fields.getTextInputValue('embed_color')?.trim() || '#5865F2';
                const fieldsInput = interaction.fields.getTextInputValue('embed_fields')?.trim() || null;
                const imagesInput = interaction.fields.getTextInputValue('embed_images')?.trim() || null;

                // Replace \n with actual newlines
                if (description) {
                    description = description.replace(/\\n/g, '\n');
                }

                // Enhanced color parser
                const parseColor = (color) => {
                    if (!color) return 0x5865F2;
                    
                    // Hex color validation
                    if (color.match(/^#?[0-9a-fA-F]{6}$/i)) {
                        const hex = color.startsWith('#') ? color.slice(1) : color;
                        return parseInt(hex, 16);
                    }
                    
                    // Named colors
                    const colors = {
                        red: 0xED4245, green: 0x57F287, blue: 0x5865F2,
                        yellow: 0xFEE75C, purple: 0xA78BFA, orange: 0xF26522,
                        pink: 0xFF6B9D, grey: 0x99AAB5
                    };
                    
                    return colors[color.toLowerCase()] || 0x5865F2;
                };

                // Build embed step by step
                const embed = new EmbedBuilder()
                    .setColor(parseColor(colorInput))
                    .setTimestamp();

                if (title) embed.setTitle(title);
                if (description) embed.setDescription(description);

                // Parse fields (format: name|value|inline)
                if (fieldsInput) {
                    const fieldLines = fieldsInput.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                    
                    for (const line of fieldLines) {
                        const parts = line.split('|').map(p => p.trim());
                        if (parts.length >= 2 && parts[0] && parts[1]) {
                            try {
                                embed.addFields({
                                    name: parts[0].substring(0, 256),
                                    value: parts[1].substring(0, 1024),
                                    inline: parts[2]?.toLowerCase() === 'true'
                                });
                            } catch {
                                continue; // Skip invalid fields
                            }
                        }
                    }
                }

                // Parse images (format: thumbnail|image)
                if (imagesInput) {
                    const urls = imagesInput.split('|')
                        .map(u => u.trim())
                        .filter(Boolean);
                    
                    if (urls[0]) embed.setThumbnail(urls[0]);
                    if (urls[1]) embed.setImage(urls[1]);
                }

                // Create action buttons
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('embed_send')
                            .setLabel('✅ Send Embed')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('📤'),
                        
                        new ButtonBuilder()
                            .setCustomId('embed_edit')
                            .setLabel('✏️ Edit')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🔄'),
                        
                        new ButtonBuilder()
                            .setCustomId('embed_cancel')
                            .setLabel('❌ Cancel')
                            .setStyle(ButtonStyle.Danger)
                    );

                // Send preview
                const previewMsg = await interaction.reply({
                    content: `**📋 Embed Preview**\n**👤 Author:** ${interaction.user.tag}\n**📍 Target:** ${targetChannel}\n\nReact within **60 seconds** ⏰`,
                    embeds: [embed],
                    components: [row],
                    ephemeral: true,
                    fetchReply: true
                });

                // Button collector
                const collector = previewMsg.createMessageComponentCollector({
                    time: 60_000,
                    filter: (i) => i.user.id === interaction.user.id
                });

                let embedSent = false;

                collector.on('collect', async (i) => {
                    await i.deferUpdate();

                    try {
                        switch (i.customId) {
                            case 'embed_send':
                                await targetChannel.send({ embeds: [embed] });
                                await i.editReply({
                                    content: `✅ **Embed successfully sent to ${targetChannel}!** 🎉`,
                                    embeds: [],
                                    components: []
                                });
                                embedSent = true;
                                collector.stop('sent');
                                break;

                            case 'embed_edit':
                                await i.editReply({
                                    content: '✏️ **Modal reopened** - edit and submit again!',
                                    embeds: [],
                                    components: []
                                });
                                collector.stop('edit');
                                break;

                            case 'embed_cancel':
                                await i.editReply({
                                    content: '❌ **Embed creation cancelled.**',
                                    embeds: [],
                                    components: []
                                });
                                collector.stop('cancelled');
                                break;
                        }
                    } catch (error) {
                        console.error('Button interaction error:', error);
                        await i.followUp({
                            content: '❌ Error processing button click!',
                            ephemeral: true
                        }).catch(() => {});
                    }
                });

                collector.on('end', async (collected, reason) => {
                    if (!embedSent && reason === 'time') {
                        try {
                            await interaction.editReply({
                                content: '⏰ **Preview timed out** - embed not sent.',
                                embeds: [],
                                components: []
                            });
                        } catch (e) {
                            // Already handled or deleted
                        }
                    }
                });

                // Clean up modal data
                client.embedModalData?.delete(interaction.user.id);

            } catch (error) {
                console.error('❌ Modal submit error:', error);
                
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ **Failed to create embed!** Check console for details.',
                        ephemeral: true
                    }).catch(() => {});
                }
            }
            return;
        }

        // ========== HANDLE BUTTON INTERACTIONS ==========
        if (interaction.isButton()) {
            console.log(`🔘 Button clicked: ${interaction.customId} by ${interaction.user.tag}`);
            // Add custom button handlers here if needed
            return;
        }

        // ========== HANDLE CHAT INPUT (SLASH) COMMANDS ==========
        if (!interaction.isChatInputCommand()) return;

        const commandName = interaction.commandName.toLowerCase();
        
        // Try both command collections
        const command = client.commands.get(commandName) || 
                       client.slashCommands?.get(commandName);

        if (!command) {
            console.log(`❌ Slash command /${commandName} not found`);
            return;
        }

        try {
            console.log(`🔥 Executing slash: /${commandName} by ${interaction.user.tag}`);

            // Execute appropriate method
            if (typeof command.executeSlash === 'function') {
                await command.executeSlash(interaction, client);
            } else if (typeof command.execute === 'function') {
                await command.execute(interaction, client);
            } else {
                console.log(`❌ Command ${commandName} missing execute method`);
                return;
            }

        } catch (error) {
            console.error(`❌ Slash command /${commandName} error:`, error);

            const errorReply = {
                content: '❌ **An error occurred while executing this command!**',
                ephemeral: true
            };

            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(errorReply).catch(() => {});
            } else {
                await interaction.reply(errorReply).catch(() => {});
            }
        }
    }
};
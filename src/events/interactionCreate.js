const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        // ========== HANDLE MODAL SUBMISSIONS ==========
        if (interaction.isModalSubmit() && interaction.customId === 'embed_modal') {
            try {
                const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

                // Get stored channel data
                const modalData = client.embedModalData?.get(interaction.user.id);
                const targetChannel = modalData?.channel || interaction.channel;

                // Get modal inputs
                const title = interaction.fields.getTextInputValue('embed_title') || null;
                let description = interaction.fields.getTextInputValue('embed_description') || null;
                const colorInput = interaction.fields.getTextInputValue('embed_color') || '#5865F2';
                const fieldsInput = interaction.fields.getTextInputValue('embed_fields') || null;
                const imagesInput = interaction.fields.getTextInputValue('embed_images') || null;

                // Replace \n with actual newlines
                if (description) {
                    description = description.replace(/\\n/g, '\n');
                }

                // Parse color
                function parseColor(colorInput) {
                    if (!colorInput) return '#5865F2';
                    if (colorInput.match(/^#?[0-9a-fA-F]{6}$/)) {
                        return colorInput.startsWith('#') ? colorInput : `#${colorInput}`;
                    }
                    const colors = {
                        red: '#ED4245', blue: '#5865F2', green: '#57F287',
                        yellow: '#FEE75C', purple: '#5865F2', orange: '#F26522'
                    };
                    return colors[colorInput.toLowerCase()] || '#5865F2';
                }

                const embed = new EmbedBuilder()
                    .setColor(parseColor(colorInput));

                if (title) embed.setTitle(title);
                if (description) embed.setDescription(description);

                // Parse fields (format: name|value|inline)
                if (fieldsInput) {
                    const fieldLines = fieldsInput.split('\n').filter(line => line.trim());
                    fieldLines.forEach(line => {
                        const parts = line.split('|').map(p => p.trim());
                        if (parts.length >= 2) {
                            embed.addFields({
                                name: parts[0],
                                value: parts[1],
                                inline: parts[2]?.toLowerCase() === 'true'
                            });
                        }
                    });
                }

                // Parse images (format: thumbnail|image)
                if (imagesInput) {
                    const urls = imagesInput.split('|').map(u => u.trim()).filter(Boolean);
                    if (urls[0]) embed.setThumbnail(urls[0]);
                    if (urls[1]) embed.setImage(urls[1]);
                }

                // Show preview with buttons
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

                const reply = await interaction.reply({
                    content: `**📋 Embed Preview**\n**Target Channel:** ${targetChannel}\n\nClick **Send** to post or **Cancel** to discard.`,
                    embeds: [embed],
                    components: [row],
                    ephemeral: true,
                    fetchReply: true
                });

                const collector = reply.createMessageComponentCollector({
                    time: 60_000,
                    filter: (i) => i.user.id === interaction.user.id
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
                            content: '❌ Embed cancelled.',
                            embeds: [],
                            components: []
                        });
                        collector.stop('cancelled');
                    }
                });

                collector.on('end', async (_, reason) => {
                    if (reason === 'time') {
                        try {
                            await interaction.editReply({
                                content: '⏰ Timed out.',
                                embeds: [],
                                components: []
                            });
                        } catch (e) {}
                    }
                });

                // Clean up stored data
                client.embedModalData?.delete(interaction.user.id);

            } catch (error) {
                console.error('Modal submit error:', error);
                if (!interaction.replied) {
                    await interaction.reply({ content: '❌ Error creating embed!', ephemeral: true });
                }
            }
            return; // Exit after handling modal
        }

        // ========== HANDLE SLASH COMMANDS ==========
        // Ignore non-chat input
        if (!interaction.isChatInputCommand()) return;

        // Get command name
        const commandName = interaction.commandName.toLowerCase();
        
        // Find command in either collection
        const command = client.commands.get(commandName) || 
                       client.slashCommands.get(commandName);

        if (!command) {
            console.log(`❌ Command ${commandName} not found`);
            return;
        }

        try {
            console.log(`🔥 Executing slash: /${commandName} by ${interaction.user.tag}`);

            // Try executeSlash FIRST, then fallback to execute
            if (typeof command.executeSlash === 'function') {
                await command.executeSlash(interaction, client);
            } else if (typeof command.execute === 'function') {
                await command.execute(interaction, client);
            } else {
                console.log(`❌ Command ${commandName} has no execute method`);
            }

        } catch (error) {
            console.error(`❌ Error executing /${commandName}:`, error);

            const errorEmbed = {
                content: '❌ An error occurred while executing this command!',
                flags: [64]
            };

            // Avoid replying twice (ephemeral commands)
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply(errorEmbed).catch(() => {
                    interaction.followUp(errorEmbed).catch(console.error);
                });
            }
        }
    }
};

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");

function formatDuration(ms = 0) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function isUrl(input) {
  return /^https?:\/\//i.test(input);
}

function getMissingVoicePermissions(voiceChannel, botMember) {
  if (!botMember) return ["View Channel", "Connect", "Speak"];

  const permissions = voiceChannel.permissionsFor(botMember);
  const missing = [];

  if (!permissions?.has(PermissionFlagsBits.ViewChannel)) missing.push("View Channel");
  if (!permissions?.has(PermissionFlagsBits.Connect)) missing.push("Connect");
  if (!permissions?.has(PermissionFlagsBits.Speak)) missing.push("Speak");

  return missing;
}

async function searchWithFallback(player, query, requester) {
  if (isUrl(query)) {
    return player.search({ query }, requester);
  }

  const sources = ["youtube", "soundcloud"];
  let lastError = null;

  for (const source of sources) {
    try {
      const result = await player.search({ query, source }, requester);
      if (result?.tracks?.length) return result;
    } catch (error) {
      lastError = error;
      console.warn(`Music search failed on ${source}:`, error?.message || error);
    }
  }

  if (lastError) throw lastError;
  return null;
}

module.exports = {
  category: "Music",
  name: "play",
  description: "Play a song with full music controls",
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Song name or URL")
        .setRequired(true)
    ),

  async executeSlash(interaction, client) {
    await interaction.deferReply();

    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.editReply("❌ Join a voice channel first!");
    }

    const botMember = interaction.guild.members.me;
    const missingPermissions = getMissingVoicePermissions(voiceChannel, botMember);
    if (missingPermissions.length) {
      return interaction.editReply(
        `❌ I am missing voice permissions in ${voiceChannel}: **${missingPermissions.join(", ")}**.`
      );
    }

    const query = interaction.options.getString("query", true);

    try {
      // Get or create player
      let player = client.lavalink.getPlayer(interaction.guild.id);
      const wasPlaying = player?.playing || false;

      if (!player) {
        player = await client.lavalink.createPlayer({
          guildId: interaction.guild.id,
          voiceChannelId: voiceChannel.id,
          textChannelId: interaction.channel.id,
          selfDeaf: true,
          selfMute: false,
        });
      }

      // Connect if not connected
      if (!player.connected) {
        await player.connect();
      }

      setTimeout(() => {
        const me = interaction.guild.members.me;
        const voice = me?.voice;
        console.log(
          [
            `Voice diagnostics for guild ${interaction.guild.id}:`,
            `channel=${voice?.channelId || "none"}`,
            `serverMute=${voice?.serverMute}`,
            `selfMute=${voice?.selfMute}`,
            `serverDeaf=${voice?.serverDeaf}`,
            `selfDeaf=${voice?.selfDeaf}`,
            `suppress=${voice?.suppress}`,
            `playerConnected=${player.connected}`,
            `playerPlaying=${player.playing}`,
            `playerPaused=${player.paused}`,
            `playerPing=${JSON.stringify(player.ping)}`,
          ].join(" ")
        );
      }, 5_000);

      // ✅ FIX: Validate Lavalink node is connected BEFORE searching
      const nodes = client.lavalink.nodeManager.nodes;
      const hasConnectedNode = Array.from(nodes.values()).some(
      (n) => n.connected
      );

     if (!hasConnectedNode) {
       return interaction.editReply(
        "❌ Lavalink is connecting... Please try again in a moment!\n" +
        "(The music server is initializing)"
       );
     }
      // Search for tracks. Avoid Spotify search because this Lavalink app's
      // Spotify API currently returns 403 without an active premium owner.
      const res = await searchWithFallback(player, query, interaction.user);
      if (!res || !res.tracks || res.tracks.length === 0) {
        return interaction.editReply("❌ No results found.");
      }

      // Add to queue - playlist handling
      let addedText = "";

      // Better playlist detection
      const isPlaylist =
        res.loadType === "playlist" ||
        res.loadType === "PLAYLIST_LOADED" ||
        (res.playlist && res.playlist.name) ||
        (res.playlistInfo && res.playlistInfo.name) ||
        (res.tracks.length > 1 &&
          (query.includes("playlist") || query.includes("album")));

      if (isPlaylist && res.tracks.length > 1) {
        // Playlist - add all tracks
        for (const track of res.tracks) {
          await player.queue.add(track);
        }

        const playlistName =
          res.playlist?.name || res.playlistInfo?.name || "Playlist";
        addedText = `✅ Added **${playlistName}** (${res.tracks.length} tracks)`;
      } else {
        // Single track
        const track = res.tracks[0];
        await player.queue.add(track);
        addedText = `✅ Added **${track.info.title}** to queue`;
      }

      await interaction.editReply(addedText);

      // Play if not playing
      if (!player.playing && !player.paused) {
        await player.play();

        // Delete "Added" message after 3 seconds
        setTimeout(() => {
          interaction.deleteReply().catch(() => {});
        }, 3000);

        // Show control panel only when starting fresh
        if (!wasPlaying) {
          const panelMsg = await interaction.followUp({
            embeds: [this.createNowPlayingEmbed(player, interaction.user)],
            components: this.buildControlRows(player),
            fetchReply: true,
          });

          // Store panel message reference in player data
          if (!player.data) player.data = {};
          player.data.controlPanelMessage = panelMsg;

          this.attachPanelCollector(panelMsg, client, interaction.user.id);
        }
      }
    } catch (error) {
      console.error("Play error:", error);
      return interaction.editReply(
        `❌ Failed to play: ${error?.message || "Unknown error"}`
      );
    }
  },

  buildControlRows(player) {
    const pauseIsResume = player.paused;
    const pauseBtn = new ButtonBuilder()
      .setCustomId("music:pause")
      .setEmoji(pauseIsResume ? "▶️" : "⏸️")
      .setLabel(pauseIsResume ? "Resume" : "Pause")
      .setStyle(pauseIsResume ? ButtonStyle.Success : ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder().addComponents(
      pauseBtn,
      new ButtonBuilder()
        .setCustomId("music:skip")
        .setEmoji("⏭️")
        .setLabel("Skip")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("music:stop")
        .setEmoji("⏹️")
        .setLabel("Stop")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("music:queue")
        .setEmoji("📜")
        .setLabel("Queue")
        .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("music:volup")
        .setEmoji("🔊")
        .setLabel("+10")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("music:voldown")
        .setEmoji("🔉")
        .setLabel("-10")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("music:shuffle")
        .setEmoji("🔀")
        .setLabel("Shuffle")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("music:loop")
        .setEmoji("🔁")
        .setLabel("Loop")
        .setStyle(ButtonStyle.Secondary)
    );

    return [row1, row2];
  },

  attachPanelCollector(message, client, ownerId) {
    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 24 * 60 * 60 * 1000, // 24 hours - covers long sessions
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== ownerId) {
        return i.reply({
          content: "❌ Only the requester can use these controls.",
          ephemeral: true,
        });
      }

      const player = client.lavalink.getPlayer(i.guild.id);
      if (!player) {
        collector.stop();
        return i.update({ content: "❌ Player not found.", embeds: [] }); // Keep buttons visible
      }

      try {
        // Queue button - show ephemeral
        if (i.customId === "music:queue") {
          const qEmbed = this.createQueueEmbed(player);
          return i.reply({ embeds: [qEmbed], ephemeral: true });
        }

        if (i.customId === "music:pause") {
          player.paused ? await player.resume() : await player.pause();
        }

        if (i.customId === "music:skip") {
          await player.skip();
        }

        if (i.customId === "music:stop") {
          await player.destroy();
        }

        if (i.customId === "music:volup") {
          const newVol = Math.min((player.volume || 80) + 10, 100);
          await player.setVolume(newVol);
        }

        if (i.customId === "music:voldown") {
          const newVol = Math.max((player.volume || 80) - 10, 0);
          await player.setVolume(newVol);
        }

        if (i.customId === "music:shuffle") {
          player.queue.shuffle();
        }

        if (i.customId === "music:loop") {
          const modes = ["off", "track", "queue"];
          const currentIdx = modes.indexOf(player.repeatMode || "off");
          const nextMode = modes[(currentIdx + 1) % modes.length];
          player.setRepeatMode(nextMode);
        }

        // Update panel after action - NEVER remove components
        if (!player.queue.current) {
          collector.stop();
          return i.update({
            content: "✅ Music ended/stopped.",
            embeds: [],
            // No components: [] - buttons stay visible forever
          });
        }

        const embed = this.createNowPlayingEmbed(player, i.user);
        const rows = this.buildControlRows(player);
        return i.update({ embeds: [embed], components: rows });
      } catch (e) {
        console.error("Control error:", e);
        if (i.deferred || i.replied) {
          return i.followUp({
            content: `❌ Control failed: ${e?.message || "Unknown"}`,
            ephemeral: true,
          });
        }
        return i.reply({
          content: `❌ Control failed: ${e?.message || "Unknown"}`,
          ephemeral: true,
        });
      }
    });

    // NO "end" handler - never touch components again
  },

  createNowPlayingEmbed(player, requester) {
    const track = player.queue.current;
    return new EmbedBuilder()
      .setColor(0x1db954)
      .setTitle("🎵 Now Playing")
      .setDescription(track?.info?.title || "Unknown")
      .addFields(
        {
          name: "Artist",
          value: track?.info?.author || "Unknown",
          inline: true,
        },
        {
          name: "Duration",
          value: formatDuration(track?.info?.duration),
          inline: true,
        },
        {
          name: "Requested by",
          value: `<@${requester.id}>`,
          inline: true,
        }
      )
      .setThumbnail(track?.info?.artworkUrl || null)
      .setFooter({ text: "HellSync Music" })
      .setTimestamp();
  },

  createQueueEmbed(player) {
    const now = player.queue.current;
    const upcoming = player.queue.tracks.slice(0, 10);
    const lines = upcoming.map((t, idx) => {
      const title = t?.info?.title || "Unknown";
      const dur = formatDuration(t?.info?.duration || 0);
      return `${idx + 1}. ${title} \`${dur}\``;
    });

    return new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📜 Queue")
      .setDescription(
        [
          `**Now:** ${now?.info?.title || "Nothing"}`,
          "",
          lines.length
            ? `**Up next:**\n${lines.join("\n")}`
            : "**Up next:** Empty",
        ].join("\n")
      )
      .setTimestamp();
  },
};

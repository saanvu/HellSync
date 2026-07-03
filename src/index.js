// UNDICI FILE FIX
if (typeof globalThis.File === "undefined") {
    globalThis.File = class File extends Blob {
        constructor(...args) {
            super(...args);
        }
    };
}

if (typeof globalThis.Response === "undefined") {
    globalThis.Response = class Response {};
}

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const chalk = require("chalk");
const connectDB = require("./utils/database");
const { LavalinkManager } = require("lavalink-client");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildInvites,          // For invite tracking
        GatewayIntentBits.GuildMembers,          // For member events + auto-role
        GatewayIntentBits.GuildPresences,        // For online status (optional)
    ],
});

client.commands = new Collection();
client.slashCommands = new Collection();

// Initialize automod config (use Map instead of Collection)
client.automodConfig = new Map();

// Initialize warnings storage
client.warnings = new Map();

// Initialize autorole config
client.autoroleConfig = new Map();

// Initialize invite tracking
client.guildInvites = new Map();
client.inviteData = new Map();

// Initialize invite log channels
client.inviteLogChannels = new Map();

// Initialize logging config
client.loggingConfig = new Map();

// Initialize server stats config
client.serverStatsConfig = new Map();

// Lavalink Manager setup
client.lavalink = new LavalinkManager({
  nodes: [
    {
      id: "Lavalink",
      host: "127.0.0.1",
      port: 2333,
      authorization: "demibloom_1710",
      secure: false,
    },
  ],
  sendToShard: (guildId, payload) =>
    client.guilds.cache.get(guildId)?.shard?.send(payload),
  client: {
    id: process.env.CLIENT_ID,
    username: "HellSync",
  },
  autoSkip: true,
  emitNewSongsOnly: true,
  playerOptions: {
    defaultSearchPlatform: "scsearch",
  },
  advancedOptions: {
    debugOptions: {
      noAudio: true,
      playerDestroy: {
        debugLog: true,
      },
    },
  },
});

require('./utils/registerActions')(client);

async function deleteControlPanel(player, reason) {
    const panelMessage = player.data?.controlPanelMessage;
    if (!panelMessage) return;

    player.data.controlPanelMessage = null;

    try {
        await panelMessage.delete();
        console.log(`✓ Deleted control panel (${reason})`);
    } catch (e) {
        if (e?.code !== 10008) {
            console.log(`Could not delete control panel (${reason}):`, e.message);
        }
    }
}

// Raw event for voice updates
client.on("raw", (d) => client.lavalink.sendRawData(d));

// Ready event
client.once("ready", async () => {
    console.log(chalk.green(`✓ Logged in as ${client.user.tag}`));
    console.log(chalk.cyan(`📊 Servers: ${client.guilds.cache.size}`));
    console.log(chalk.cyan(`👥 Users: ${client.users.cache.size}`));

    // Initialize Lavalink
    try {
        await client.lavalink.init({ 
            id: client.user.id, 
            username: client.user.username 
        });
        
        // Wait for at least one node to connect
        await new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const nodes = client.lavalink.nodeManager.nodes;
                const connectedNode = Array.from(nodes.values()).find(n => n.connected);
                
                if (connectedNode) {
                    clearInterval(checkInterval);
                    console.log(chalk.green(`✓ Lavalink connected: ${connectedNode.options.id}`));
                    resolve();
                }
            }, 1000);
            
            // Timeout after 90 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.log(chalk.yellow('⚠ Lavalink connection timeout - music may not work'));
                resolve();
            }, 90000);
        });
        
        console.log(chalk.green("✓ Lavalink initialized - /play ready"));
        
    } catch (error) {
        console.log(chalk.red("✗ Lavalink initialization failed:"), error.message);
        console.log(chalk.yellow("⚠ Bot will start but music commands won't work"));
    }

    // ========== INITIALIZE INVITE TRACKING ==========
    console.log(chalk.blue('📋 Initializing invite tracking...'));
    
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            const invites = await guild.invites.fetch();
            const codeUses = new Map();
            
            invites.forEach(inv => codeUses.set(inv.code, inv.uses || 0));
            
            client.guildInvites.set(guildId, codeUses);
            console.log(chalk.green(`✓ Cached ${invites.size} invites for ${guild.name}`));
        } catch (error) {
            console.log(chalk.yellow(`⚠ Could not fetch invites for ${guild.name} (missing permissions)`));
        }
    }
    
    console.log(chalk.green('✓ Invite tracking initialized'));
    // ========== END INVITE TRACKING ==========

    // Lavalink events
    // Node events are on nodeManager, not lavalink directly
     client.lavalink.nodeManager.on("connect", (node) => {
       console.log(chalk.green(`✓ Lavalink node connected: ${node.options.id}`));
     });

     client.lavalink.nodeManager.on("disconnect", (node, reason) => {
       console.log(chalk.red(`✗ Lavalink node disconnected: ${node.options.id} - ${reason?.code || 'Unknown'}`));
     });

     client.lavalink.nodeManager.on("error", (node, error, payload) => {
       console.log(chalk.red(`✗ Node ${node.options.id} error: ${error?.message || error}`));
       // Don't crash the bot on node errors
     });

     client.lavalink.nodeManager.on("reconnecting", (node) => {
      console.log(chalk.yellow(`⟳ Reconnecting to node: ${node.options.id}`));
     });

    client.lavalink.on("debug", (eventKey, eventData) => {
        console.log(chalk.gray(`Lavalink debug [${eventKey}]:`), eventData);
    });

    client.lavalink.on("playerDisconnect", (player, voiceChannelId) => {
        console.log(chalk.yellow(`⚠ Player disconnected in ${player.guildId} from voice channel ${voiceChannelId}`));
    });

    client.lavalink.on("playerSocketClosed", (player, payload) => {
        console.log(chalk.yellow(`⚠ Player socket closed in ${player.guildId}: code=${payload?.code}, reason=${payload?.reason || "none"}, byRemote=${payload?.byRemote}`));
    });

    client.lavalink.on("playerMuteChange", (player, selfMuted, serverMuted) => {
        console.log(chalk.yellow(`⚠ Player mute state changed in ${player.guildId}: selfMuted=${selfMuted}, serverMuted=${serverMuted}`));
    });

    client.lavalink.on("playerDeafChange", (player, selfDeafed, serverDeafed) => {
        console.log(chalk.yellow(`⚠ Player deaf state changed in ${player.guildId}: selfDeafed=${selfDeafed}, serverDeafed=${serverDeafed}`));
    });

    client.lavalink.on("playerSuppressChange", (player, suppressed) => {
        console.log(chalk.yellow(`⚠ Player suppress state changed in ${player.guildId}: suppressed=${suppressed}`));
    });

    client.lavalink.on("playerUpdate", (oldPlayerJson, newPlayer) => {
        console.log(
            chalk.gray(`Lavalink player update ${newPlayer.guildId}: connected=${newPlayer.connected}, playing=${newPlayer.playing}, paused=${newPlayer.paused}, ping=${JSON.stringify(newPlayer.ping)}`)
        );
    });

    client.lavalink.on("trackStart", (player, track) => {
        console.log(
            chalk.green(`▶ Track started in ${player.guildId}: ${track?.info?.title || "Unknown"} (${track?.info?.sourceName || "unknown source"})`)
        );
    });

    client.lavalink.on("trackEnd", (player, track, payload) => {
        console.log(
            chalk.yellow(`■ Track ended in ${player.guildId}: ${track?.info?.title || "Unknown"} (${payload?.reason || "unknown reason"})`)
        );
    });

    client.lavalink.on("trackError", async (player, track, payload) => {
        console.log(
            chalk.red(`✗ Track error in ${player.guildId}: ${track?.info?.title || "Unknown"} - ${payload?.exception?.message || payload?.error || "Unknown error"}`)
        );

        const channel = client.channels.cache.get(player.textChannelId);
        if (channel) {
            channel.send(`❌ Could not play **${track?.info?.title || "this track"}**. Trying the next track if one is queued.`).catch(() => {});
        }
    });

    client.lavalink.on("trackStuck", async (player, track, payload) => {
        console.log(
            chalk.red(`✗ Track stuck in ${player.guildId}: ${track?.info?.title || "Unknown"} after ${payload?.thresholdMs || "unknown"}ms`)
        );

        const channel = client.channels.cache.get(player.textChannelId);
        if (channel) {
            channel.send(`❌ Playback got stuck for **${track?.info?.title || "this track"}**. Trying the next track if one is queued.`).catch(() => {});
        }
    });

    // Queue end - delete panel and destroy player
    client.lavalink.on("queueEnd", async (player) => {
        console.log(`Queue ended for guild ${player.guildId}`);

        await deleteControlPanel(player, "queue end");

        const channel = client.channels.cache.get(player.textChannelId);
        if (channel) channel.send("✅ Queue ended.").catch(() => {});
        player.destroy();
    });

    // Player destroy - clean up control panel
    client.lavalink.on("playerDestroy", async (player) => {
        console.log(`Player destroyed for guild ${player.guildId}`);

        await deleteControlPanel(player, "player destroy");
    });

    // Set bot status
    client.user.setPresence({
        activities: [{ name: '/help | HellSync', type: 0 }],
        status: 'online'
    });
    
    console.log(chalk.green.bold('✅ HellSync is ready!'));
});

// ========== INVITE CREATE EVENT (Update cache when new invite created) ==========
client.on('inviteCreate', async (invite) => {
    const guildInvites = client.guildInvites.get(invite.guild.id) || new Map();
    guildInvites.set(invite.code, invite.uses || 0);
    client.guildInvites.set(invite.guild.id, guildInvites);
    console.log(chalk.blue(`📨 New invite created in ${invite.guild.name}: ${invite.code}`));
});

// ========== INVITE DELETE EVENT (Update cache when invite deleted) ==========
client.on('inviteDelete', async (invite) => {
    const guildInvites = client.guildInvites.get(invite.guild.id);
    if (guildInvites) {
        guildInvites.delete(invite.code);
        client.guildInvites.set(invite.guild.id, guildInvites);
        console.log(chalk.yellow(`🗑️ Invite deleted in ${invite.guild.name}: ${invite.code}`));
    }
});

// Global error handlers
process.on("unhandledRejection", (error) => {
    console.error(chalk.red.bold("Unhandled Promise Rejection:"), error);
});

process.on("uncaughtException", (error) => {
    console.error(chalk.red.bold("Uncaught Exception:"), error);
});

async function startBot() {
    console.log(chalk.blue.bold("🚀 Starting HellSync Bot..."));
    
    try {
        console.log("Connecting to MongoDB...");
        await connectDB();
        console.log("✓ MongoDB OK");

        // ========== COMMAND LOADING ==========
        console.log("Loading commands...");
        const commandsPath = path.join(__dirname, "commands");
        
        // Get all command category folders
        const commandFolders = fs.readdirSync(commandsPath);
        
        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            
            // Skip if not a directory
            if (!fs.statSync(folderPath).isDirectory()) continue;
            
            // Get all .js files in the folder
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                
                // Set command in collection
                if (command.name) {
                    client.commands.set(command.name, command);
                    
                    // Also set in slashCommands if it has slash data
                    if (command.data) {
                        client.slashCommands.set(command.data.name, command);
                    }
                    
                    console.log(chalk.green(`✓ ${folder}/${file}`));
                } else {
                    console.log(chalk.yellow(`⚠ Skipping ${file} - no name property`));
                }
            }
        }
        
        console.log(chalk.green(`✓ Loaded ${client.commands.size} commands`));
        // ========== END COMMAND LOADING ==========

        console.log("Loading events...");
        const eventsPath = path.join(__dirname, "events");
        const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));
        
        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
            
            console.log(chalk.green(`✓ Event: ${event.name}`));
        }

        if (!process.env.DISCORD_TOKEN) {
            throw new Error("❌ Missing DISCORD_TOKEN in .env");
        }

        console.log("Logging into Discord...");
        await client.login(process.env.DISCORD_TOKEN);
        
    } catch (error) {
        console.error(chalk.red.bold("❌ Failed to start:"), error);
        process.exit(1);
    }
}

startBot();

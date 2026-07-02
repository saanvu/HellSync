const actionHandler = require('./actionHandler');
const clientCommands = new Map();

const ACTIONS = ['slap', 'smug', 'kiss', 'boop', 'lick', 'bite', 'pat', 'hug'];

ACTIONS.forEach(action => {
    clientCommands.set(action, {
        name: action,
        description: `Perform a ${action} action`,
        category: 'Actions',
        usage: `.${action} [@user]`,
        async execute(message, args, client) {
            await actionHandler(message, action);
        }
    });
});

module.exports = (client) => {
    ACTIONS.forEach(action => {
        client.commands.set(action, clientCommands.get(action));
    });
    console.log(`✅ Loaded ${ACTIONS.length} action commands`);
};
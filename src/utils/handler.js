const fs = require('fs');
const path = require('path');

const loadCommands = (client) => {
  const commandsPath = path.join(__dirname, '../commands');
  const categoryFolders = fs.readdirSync(commandsPath).filter(folder => 
    fs.statSync(path.join(commandsPath, folder)).isDirectory()
  );

  let totalCommands = 0;

  for (const folder of categoryFolders) {
    const categoryPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const command = require(filePath);

      if (command.name) {
        client.commands.set(command.name, command);
      }

      if (command.data && command.data.name) {
        client.slashCommands.set(command.data.name, command);
      }

      totalCommands++;
    }

    console.log(`✓ Loaded ${commandFiles.length} commands from ${folder} category`);
  }

  console.log(`✓ Total commands loaded: ${totalCommands}`);
};

module.exports = { loadCommands };
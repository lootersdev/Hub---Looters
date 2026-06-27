const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

const REGLEMENT_CHANNEL = '1515832971071066145';
const REGLEMENT_ROLE = '1515835957713043557';
const REGLEMENT_EMOJI = '✅';
const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data));
}

module.exports = (client) => {
  // Slash command definition
  client.slashCommands = client.slashCommands || [];
  client.slashCommands.push(
    new SlashCommandBuilder()
      .setName('reglement')
      .setDescription('Envoie le message de règlement avec réaction rôle')
  );

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'reglement') return;

    const channel = interaction.guild.channels.cache.get(REGLEMENT_CHANNEL);
    if (!channel) return interaction.reply({ content: '❌ Salon règlement introuvable.', ephemeral: true });

    const existingId = loadData().messageId;
    if (existingId) {
      const old = await channel.messages.fetch(existingId).catch(() => null);
      if (old) await old.delete().catch(() => {});
    }

    const msg = await channel.send({
      embeds: [{
        color: 0xFFFFFF,
        description: 'Clique sur ✅ ci-dessous pour accéder au serveur !',
        footer: { text: 'Looters Hub' },
      }],
    });
    await msg.react(REGLEMENT_EMOJI);
    saveData({ messageId: msg.id });
    await interaction.reply({ content: '✅ Message de règlement envoyé !', ephemeral: true });
  });

  client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.id !== loadData().messageId) return;
    if (reaction.emoji.name !== REGLEMENT_EMOJI) return;
    const member = reaction.message.guild.members.cache.get(user.id);
    if (member) await member.roles.add(REGLEMENT_ROLE);
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.id !== loadData().messageId) return;
    if (reaction.emoji.name !== REGLEMENT_EMOJI) return;
    const member = reaction.message.guild.members.cache.get(user.id);
    if (member) await member.roles.remove(REGLEMENT_ROLE);
  });
};

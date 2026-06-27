const { SlashCommandBuilder } = require('discord.js');

const REGLEMENT_CHANNEL = '1515832971071066145';
const REGLEMENT_ROLE = '1515835957713043557';
const REGLEMENT_EMOJI = '✅';

module.exports = (client) => {
  let rulesMessageId = null;

  client.slashCommands = client.slashCommands || [];
  client.slashCommands.push(
    new SlashCommandBuilder()
      .setName('reglement')
      .setDescription('Envoie le message de règlement avec réaction rôle')
  );

  // Find existing rules message on startup
  async function findExistingMessage(guildId) {
    const guild = client.guilds.cache.get(guildId) || client.guilds.cache.find(g => g.channels.cache.has(REGLEMENT_CHANNEL));
    if (!guild) return;
    const channel = guild.channels.cache.get(REGLEMENT_CHANNEL);
    if (!channel) return;
    try {
      const messages = await channel.messages.fetch({ limit: 20 });
      const botMsg = messages.find(m => m.author.id === client.user.id && m.reactions.cache.has(REGLEMENT_EMOJI));
      if (botMsg) rulesMessageId = botMsg.id;
    } catch {}
  }

  client.once('clientReady', async () => {
    for (const guild of client.guilds.cache.values()) {
      await findExistingMessage(guild.id);
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'reglement') return;

    const channel = interaction.guild.channels.cache.get(REGLEMENT_CHANNEL);
    if (!channel) return interaction.reply({ content: '❌ Salon règlement introuvable.', ephemeral: true });

    // Delete old message
    if (rulesMessageId) {
      const old = await channel.messages.fetch(rulesMessageId).catch(() => null);
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
    rulesMessageId = msg.id;
    await interaction.reply({ content: '✅ Message de règlement envoyé !', ephemeral: true });
  });

  client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.id !== rulesMessageId) return;
    if (reaction.emoji.name !== REGLEMENT_EMOJI) return;
    const member = reaction.message.guild.members.cache.get(user.id);
    if (member) await member.roles.add(REGLEMENT_ROLE);
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.id !== rulesMessageId) return;
    if (reaction.emoji.name !== REGLEMENT_EMOJI) return;
    const member = reaction.message.guild.members.cache.get(user.id);
    if (member) await member.roles.remove(REGLEMENT_ROLE);
  });
};

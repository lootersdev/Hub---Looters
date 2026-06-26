require('dotenv').config();
const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const http = require('http');

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.end('Bot en ligne')).listen(PORT, () => {
  console.log(`🌐 Serveur HTTP sur le port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('clientReady', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const args = message.content.split(' ');
  const cmd = args[0].toLowerCase();

  if (cmd === '!ping') {
    const sent = await message.channel.send('Calcul du ping...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`🏓 **Pong !** Latence : ${latency}ms | API : ${Math.round(client.ws.ping)}ms`);
  }

  if (cmd === '!help') {
    await message.channel.send({
      embeds: [{
        color: 0xffd700,
        title: '📋 Commandes du Looters Bot',
        fields: [
          { name: '`!ping`', value: 'Affiche la latence du bot', inline: true },
          { name: '`!help`', value: 'Affiche cette liste', inline: true },
          { name: '`!clear <n>`', value: 'Supprime n messages (max 100)', inline: true },
        ],
        footer: { text: 'Looters Hub' },
      }],
    });
  }

  if (cmd === '!clear') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ Tu dois avoir la permission `Gérer les messages`.');
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply("❌ Je n'ai pas la permission `Gérer les messages`.");
    }
    const amount = parseInt(args[1]);
    if (!amount || amount < 1 || amount > 100) {
      return message.reply('❌ Utilisation : `!clear <nombre>` (1-100)');
    }
    await message.channel.bulkDelete(amount, true);
    const msg = await message.channel.send(`✅ ${amount} message(s) supprimé(s).`);
    setTimeout(() => msg.delete().catch(() => {}), 3000);
  }
});

process.on('unhandledRejection', (err) => console.error('❌ Erreur :', err));

client.login(process.env.DISCORD_TOKEN);

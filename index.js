require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
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

  if (message.content === '!ping') {
    const sent = await message.channel.send('Calcul du ping...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`🏓 **Pong !** Latence : ${latency}ms | API : ${Math.round(client.ws.ping)}ms`);
  }
});

client.login(process.env.DISCORD_TOKEN);

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.end('Bot en ligne')).listen(PORT, () => {
  console.log(`🌐 Serveur HTTP sur le port ${PORT}`);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('clientReady', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  const guilds = client.guilds.cache;
  for (const guild of guilds.values()) {
    await guild.commands.set([]);
    console.log(`✅ Commandes supprimées sur ${guild.name}`);
  }
});

process.on('unhandledRejection', (err) => console.error('❌ Erreur :', err));

client.login(process.env.DISCORD_TOKEN);

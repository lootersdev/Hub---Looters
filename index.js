require('dotenv').config();
const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
let PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT;

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif' };
http.createServer((req, res) => {
  PUBLIC_URL = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
  if (req.url === '/') return res.end('Bot en ligne');
  const filePath = path.join(__dirname, 'images', req.url === '/umbed-bienvenue.png' ? 'banniere/umbed-bienvenue.png' : req.url === '/logo.png' ? 'logo/logo.png' : req.url === '/umbed-siteweb.png' ? 'banniere/umbed-siteweb.png' : '');
  const ext = path.extname(filePath);
  if (filePath.includes('..') || !MIME[ext]) return res.writeHead(404).end();
  fs.readFile(filePath, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': MIME[ext], 'Cache-Control': 'max-age=86400' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`🌐 Serveur HTTP sur le port ${PORT}`));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.publicURL = PUBLIC_URL;

client.once('clientReady', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const guilds = client.guilds.cache;
  for (const guild of guilds.values()) {
    if (client.slashCommands?.length) {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
      await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), {
        body: client.slashCommands.map(c => c.toJSON()),
      });
    }
  }
});

require('./features/clear/index')(client);
require('./features/bienvenue/index')(client);
require('./features/reglement/index')(client);
require('./features/siteweb/index')(client);

process.on('unhandledRejection', (err) => console.error('❌ Erreur :', err));

client.login(process.env.DISCORD_TOKEN);

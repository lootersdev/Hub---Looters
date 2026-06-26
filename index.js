require('dotenv').config();
const { Client, GatewayIntentBits, PermissionFlagsBits, Partials } = require('discord.js');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const WELCOME_CHANNEL = '1515832946714480842';
const RULES_CHANNEL = '1515832971071066145';
const RULES_ROLE = '1515835957713043557';
const RULES_EMOJI = '✅';
let PUBLIC_URL = 'http://localhost:' + PORT;
let rulesMessageId = null;

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif' };
const server = http.createServer((req, res) => {
  PUBLIC_URL = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
  if (req.url === '/') return res.end('Bot en ligne');
  const filePath = path.join(__dirname, 'images', req.url === '/logo.png' ? 'logo/logo.png' : req.url === '/banner.png' ? 'banniere/LOOTERS.png' : req.url === '/umbed.png' ? 'umbed.png' : req.url === '/reglement.png' ? 'reglementpng.png' : '');
  const ext = path.extname(filePath);
  if (filePath.includes('..') || !MIME[ext]) return res.writeHead(404).end();
  fs.readFile(filePath, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': MIME[ext], 'Cache-Control': 'max-age=86400' });
    res.end(data);
  });
});
server.listen(PORT, () => console.log(`🌐 Serveur HTTP sur le port ${PORT}`));

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

client.once('clientReady', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
  await sendRulesMessage();
});

async function sendRulesMessage() {
  const channel = client.channels.cache.get(RULES_CHANNEL);
  if (!channel) return console.log('❌ Salon règlement introuvable');
  try {
    const messages = await channel.messages.fetch({ limit: 10 });
    const existing = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);
    if (existing) {
      rulesMessageId = existing.id;
      return;
    }
    const msg = await channel.send({
      embeds: [{
        color: 0xFFFFFF,
        image: { url: `${PUBLIC_URL}/reglement.png` },
      }],
    });
    await msg.react(RULES_EMOJI);
    rulesMessageId = msg.id;
  } catch (err) {
    console.error('❌ Erreur envoi règlement :', err);
  }
}

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.message.id !== rulesMessageId) return;
  if (reaction.emoji.name !== RULES_EMOJI) return;
  const member = reaction.message.guild.members.cache.get(user.id);
  if (member) await member.roles.add(RULES_ROLE);
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.message.id !== rulesMessageId) return;
  if (reaction.emoji.name !== RULES_EMOJI) return;
  const member = reaction.message.guild.members.cache.get(user.id);
  if (member) await member.roles.remove(RULES_ROLE);
});

client.on('guildMemberAdd', async (member) => {
  if (member.user.bot) return;
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL);
  if (!channel) return;
  await channel.send({
    content: `${member}`,
    embeds: [{
      color: 0xFFFFFF,
      description: '**Bienvenue à toi !**',
      image: { url: `${PUBLIC_URL}/umbed.png` },
      footer: { text: 'Looters Hub', iconURL: `${PUBLIC_URL}/logo.png` },
    }],
  });
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
    const icon = message.guild?.iconURL() || client.user.displayAvatarURL();
    await message.channel.send({
      embeds: [{
        color: 0xFFFFFF,
        title: '📋 Commandes',
        thumbnail: { url: `${PUBLIC_URL}/logo.png` },
        image: { url: `${PUBLIC_URL}/banner.png` },
        fields: [
          { name: '__**🛠 Utilité**__', value: '　', inline: false },
          { name: '`!ping`', value: 'Affiche la latence du bot', inline: true },
          { name: '`!help`', value: 'Affiche cette liste d\'aide', inline: true },
          { name: '　', value: '　', inline: false },
          { name: '__**👮 Modération**__', value: '　', inline: false },
          { name: '`!clear <n>`', value: 'Supprime n messages (1-100)\nNécessite : Gérer les messages', inline: true },
        ],
        footer: { text: 'Looters Hub', iconURL: icon },
      }],
    });
  }

  if (cmd === '!clear') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply("❌ Tu n'as pas la permission `Gérer les messages`.");
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

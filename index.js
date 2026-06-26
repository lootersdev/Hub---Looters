require('dotenv').config();
const { Client, GatewayIntentBits, PermissionFlagsBits, Partials, REST, Routes, SlashCommandBuilder } = require('discord.js');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const WELCOME_CHANNEL = '1515832946714480842';
const RULES_CHANNEL = '1515832971071066145';
const RULES_ROLE = '1515835957713043557';
const RULES_EMOJI = '✅';
let PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT;
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
  const guild = client.guilds.cache.find(g => g.channels.cache.has(RULES_CHANNEL));
  if (guild) {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), {
      body: [
        new SlashCommandBuilder()
          .setName('reglement')
          .setDescription('Envoie le message de règlement avec réaction rôle'),
        new SlashCommandBuilder()
          .setName('site-web')
          .setDescription('Affiche le lien du site web Looters'),
        new SlashCommandBuilder()
          .setName('mentions-legales')
          .setDescription('Affiche les mentions légales de Looters'),
        new SlashCommandBuilder()
          .setName('createur')
          .setDescription('Affiche les créateurs de Looters'),
      ],
    });
    console.log('✅ Commande /reglement enregistrée');
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'mentions-legales') {
    return interaction.reply({
      embeds: [{
        color: 0xFFFFFF,
        title: '📌 Mentions légales — Looters',
        thumbnail: { url: `${PUBLIC_URL}/logo.png` },
        fields: [
          {
            name: '👤 Éditeur du service',
            value: 'Defouloy Malonn — Entrepreneur individuel\nNom commercial : Looters\nSIREN : 104 615 265\nSIRET : 10461526500014\n\n**Activité :** Vente à distance de vêtements et accessoires\n**Code APE :** 4791B',
          },
          {
            name: '📍 Adresse',
            value: '77 Rue de la Vendée\n85130 Bazoges-en-Paillers\nFrance\n\n**Immatriculation RNE :** 06/05/2026',
          },
          {
            name: '📢 Responsable de publication',
            value: 'Defouloy Malonn, représentant de Looters.',
          },
          {
            name: '📋 Objet',
            value: 'Le serveur Discord Looters est un espace communautaire permettant aux utilisateurs d\'échanger et d\'accéder aux informations liées à la marque et ses services.',
          },
          {
            name: '© Propriété intellectuelle',
            value: 'Les éléments appartenant à Looters (nom, logo, visuels, contenus) ne peuvent pas être reproduits ou utilisés sans autorisation.',
          },
          {
            name: '⚖️ Responsabilité',
            value: 'Chaque utilisateur est responsable de ses messages et comportements sur le serveur. Looters ne peut être tenu responsable des contenus publiés par les membres.',
          },
          {
            name: '🔒 Données personnelles',
            value: 'L\'utilisation de Discord implique le traitement de certaines données par Discord conformément à leur politique de confidentialité. Looters respecte les obligations applicables concernant les données personnelles.',
          },
          {
            name: '📧 Contact',
            value: '**Entreprise :** Defouloy Malonn\n**Nom commercial :** Looters\n**Site :** [looters.fr](https://looters.fr)',
          },
        ],
        footer: { text: 'Looters Hub', iconURL: `${PUBLIC_URL}/logo.png` },
      }],
    });
  }

  if (interaction.commandName === 'createur') {
    return interaction.reply({
      embeds: [{
        color: 0xFFFFFF,
        title: '👤 Créateurs — Looters',
        description: 'Bienvenue dans l\'univers Looters.',
        thumbnail: { url: `${PUBLIC_URL}/logo.png` },
        fields: [
          {
            name: '**Les créateurs**',
            value: '　',
          },
          {
            name: 'Defouloy Malonn — Créateur de Looters',
            value: 'J\'ai créé Looters avec l\'objectif de proposer une marque moderne autour des vêtements et accessoires, tout en construisant une communauté active et engagée.',
          },
          {
            name: '@youtsuho — Co-créateur de Looters',
            value: 'Il participe au développement du projet, à son évolution et à la construction de la communauté Looters.',
          },
          {
            name: '**Notre vision**',
            value: 'Looters est plus qu\'une simple boutique : c\'est un projet construit autour de la créativité, de la communauté et de l\'envie de proposer des produits qui correspondent aux attentes des membres.\n\nChaque étape du projet est pensée pour évoluer avec sa communauté.',
          },
          {
            name: '**Informations**',
            value: '🏷️ **Marque :** Looters\n👤 **Créateur :** Defouloy Malonn\n🤝 **Co-créateur :** @youtsuho\n🌐 **Site :** [looters.fr](https://looters.fr)',
          },
        ],
        footer: {
          text: 'Merci à toutes les personnes qui soutiennent Looters ❤️',
          iconURL: `${PUBLIC_URL}/logo.png`,
        },
      }],
    });
  }

  if (interaction.commandName === 'site-web') {
    return interaction.reply({
      embeds: [{
        color: 0xFFFFFF,
        title: '🌐 Site Web Looters',
        description: 'Découvre notre site officiel :\n\n🔗 **[looters.fr](https://looters.fr)**',
        image: { url: `${PUBLIC_URL}/banner.png` },
        footer: { text: 'Looters Hub', iconURL: `${PUBLIC_URL}/logo.png` },
      }],
    });
  }

  if (interaction.commandName !== 'reglement') return;

  const channel = interaction.guild.channels.cache.get(RULES_CHANNEL);
  if (!channel) return interaction.reply({ content: '❌ Salon règlement introuvable.', ephemeral: true });

  if (rulesMessageId) {
    const existing = await channel.messages.fetch(rulesMessageId).catch(() => null);
    if (existing) await existing.delete().catch(() => {});
  }

  const msg = await channel.send({
    embeds: [{
      color: 0xFFFFFF,
      description: 'Clique sur l\'émoji ✅ ci-dessous pour accéder au serveur !',
      image: { url: `${PUBLIC_URL}/reglement.png` },
    }],
  });
  await msg.react(RULES_EMOJI);
  rulesMessageId = msg.id;
  await interaction.reply({ content: '✅ Message de règlement envoyé !', ephemeral: true });
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();
  if (reaction.message.id !== rulesMessageId) return;
  if (reaction.emoji.name !== RULES_EMOJI) return;
  const member = reaction.message.guild.members.cache.get(user.id);
  if (member) await member.roles.add(RULES_ROLE);
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();
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
          { name: '`/reglement`', value: 'Envoie le message de règlement (Admin)', inline: true },
          { name: '`/site-web`', value: 'Affiche le lien du site Looters', inline: true },
          { name: '`/mentions-legales`', value: 'Affiche les mentions légales', inline: true },
          { name: '`/createur`', value: 'Affiche les créateurs de Looters', inline: true },
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

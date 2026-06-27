const fs = require('fs');
const path = require('path');

const WELCOME_CHANNEL = '1515832946714480842';
const COUNTER_FILE = path.join(__dirname, 'welcomeCount.json');

function getCount() {
  try {
    const data = fs.readFileSync(COUNTER_FILE, 'utf8');
    return JSON.parse(data).count || 0;
  } catch {
    return 0;
  }
}

function incrementCount() {
  const count = getCount() + 1;
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ count }));
  return count;
}

const conseils = [
  '👀 N\'oublie pas de lire le règlement pour accéder au serveur !',
  '🎮 Rejoins-nous sur les événements pour gagner des lots exclusifs !',
  '🛒 Découvre notre boutique sur looters.fr',
  '💬 Présente-toi dans le salon dédié, la communauté est super accueillante !',
  '🔔 Active les notifications pour ne rien rater des annonces !',
  '🏆 Participe aux concours, des récompenses t\'attendent !',
  '👥 Invite tes amis à rejoindre Looters !',
];

module.exports = (client) => {
  client.on('guildMemberAdd', async (member) => {
    if (member.user.bot) return;
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL);
    if (!channel) return;

    const count = incrementCount();
    const conseil = conseils[Math.floor(Math.random() * conseils.length)];
    const createdAt = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`;
    const PUBLIC_URL = client.publicURL || 'http://localhost:' + (process.env.PORT || 3000);

    await channel.send({
      content: `👋 **Bienvenue à toi, ${member} !**`,
      embeds: [{
        color: 0xFFFFFF,
        description: `Tu es le **${count}e membre** à rejoindre Looters ! 🎉`,
        image: { url: `${PUBLIC_URL}/umbed.png` },
        fields: [
          { name: '📅 Compte créé', value: createdAt, inline: true },
          { name: '👥 Membres', value: `${member.guild.memberCount}`, inline: true },
          { name: '💡 Astuce', value: conseil, inline: false },
        ],
        footer: { text: 'Looters Hub', iconURL: member.user.displayAvatarURL() },
      }],
    });
  });
};

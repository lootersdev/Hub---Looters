const https = require('https');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = (client) => {
  client.slashCommands = client.slashCommands || [];
  client.slashCommands.push(
    new SlashCommandBuilder()
      .setName('siteweb')
      .setDescription('Affiche le site officiel Looters')
  );

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'siteweb') return;

    await interaction.deferReply();

    let status = '🔴 Hors ligne';
    let color = 0xFF0000;
    try {
      await new Promise((resolve, reject) => {
        https.get('https://looters.fr', (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            status = '🟢 En ligne';
            color = 0x00FF00;
          }
          resolve();
        }).on('error', reject).setTimeout(5000, () => reject(new Error('timeout')));
      });
    } catch {
      status = '🔧 En maintenance';
      color = 0xFFA500;
    }

    const PUBLIC_URL = client.publicURL || 'http://localhost:' + (process.env.PORT || 3000);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Visiter looters.fr')
        .setStyle(ButtonStyle.Link)
        .setURL('https://looters.fr')
    );

    await interaction.editReply({
      embeds: [{
        color,
        title: '🌍 Site Web Looters',
        url: 'https://looters.fr',
        description: `**Statut :** ${status}\n\nClique sur le bouton ci-dessous pour visiter notre site officiel !`,
        image: { url: `${PUBLIC_URL}/siteweb.png` },
        footer: { text: 'Looters Hub', iconURL: `${PUBLIC_URL}/logo.png` },
      }],
      components: [row],
    });
  });
};

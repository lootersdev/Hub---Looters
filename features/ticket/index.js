const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = (client) => {
  client.slashCommands = client.slashCommands || [];
  client.slashCommands.push(
    new SlashCommandBuilder()
      .setName('ouvrir-un-ticket')
      .setDescription('Affiche les instructions pour ouvrir un ticket')
  );

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'ouvrir-un-ticket') return;

    const PUBLIC_URL = client.publicURL || 'http://localhost:' + (process.env.PORT || 3000);

    await interaction.reply({
      embeds: [{
        color: 0xFFFFFF,
        title: '🎫 Ouvrir un ticket',
        description: '📌 **Avant d\'ouvrir un ticket**, assure-toi d\'avoir lu le **règlement** avec `/reglement`.\n\n> ⚠️ **Tout ticket ouvert sans respect du staff sera fermé et pourra entraîner des sanctions.**\n\n━━━━━━━━━━━━━━━━━━\n\nChoisis le salon correspondant à ta demande :',
        image: { url: `${PUBLIC_URL}/umbed-exampleticket.png` },
        fields: [
          {
            name: '🛒 **Commande**',
            value: `<#1520248283577188426>\nPour passer une commande sur la boutique.`,
          },
          {
            name: '📦 **Suivi de commande**',
            value: `<#1515833054893965424>\nPour suivre l\'avancement de ta commande avec le bot Discord.`,
          },
          {
            name: '🤝 **Collaboration**',
            value: `<#1520248341118586910>\nPour faire une demande de collaboration ou de partenariat.`,
          },
        ],
        footer: { text: 'Looters Hub', iconURL: `${PUBLIC_URL}/logo.png` },
      }],
    });
  });
};

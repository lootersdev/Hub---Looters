const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, ChannelType, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { CATEGORIES, ROLES, MODAL_QUESTIONS, TICKET_NAMES, REVIEW_CHANNEL } = require('./config');

const DATA_FILE = path.join(__dirname, 'tickets.json');
const tickets = (() => { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } })();
function saveTickets() { fs.writeFileSync(DATA_FILE, JSON.stringify(tickets)); }

function getTicketType(cmd) {
  if (cmd === 'support') return 'support';
  if (cmd === 'commande') return 'commande';
  if (cmd === 'suivi-commandes') return 'suivi-commandes';
  if (cmd === 'collaborations') return 'collaborations';
  return null;
}

module.exports = (client) => {
  client.slashCommands = client.slashCommands || [];

  // Register commands
  const cmds = ['support', 'commande', 'suivi-commandes', 'collaborations', 'avis-ticket', 'fermer-ticket'];
  for (const cmd of cmds) {
    const descs = {
      support: 'Ouvre un ticket de support',
      commande: 'Ouvre un ticket de commande',
      'suivi-commandes': 'Ouvre un ticket de suivi de commande',
      collaborations: 'Ouvre un ticket de collaboration',
      'avis-ticket': 'Donne un avis sur un ticket (Staff)',
      'fermer-ticket': 'Ferme un ticket (Staff)',
    };
    client.slashCommands.push(new SlashCommandBuilder().setName(cmd).setDescription(descs[cmd]));
  }

  // ── Interaction handler ──
  client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
      const type = getTicketType(interaction.commandName);
      if (type) return handleOpenTicket(interaction, type);
      if (interaction.commandName === 'avis-ticket') return handleAvisTicket(interaction);
      if (interaction.commandName === 'fermer-ticket') return handleFermerTicket(interaction);
    }
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('open_ticket_')) return handleOpenTicketModal(interaction);
      if (interaction.customId === 'close_request') return handleCloseRequest(interaction);
      if (interaction.customId === 'confirm_close') return handleConfirmClose(interaction);
      if (interaction.customId === 'cancel_close') return handleCancelClose(interaction);
    }
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('ticket_modal_')) return handleTicketCreation(interaction);
      if (interaction.customId === 'avis_modal') return handleAvisSubmit(interaction);
    }
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'avis_staff_select') return handleAvisStaffSelect(interaction);
    }
  });

  // ── Step 1: Show initial embed ──
  async function handleOpenTicket(interaction, type) {
    const PUBLIC_URL = client.publicURL || 'http://localhost:' + (process.env.PORT || 3000);
    const imageMap = { support: 'umbed-support', commande: 'umbed-commande', 'suivi-commandes': 'umbed-suivi-commande', collaborations: 'umbed-collaborations' };
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`open_ticket_${type}`).setLabel('📩 Ouvrir un ticket').setStyle(ButtonStyle.Primary)
    );
    await interaction.reply({
      embeds: [{
        color: 0xFFFFFF,
        title: `🎫 Ticket ${TICKET_NAMES[type]}`,
        description: `Clique sur le bouton ci-dessous pour ouvrir un ticket **${TICKET_NAMES[type]}**.`,
        image: { url: `${PUBLIC_URL}/${imageMap[type]}.png` },
        footer: { text: 'Looters Hub', iconURL: `${PUBLIC_URL}/logo.png` },
      }],
      components: [row],
      ephemeral: false,
    });
  }

  // ── Step 2: Show modal ──
  async function handleOpenTicketModal(interaction) {
    const type = interaction.customId.replace('open_ticket_', '');
    const q = MODAL_QUESTIONS[type];
    const modal = new ModalBuilder().setCustomId(`ticket_modal_${type}`).setTitle(`Ticket ${TICKET_NAMES[type]}`);
    const input = new TextInputBuilder().setCustomId('ticket_answer').setLabel(q.split('\n')[0]).setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder(q);
    if (q.includes('\n')) input.setLabel(q.split('\n')[1] || q.split('\n')[0]);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  }

  // ── Step 3: Create ticket channel ──
  async function handleTicketCreation(interaction) {
    const type = interaction.customId.replace('ticket_modal_', '');
    const answer = interaction.fields.getTextInputValue('ticket_answer');
    const guild = interaction.guild;
    const categoryId = CATEGORIES[type];
    const category = guild.channels.cache.get(categoryId) || await guild.channels.fetch(categoryId).catch(() => null);
    if (!category) {
      const available = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).map(c => `  - ${c.name} (${c.id})`).join('\n');
      return interaction.reply({ content: `❌ Catégorie \`${categoryId}\` introuvable.\nCatégories disponibles :\n${available || 'Aucune'}`, ephemeral: true });
    }

    const channelName = `${type}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const everyoneRole = guild.roles.everyone;
    const roleIds = ROLES[type];

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites: [
        { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        ...roleIds.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
      ],
    });

    tickets[channel.id] = { opener: interaction.user.id, type, status: 'pending_rules', answer };
    saveTickets();

    await interaction.reply({ content: `✅ Ticket créé : ${channel}`, ephemeral: true });

    // Bot writes for 10 seconds
    const waitMsg = await channel.send(`📝 **Création du ticket en cours...** ${interaction.user}`);
    await new Promise(r => setTimeout(r, 10000));
    await waitMsg.delete().catch(() => {});

    // Show rules embed with reaction
    const rulesMsg = await channel.send({
      embeds: [{
        color: 0xFFFFFF,
        title: '📋 Règlement du ticket',
        description: 'Pour pouvoir échanger dans ce ticket, tu dois accepter le règlement ci-dessous en cliquant sur ✅.\n\n> ⚠️ Tout non-respect du staff peut entraîner la fermeture du ticket et des sanctions.',
        fields: [
          { name: '📝 Ta demande', value: answer },
        ],
        footer: { text: 'Looters Hub' },
      }],
    });
    await rulesMsg.react('✅');

    const filter = (reaction, user) => reaction.emoji.name === '✅' && user.id === interaction.user.id;
    try {
      await rulesMsg.awaitReactions({ filter, max: 1, time: 300000, errors: ['time'] });
      tickets[channel.id].status = 'open';
      saveTickets();
      await channel.send(`✅ **Règlement accepté !** ${interaction.user} peut maintenant échanger.`);
      await channel.send(`🔒 Pour demander la fermeture du ticket, clique ci-dessous.`);
      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_request').setLabel('🔒 Demander la fermeture').setStyle(ButtonStyle.Danger)
      );
      await channel.send({ components: [closeRow] });
    } catch {
      await channel.send('⏰ Temps écoulé. Le ticket va être fermé.');
      setTimeout(() => channel.delete().catch(() => {}), 5000);
      delete tickets[channel.id];
      saveTickets();
    }
  }

  // ── Close request ──
  async function handleCloseRequest(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('confirm_close').setLabel('✅ Confirmer').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('cancel_close').setLabel('❌ Annuler').setStyle(ButtonStyle.Secondary),
    );
    await interaction.reply({ content: '📢 **Demande de clôture** — Un fondateur va valider ou refuser.', components: [row] });
  }

  async function handleConfirmClose(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Seuls les fondateurs peuvent fermer ce ticket.', ephemeral: true });
    }
    await interaction.channel.send('🔒 **Ticket fermé.**');
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    delete tickets[interaction.channel.id];
    saveTickets();
  }

  async function handleCancelClose(interaction) {
    await interaction.reply({ content: '❌ Demande annulée.', ephemeral: true });
  }

  // ── Avis ticket ──
  async function handleAvisTicket(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé au staff.', ephemeral: true });
    }
    const PUBLIC_URL = client.publicURL || 'http://localhost:' + (process.env.PORT || 3000);

    const staffSelect = new StringSelectMenuBuilder()
      .setCustomId('avis_staff_select')
      .setPlaceholder('👤 Qui a pris en charge ?')
      .addOptions(interaction.guild.members.cache.filter(m => !m.user.bot).map(m => new StringSelectMenuOptionBuilder().setLabel(m.displayName).setValue(m.id)).slice(0, 25));

    await interaction.reply({
      embeds: [{
        color: 0xFFFFFF,
        title: '⭐ Avis sur le ticket',
        description: 'Sélectionne le membre de l\'équipe qui a pris en charge, puis remplis le formulaire.',
        image: { url: `${PUBLIC_URL}/umbed-avis-ticket.png` },
        footer: { text: 'Looters Hub', iconURL: `${PUBLIC_URL}/logo.png` },
      }],
      components: [new ActionRowBuilder().addComponents(staffSelect)],
      ephemeral: true,
    });
  }

  let avisStaffId = null;
  async function handleAvisStaffSelect(interaction) {
    avisStaffId = interaction.values[0];
    const modal = new ModalBuilder().setCustomId('avis_modal').setTitle('✍️ Donner un avis');
    const commentInput = new TextInputBuilder().setCustomId('avis_comment').setLabel('Commentaire').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(1000);
    const typeInput = new TextInputBuilder().setCustomId('avis_type').setLabel('Type de ticket (support/commande/...)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: support, commande, suivi-commandes, collaborations');
    const starsInput = new TextInputBuilder().setCustomId('avis_stars').setLabel('Note (1-5)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('1, 2, 3, 4 ou 5').setMaxLength(1);
    modal.addComponents(
      new ActionRowBuilder().addComponents(commentInput),
      new ActionRowBuilder().addComponents(typeInput),
      new ActionRowBuilder().addComponents(starsInput),
    );
    await interaction.showModal(modal);
    avisStaffId = interaction.values[0];
  }

  async function handleAvisSubmit(interaction) {
    const comment = interaction.fields.getTextInputValue('avis_comment') || 'Aucun commentaire';
    const type = interaction.fields.getTextInputValue('avis_type');
    const stars = Math.min(5, Math.max(1, parseInt(interaction.fields.getTextInputValue('avis_stars')) || 5));
    const staffMember = await interaction.guild.members.fetch(avisStaffId).catch(() => null);

    const channel = interaction.guild.channels.cache.get(REVIEW_CHANNEL);
    if (!channel) return interaction.reply({ content: '❌ Salon d\'avis introuvable.', ephemeral: true });

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
    await channel.send({
      embeds: [{
        color: 0xFFD700,
        title: '⭐ Nouvel avis',
        fields: [
          { name: '👤 Évalué par', value: `${interaction.user}`, inline: true },
          { name: '👨‍💼 Pris en charge par', value: staffMember ? `${staffMember}` : 'Inconnu', inline: true },
          { name: '🎫 Type de ticket', value: type, inline: true },
          { name: '📝 Commentaire', value: comment || 'Aucun' },
          { name: '⭐ Note', value: starStr, inline: false },
        ],
        footer: { text: 'Looters Hub' },
      }],
    });

    await interaction.reply({ content: '✅ Avis envoyé avec succès !', ephemeral: true });
    avisStaffId = null;
  }

  // ── Fermer ticket ──
  async function handleFermerTicket(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Réservé au staff.', ephemeral: true });
    }
    if (!tickets[interaction.channel.id]) {
      return interaction.reply({ content: '❌ Ce salon n\'est pas un ticket.', ephemeral: true });
    }
    await interaction.reply('🔒 **Fermeture du ticket dans 3 secondes...**');
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    delete tickets[interaction.channel.id];
    saveTickets();
  }
};

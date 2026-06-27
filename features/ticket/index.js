const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, ChannelType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { CATEGORIES, ROLES, TICKET_NAMES, REVIEW_CHANNEL } = require('./config');

const DATA_FILE = path.join(__dirname, 'tickets.json');
const LOG_CHANNEL = '1520249809267855521';
const STAFF_ROLES = [...new Set(Object.values(ROLES).flat())];
const tickets = (() => { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } })();
function saveTickets() { fs.writeFileSync(DATA_FILE, JSON.stringify(tickets)); }

function isStaff(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator) || member.roles.cache.some(r => STAFF_ROLES.includes(r.id));
}
  const channel = guild.channels.cache.get(LOG_CHANNEL) || await guild.channels.fetch(LOG_CHANNEL).catch(() => null);
  if (!channel) return;
  await channel.send({
    embeds: [{
      color: 0xFF0000,
      title: '🔒 Ticket fermé',
      fields: [
        { name: '🎫 Type', value: TICKET_NAMES[ticket?.type] || ticket?.type || 'Inconnu', inline: true },
        { name: '👤 Ouvert par', value: ticket?.opener ? `<@${ticket.opener}>` : 'Inconnu', inline: true },
        { name: '🔐 Fermé par', value: `${closedBy}`, inline: true },
        { name: '📝 Demande', value: ticket?.answer || 'Aucune' },
      ],
      timestamp: new Date(),
      footer: { text: 'Looters Hub' },
    }],
  });
}

function getTicketType(cmd) {
  if (cmd === 'support') return 'support';
  if (cmd === 'commande') return 'commande';
  if (cmd === 'suivi-commandes') return 'suivi-commandes';
  if (cmd === 'collaborations') return 'collaborations';
  return null;
}

module.exports = (client) => {
  client.slashCommands = client.slashCommands || [];

  const cmds = ['support', 'commande', 'suivi-commandes', 'collaborations', 'avis-ticket', 'fermer-ticket'];
  const descs = {
    support: 'Ouvre un ticket de support',
    commande: 'Ouvre un ticket de commande',
    'suivi-commandes': 'Ouvre un ticket de suivi de commande',
    collaborations: 'Ouvre un ticket de collaboration',
    'avis-ticket': 'Donne un avis sur un ticket (Staff)',
    'fermer-ticket': 'Ferme un ticket (Staff)',
  };
  for (const cmd of cmds) {
    client.slashCommands.push(new SlashCommandBuilder().setName(cmd).setDescription(descs[cmd]));
  }

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
    }
    if (interaction.isStringSelectMenu()) {
    }
  });

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

  async function handleOpenTicketModal(interaction) {
    const type = interaction.customId.replace('open_ticket_', '');

    if (type === 'support') {
      const modal = new ModalBuilder().setCustomId('ticket_modal_support').setTitle('Ticket Support');
      const q = new TextInputBuilder().setCustomId('ticket_answer').setLabel('Quelle est votre demande ?').setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder('Décrivez votre demande en détail...');
      modal.addComponents(new ActionRowBuilder().addComponents(q));
      return await interaction.showModal(modal);
    }

    if (type === 'commande') {
      const modal = new ModalBuilder().setCustomId('ticket_modal_commande').setTitle('Ticket Commande');
      const nom = new TextInputBuilder().setCustomId('ticket_nom').setLabel('Nom et Prénom').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: Jean Dupont');
      const produits = new TextInputBuilder().setCustomId('ticket_produits').setLabel('Numéro du ou des produits').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: #1234, #5678');
      modal.addComponents(new ActionRowBuilder().addComponents(nom), new ActionRowBuilder().addComponents(produits));
      return await interaction.showModal(modal);
    }

    if (type === 'suivi-commandes') {
      const modal = new ModalBuilder().setCustomId('ticket_modal_suivi-commandes').setTitle('Ticket Suivi de Commande');
      const nom = new TextInputBuilder().setCustomId('ticket_nom').setLabel('Nom et Prénom').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: Jean Dupont');
      const suivi = new TextInputBuilder().setCustomId('ticket_suivi').setLabel('Numéro de suivi de commande').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: COL-2024-001');
      modal.addComponents(new ActionRowBuilder().addComponents(nom), new ActionRowBuilder().addComponents(suivi));
      return await interaction.showModal(modal);
    }

    if (type === 'collaborations') {
      const modal = new ModalBuilder().setCustomId('ticket_modal_collaborations').setTitle('Ticket Collaboration');
      const nom = new TextInputBuilder().setCustomId('ticket_nom').setLabel('Nom et Prénom').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Ex: Jean Dupont');
      const desc = new TextInputBuilder().setCustomId('ticket_description').setLabel('Description de la demande').setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder('Décrivez votre demande de collaboration...');
      modal.addComponents(new ActionRowBuilder().addComponents(nom), new ActionRowBuilder().addComponents(desc));
      return await interaction.showModal(modal);
    }
  }

  function getAnswer(interaction, type) {
    if (type === 'support') return interaction.fields.getTextInputValue('ticket_answer');
    const nom = interaction.fields.getTextInputValue('ticket_nom');
    if (type === 'commande') return `${nom}\nProduits : ${interaction.fields.getTextInputValue('ticket_produits')}`;
    if (type === 'suivi-commandes') return `${nom}\nSuivi : ${interaction.fields.getTextInputValue('ticket_suivi')}`;
    if (type === 'collaborations') return `${nom}\n\n${interaction.fields.getTextInputValue('ticket_description')}`;
    return '';
  }

  async function handleTicketCreation(interaction) {
    const type = interaction.customId.replace('ticket_modal_', '');
    const answer = getAnswer(interaction, type);
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
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
        ...roleIds.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
      ],
    });

    tickets[channel.id] = { opener: interaction.user.id, type, status: 'pending_rules', answer };
    saveTickets();

    await interaction.reply({ content: `✅ Ticket créé : ${channel}`, ephemeral: true });

    const typingInterval = setInterval(() => channel.sendTyping().catch(() => {}), 5000);
    const waitMsg = await channel.send(`📝 **Création du ticket en cours...** ${interaction.user}`);
    await new Promise(r => setTimeout(r, 10000));
    clearInterval(typingInterval);
    await waitMsg.delete().catch(() => {});

    const rulesMsg = await channel.send({
      embeds: [{
        color: 0xFFFFFF,
        title: '📋 Règlement du ticket',
        description: 'Pour pouvoir échanger dans ce ticket, tu dois accepter le règlement ci-dessous en cliquant sur ✅.\n\n> ⚠️ Tout non-respect du staff peut entraîner la fermeture du ticket et des sanctions.',
        fields: [{ name: '📝 Ta demande', value: answer }],
        footer: { text: 'Looters Hub' },
      }],
    });
    await rulesMsg.react('✅');

    const filter = (reaction, user) => reaction.emoji.name === '✅' && user.id === interaction.user.id;
    try {
      await rulesMsg.awaitReactions({ filter, max: 1, time: 300000, errors: ['time'] });
      tickets[channel.id].status = 'open';
      saveTickets();
      await channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: true });
      await channel.send(`✅ **Règlement accepté !** ${interaction.user} peut maintenant échanger.`);
      await channel.send(`🔒 Pour demander la fermeture du ticket, clique ci-dessous.`);
      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_request').setLabel('🔒 Demander la fermeture').setStyle(ButtonStyle.Danger)
      );
      await channel.send({ components: [closeRow] });
    } catch {
      await channel.send('⏰ Temps écoulé. Le ticket va être fermé.');
      await sendLog(interaction.guild, tickets[channel.id], interaction.user);
      await channel.delete().catch(() => {});
      delete tickets[channel.id];
      saveTickets();
    }
  }

  async function handleCloseRequest(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('confirm_close').setLabel('✅ Confirmer').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('cancel_close').setLabel('❌ Annuler').setStyle(ButtonStyle.Secondary),
    );
    await interaction.reply({ content: '📢 **Demande de clôture** — Un fondateur va valider ou refuser.', components: [row] });
  }

  async function handleConfirmClose(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Seuls les fondateurs peuvent fermer ce ticket.', ephemeral: true });
    }
    await interaction.channel.send('🔒 **Ticket fermé.**');
    await sendLog(interaction.guild, tickets[interaction.channel.id], interaction.user);
    await interaction.channel.delete().catch(() => {});
    delete tickets[interaction.channel.id];
    saveTickets();
  }

  async function handleCancelClose(interaction) {
    await interaction.reply({ content: '❌ Demande annulée.', ephemeral: true });
  }

  // ── Avis ticket (staff déclenche, membre répond) ──
  async function handleAvisTicket(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Réservé au staff.', ephemeral: true });
    }
    if (!tickets[interaction.channel.id]) {
      return interaction.reply({ content: '❌ Utilise cette commande dans un salon de ticket.', ephemeral: true });
    }

    const ticket = tickets[interaction.channel.id];
    const PUBLIC_URL = client.publicURL || 'http://localhost:' + (process.env.PORT || 3000);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('avis_open').setLabel('⭐ Donner mon avis').setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: `<@${ticket.opener}> Le staff souhaite connaître votre avis sur ce ticket. Cliquez sur le bouton ci-dessous pour répondre !`,
      embeds: [{
        color: 0xFFFFFF,
        title: '⭐ Avis sur le ticket',
        image: { url: `${PUBLIC_URL}/umbed-avis-ticket.png` },
        footer: { text: 'Looters Hub', iconURL: `${PUBLIC_URL}/logo.png` },
      }],
      components: [row],
    });
  }

  // ── Le membre clique sur le bouton d'avis ──
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() || interaction.customId !== 'avis_open') return;
    const ticket = tickets[interaction.channel.id];
    if (!ticket || interaction.user.id !== ticket.opener) {
      return interaction.reply({ content: '❌ Seul l\'ouvreur du ticket peut donner son avis.', ephemeral: true });
    }

    const members = new Set();
    members.add(ticket.opener);
    for (const [id, overwrite] of interaction.channel.permissionOverwrites.cache) {
      if (overwrite.type === 1) members.add(id);
      if (overwrite.type === 0 && ROLES[ticket.type]?.includes(id)) {
        const role = interaction.guild.roles.cache.get(id);
        if (role) role.members.forEach(m => members.add(m.id));
      }
    }

    const options = [];
    for (const id of members) {
      const member = await interaction.guild.members.fetch(id).catch(() => null);
      if (member && !member.user.bot && options.length < 25) {
        options.push(new StringSelectMenuOptionBuilder().setLabel(member.displayName).setValue(member.id));
      }
    }
    if (!options.length) return interaction.reply({ content: '❌ Aucun membre à évaluer.', ephemeral: true });

    const staffSelect = new StringSelectMenuBuilder()
      .setCustomId('avis_staff_select')
      .setPlaceholder('👤 Qui vous a pris en charge ?')
      .addOptions(options);
    await interaction.reply({ components: [new ActionRowBuilder().addComponents(staffSelect)], ephemeral: true });
  });

  // ── Sélection du staff et modal ──
  let avisStaffId = null;
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'avis_staff_select') return;
    avisStaffId = interaction.values[0];
    const modal = new ModalBuilder().setCustomId('avis_modal').setTitle('⭐ Votre avis');
    const commentInput = new TextInputBuilder().setCustomId('avis_comment').setLabel('Commentaire').setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(1000).setPlaceholder('Partagez votre expérience...');
    const starsInput = new TextInputBuilder().setCustomId('avis_stars').setLabel('Note (1 à 5)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('1, 2, 3, 4 ou 5').setMaxLength(1);
    modal.addComponents(new ActionRowBuilder().addComponents(commentInput), new ActionRowBuilder().addComponents(starsInput));
    await interaction.showModal(modal);
  });

  // ── Soumission de l'avis ──
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit() || interaction.customId !== 'avis_modal') return;
    const comment = interaction.fields.getTextInputValue('avis_comment') || 'Aucun commentaire';
    const stars = Math.min(5, Math.max(1, parseInt(interaction.fields.getTextInputValue('avis_stars')) || 5));
    const staffMember = await interaction.guild.members.fetch(avisStaffId).catch(() => null);
    const ticket = tickets[interaction.channel.id];

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
          { name: '🎫 Type de ticket', value: TICKET_NAMES[ticket?.type] || ticket?.type || 'Inconnu', inline: true },
          { name: '📝 Commentaire', value: comment },
          { name: '⭐ Note', value: starStr, inline: false },
        ],
        footer: { text: 'Looters Hub' },
      }],
    });

    await interaction.reply({ content: '✅ Merci pour votre avis !', ephemeral: true });
    avisStaffId = null;
  });

  async function handleFermerTicket(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: '❌ Réservé au staff.', ephemeral: true });
    }
    if (!tickets[interaction.channel.id]) {
      return interaction.reply({ content: '❌ Ce salon n\'est pas un ticket.', ephemeral: true });
    }
    await interaction.reply('🔒 **Ticket fermé.**');
    await sendLog(interaction.guild, tickets[interaction.channel.id], interaction.user);
    await interaction.channel.delete().catch(() => {});
    delete tickets[interaction.channel.id];
    saveTickets();
  }
};

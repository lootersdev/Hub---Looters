const { PermissionFlagsBits } = require('discord.js');

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const args = message.content.split(' ');
    if (args[0].toLowerCase() !== '!clear') return;

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
  });
};

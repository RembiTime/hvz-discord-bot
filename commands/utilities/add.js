const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Adds a blaster to the database')
        .addStringOption(option =>
            option.setName('name')
            .setDescription("Ex: Nerf Rival Vision | Make sure to include brand name!")
            .setRequired(true)),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
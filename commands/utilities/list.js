const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Gets a list of blasters in each type'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
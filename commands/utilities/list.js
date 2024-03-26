const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Sends the link for the list of approved blasters'),
	async execute(interaction) {
		await interaction.reply('You can view the list of approved blasters [here](https://docs.google.com/spreadsheets/d/10gH9vVnkVrY0KNtVYeRJXuE_PEPQlUAJmX127kiV3DA).');
	},
};
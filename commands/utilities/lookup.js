const { SlashCommandBuilder } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('lookup')
		.setDescription('Checks if a blaster has been approved')
		.addStringOption(option =>
			option.setName('name')
			.setDescription('The name of the blaster to look up')
			.setRequired(true)
			.setAutocomplete(true)),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
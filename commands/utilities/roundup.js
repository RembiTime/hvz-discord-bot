const { SlashCommandBuilder } = require('discord.js');
const lib = require("../../lib.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roundup')
		.setDescription('Gets the roundup of unanswered blaster requests'),
	async execute(interaction) {
		await interaction.reply({embeds: [(await lib.getPendingRequests())]});
	},
};
const { SlashCommandBuilder } = require('discord.js');
const lib = require("../../lib.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roundup')
		.setDescription('Gets the roundup of unanswered blaster requests'),
	async execute(interaction) {
        const roundup = await lib.getPendingRequests();
        if (roundup === false) {
            await interaction.reply("Nothing left to check, congrats!")
        } else {
            await interaction.reply({embeds: [roundup]});
        }
		
	},
};
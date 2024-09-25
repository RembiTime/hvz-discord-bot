const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require("fs")
const lib = require("../../lib.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lookup')
		.setDescription('Checks if a blaster has been approved')
		.addStringOption(option =>
			option.setName('name')
			.setDescription('The name of the blaster to look up')
			.setRequired(true)
			.setAutocomplete(true))
		.addBooleanOption(option =>
			option.setName('public')
			.setDescription('If the output should display to other players (default is no)')
			.setRequired(false)),
	async autocomplete(interaction) {
		await interaction.respond(
            lib.autocompleteSearch(interaction),
        );
	},
	async execute(interaction) {
		let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
		let db = JSON.parse(dbJSON);
		const blaster = db.find((blast) => blast.name.toLowerCase() == interaction.options.getString('name').toLowerCase());
		if (blaster == undefined) {
			await interaction.reply('**' + interaction.options.getString('name') + '** was not found in the database. Please use \`\/check blaster\` to get it approved!')
		} else {
			switch (blaster.tier) {
				case -1: await interaction.reply({content: 'The **' + blaster.name + '** is currently pending review. Please check back later.', ephemeral: !interaction.options.getBoolean('public') ?? true}); break;
				case 1: await interaction.reply({content: 'The **' + blaster.name + '** has been **approved** for play. It can be used any time.', ephemeral: !interaction.options.getBoolean('public') ?? true}); break;
				case 2: await interaction.reply({content: 'The **' + blaster.name + '** has been **approved** for play. It can be used any time.', ephemeral: !interaction.options.getBoolean('public') ?? true}); break;
				case 3: await interaction.reply({content: 'The **' + blaster.name + '** has been **banned** from play. It can **not** be used for Humans vs. Zombies.', ephemeral: !interaction.options.getBoolean('public') ?? true}); break;
				case 4: await interaction.reply({content: 'The **' + blaster.name + '** is a **BANNED** blaster. It can **not** be used for Humans vs. Zombies.', ephemeral: !interaction.options.getBoolean('public') ?? true}); break;
				default: await interaction.reply({content: 'Something went wrong. Please contact someone.', ephemeral: true}); break;
			}
		} 
	},
};
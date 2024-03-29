const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require("fs")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lookup')
		.setDescription('Checks if a blaster has been approved')
		.addStringOption(option =>
			option.setName('name')
			.setDescription('The name of the blaster to look up')
			.setRequired(true)
			.setAutocomplete(true)),
	async autocomplete(interaction) {
		let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
		let db = JSON.parse(dbJSON);
		const focusedValue = interaction.options.getFocused();
		const choices = db.map((blaster) => blaster.name);
		const splitWords = focusedValue.split(" ")
		let filtered = choices.filter(x => splitWords.every(word => x.toLowerCase().includes(word.toLowerCase())));
		//const filtered = choices.filter(choice => choice.split(" ").forEach((blastWord) => blastWord.startsWith(focusedValue)));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
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
				case -1: await interaction.reply('The **' + blaster.name + '** is currently pending review. Please check back later.'); break;
				case 1: await interaction.reply('The **' + blaster.name + '** is a tier **1** blaster. It can be used any time.'); break;
				case 2: await interaction.reply('The **' + blaster.name + '** is a tier **2** blaster. It can only be used during missions.'); break;
				case 3: await interaction.reply('The **' + blaster.name + '** is a tier **3** blaster. It can **not** be used for Humans vs. Zombies.'); break;
				case 4: await interaction.reply('The **' + blaster.name + '** is a **BANNED** blaster. It can **not** be used for Humans vs. Zombies.'); break;
				default: await interaction.reply('Something went wrong. Please contact someone.'); break;
			}
		} 
	},
};
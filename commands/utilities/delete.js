const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require("fs")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
		.setDescription('Deletes a blaster to the database')
        .addStringOption(option =>
            option.setName('name')
            .setDescription("Ex: Nerf Rival Vision | Make sure to include brand name!")
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
        const existCheck = db.findIndex((blast) => blast.name.toLowerCase() == interaction.options.getString('name').toLowerCase());
        if (existCheck == -1) {
            await interaction.reply('**' + interaction.options.getString('name') + '** is not in the database.');
        }
        
		oldBlaster = db[existCheck].name;
		db.splice(existCheck, 1)
		dbJSON = JSON.stringify(db, null, 4);
		fs.writeFileSync(process.env.BLASTER_DB_FILE, dbJSON, "utf-8");
		console.log("Deleted " + oldBlaster + ".");

        await interaction.reply('Successfully deleted **' + oldBlaster + '**!');
	},
};
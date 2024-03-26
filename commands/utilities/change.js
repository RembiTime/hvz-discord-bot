const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require("fs")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('change')
		.setDescription('Changes the tier of a blaster')
        .addStringOption(option =>
            option.setName('name')
            .setDescription("Ex: Nerf Rival Vision | Make sure to include brand name!")
            .setRequired(true)
            .setAutocomplete(true))
        .addIntegerOption(option =>
            option.setName('tier')
            .setDescription("Blaster tier to change to (4 is for banned blasters)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(4)),
    async autocomplete(interaction) {
        let dbJSON = fs.readFileSync(process.env.DB_FILE);
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
        let dbJSON = fs.readFileSync(process.env.DB_FILE);
        let db = JSON.parse(dbJSON);
        const existCheck = db.findIndex((blast) => blast.name.toLowerCase() == interaction.options.getString('name').toLowerCase());
        if (existCheck != -1) {
            if (db[existCheck].tier != interaction.options.getInteger('tier')) {
                oldTier = db[existCheck].tier;
                db[existCheck].tier = interaction.options.getInteger('tier');
                dbJSON = JSON.stringify(db, null, 4);
                fs.writeFileSync(process.env.DB_FILE, dbJSON, "utf-8");
                await interaction.reply('Updated **' + db[existCheck].name + '** from tier **' + oldTier + '** to tier **' + interaction.options.getInteger('tier') + '**!');
            } else {
                await interaction.reply('**' + db[existCheck].name + '** is already in the database as a tier **' + interaction.options.getInteger('tier') + '** blaster!');
            }
            return;
        } else {
            await interaction.reply('**' + interaction.options.getString('name') + '** is not in the database! Try adding it with \`\/add\`!');
        }
	},
};
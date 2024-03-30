const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require("fs")
const lib = require("../../lib.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('change')
		.setDescription('Changes the tier of a blaster')
        .addSubcommand(subcommand =>
            subcommand
                .setName('tier')
                .setDescription('Changes blaster tier')
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
                    .setMaxValue(4)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('name')
                .setDescription('Changes blaster name')
                .addStringOption(option =>
                    option.setName('name')
                    .setDescription("Old blaster name")
                    .setRequired(true)
                    .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('new_name')
                    .setDescription("Name to change to")
                    .setRequired(true))),
    async autocomplete(interaction) {
        await interaction.respond(
            lib.autocompleteSearch(interaction),
        );
    },
	async execute(interaction) {
        let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
        let db = JSON.parse(dbJSON);
        const index = db.findIndex((blast) => blast.name.toLowerCase() == interaction.options.getString('name').trim().toLowerCase());
        if (index == -1) {
            await interaction.reply({content: '**' + interaction.options.getString('name') + '** is not in the database! Try adding it with \`\/add\`!', ephemeral: true});
            return;
        }
        if (interaction.options.getSubcommand() == 'tier') {
            if (db[index].tier != interaction.options.getInteger('tier')) {
                oldTier = db[index].tier;
                db[index].tier = interaction.options.getInteger('tier');
                dbJSON = JSON.stringify(db, null, 4);
                fs.writeFileSync(process.env.BLASTER_DB_FILE, dbJSON, "utf-8");
                await interaction.reply('Updated **' + db[index].name + '** from tier **' + oldTier + '** to tier **' + interaction.options.getInteger('tier') + '**!');
            } else {
                await interaction.reply({content: '**' + db[index].name + '** is already in the database as a tier **' + interaction.options.getInteger('tier') + '** blaster!', ephemeral: true});
            }
        } else if (interaction.options.getSubcommand() == 'name') {
            const existCheck = db.findIndex((blast) => blast.name.toLowerCase() == interaction.options.getString('new_name').trim().toLowerCase());
            if (existCheck != -1) {
                await interaction.reply({content: '**' + db[existCheck].name + '** is already in the database as a tier **' + db[existCheck].tier + '** blaster!', ephemeral: true});
                return;
            }
            oldName = db[index].name;
            db[index].name = interaction.options.getString('new_name');
            dbJSON = JSON.stringify(db, null, 4);
            fs.writeFileSync(process.env.BLASTER_DB_FILE, dbJSON, "utf-8");
            await interaction.reply('Updated to **' + db[index].name + '** from **' + oldName + '**!');
        }
	},
};
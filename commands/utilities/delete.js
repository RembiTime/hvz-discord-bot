const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require("fs")
const lib = require("../../lib.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
		.setDescription('Deletes a blaster/mod from the database')
        .addSubcommand(subcommand =>
            subcommand
            .setName('blaster')
            .setDescription("Deletes a blaster from the database")
            .addStringOption(option =>
                option.setName('name')
                .setDescription("Ex: Nerf Rival Vision | Make sure to include brand name!")
                .setRequired(true)
                .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
            .setName('modification')
            .setDescription("Deletes a modification from the database")
            .addStringOption(option =>
                option.setName('case_id')
                .setDescription("Case ID of person with modification")
                .setRequired(true)
                .setAutocomplete(true))
            .addIntegerOption(option =>
                option.setName('index')
                .setDescription("Index of modification (starts at 0 from first to last)")
                .setRequired(true))),
    async autocomplete(interaction) {
        if (interaction.options.getSubcommand() == 'blaster') {
            await interaction.respond(
                lib.autocompleteSearch(interaction),
            );
        } else if (interaction.options.getSubcommand() == 'modification') {
            await interaction.respond(
                lib.autocompleteCaseID(interaction)
            );
        }
    },
	async execute(interaction) {
        if (interaction.options.getSubcommand() == 'blaster') {
            let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
            let db = JSON.parse(dbJSON);
            const existCheck = db.findIndex((blast) => blast.name.toLowerCase() == interaction.options.getString('name').toLowerCase());
            if (existCheck == -1) {
                await interaction.reply({content: '**' + interaction.options.getString('name') + '** is not in the database.', ephemeral: true});
            }
            
            oldBlaster = db[existCheck].name;
            db.splice(existCheck, 1)
            dbJSON = JSON.stringify(db, null, 4);
            fs.writeFileSync(process.env.BLASTER_DB_FILE, dbJSON, "utf-8");
            console.log("Deleted " + oldBlaster + ".");

            await interaction.reply('Successfully deleted **' + oldBlaster + '**!');

        } else if (interaction.options.getSubcommand() == 'modification') {
            let dbJSON = fs.readFileSync(process.env.MOD_DB_FILE);
            let db = JSON.parse(dbJSON);
            const existCheck = db.filter((blast) => blast.caseID.toLowerCase() == interaction.options.getString('case_id').toLowerCase());
            if (existCheck.length === 0) {
                await interaction.reply('Case ID **' + interaction.options.getString('case_id') + '** was not found in the database!');
                return;
            } else if (existCheck.length <= interaction.options.getInteger('index')) {
                await interaction.reply({content: 'Index **' + interaction.options.getInteger('index') + '** is out of bounds!', ephemeral: true});
                return;
            }

            const index = db.findIndex((blast) => blast.description === existCheck[interaction.options.getInteger('index')].description && blast.caseID.toLowerCase() === interaction.options.getString('case_id').toLowerCase());
            
            oldDesc = db[index].description;
            oldImg = db[index].image !== "" ? "[[image link]](<" + db[index].image + ">)" : "";
            db.splice(index, 1)
            dbJSON = JSON.stringify(db, null, 4);
            fs.writeFileSync(process.env.MOD_DB_FILE, dbJSON, "utf-8");
            
            console.log("Deleted the modification with the description \"" + oldDesc + "\". " + oldImg + "");
            await interaction.reply("Deleted the modification with the description \"" + oldDesc + "\". " + oldImg);
        }
	},
};
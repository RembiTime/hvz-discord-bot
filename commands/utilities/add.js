const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require("fs")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Adds a blaster/mod to the database')
        .addSubcommand(subcommand =>
            subcommand
                .setName('blaster')
                .setDescription('Adds a blaster to the database')
                .addStringOption(option =>
                    option.setName('name')
                    .setDescription("Ex: Nerf Rival Vision | Make sure to include brand name!")
                    .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('tier')
                    .setDescription("Blaster tier (4 is for banned blasters)")
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(4))
                .addAttachmentOption(option => 
                    option.setName('image')
                    .setDescription('Blaster image')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('modification')
                .setDescription('Adds a mod to the database')
                .addStringOption(option =>
                    option.setName('case_id')
                    .setDescription('The player\'s case ID')
                    .setRequired(true)
                    .setMinLength(3)
                    .setMaxLength(7))
                .addStringOption(option =>
                    option.setName('description')
                    .setDescription("Description of modifications")
                    .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('tier')
                    .setDescription("Blaster tier (4 is for banned blasters)")
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(4))
                .addAttachmentOption(option => 
                    option.setName('image')
                    .setDescription('Blaster image'))),
	async execute(interaction) {
        var img = interaction.options.getAttachment('image') ?? "";
        if (img != "" && img.contentType != "image/gif" && img.contentType != "image/jpeg" && img.contentType != "image/png") {
            await interaction.reply('Please submit an *image* of your blaster!');
            return;
        } else if (img != "") {
            img = img.url;
        }

        let dbJSON;
        let db;
        let toAdd;
        const date = new Date();

        if (interaction.options.getSubcommand() === "blaster") {
            dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
            db = JSON.parse(dbJSON);
            const existCheck = db.findIndex((blast) => blast.name.toLowerCase() == interaction.options.getString('name').trim().toLowerCase());
            if (existCheck != -1) {
                if (db[existCheck].tier != interaction.options.getInteger('tier')) {
                    await interaction.reply({content: '**' + db[existCheck].name + '** is already in the database as a tier **' + db[existCheck].tier + '** blaster! If you\'d like to change its tier to ' + interaction.options.getInteger('tier') + ', use the \`\/change tier\` command.', ephemeral: true});
                } else {
                    await interaction.reply({content: '**' + db[existCheck].name + '** is already in the database as a tier **' + db[existCheck].tier + '** blaster!', ephemeral: true});
                }
                return;
            }

            toAdd = {
                "name":interaction.options.getString('name').trim(),
                "tier":interaction.options.getInteger('tier'), 
                "caseID":"core", 
                "userID":interaction.user.id, 
                "messageID":"", 
                "date": (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear(),
                "image": img
            }

            db.push(toAdd);
            dbJSON = JSON.stringify(db, null, 4);
            fs.writeFileSync(process.env.BLASTER_DB_FILE, dbJSON, "utf-8");

            console.log('Successfully added **' + interaction.options.getString('name') + '** as a tier **' + interaction.options.getInteger('tier') + '** blaster!')
            await interaction.reply('Successfully added **' + interaction.options.getString('name') + '** as a tier **' + interaction.options.getInteger('tier') + '** blaster!');

        } else if (interaction.options.getSubcommand() === "modification") {
            dbJSON = fs.readFileSync(process.env.MOD_DB_FILE);
            db = JSON.parse(dbJSON);

            toAdd = {
                "description":interaction.options.getString('description').trim(),
                "tier":interaction.options.getInteger('tier'), 
                "caseID":interaction.options.getString('case_id').trim().toLowerCase(), 
                "userID":interaction.user.id, 
                "messageID":"", 
                "date": (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear(),
                "image": img
            }

            db.push(toAdd);
            dbJSON = JSON.stringify(db, null, 4);
            fs.writeFileSync(process.env.MOD_DB_FILE, dbJSON, "utf-8");

            console.log('Successfully added **' + interaction.options.getString('case_id') + '\'s** modification as a tier **' + interaction.options.getInteger('tier') + '**!')
            await interaction.reply('Successfully added **' + interaction.options.getString('case_id') + '\'s** modification as a tier **' + interaction.options.getInteger('tier') + '**!');
        }
	},
};
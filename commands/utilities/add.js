const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require("fs")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
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
            .setMaxValue(4)),
	async execute(interaction) {
        let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
        let db = JSON.parse(dbJSON);
        const existCheck = db.findIndex((blast) => blast.name.toLowerCase() == interaction.options.getString('name').toLowerCase());
        if (existCheck != -1) {
            if (db[existCheck].tier != interaction.options.getInteger('tier')) {
                await interaction.reply('**' + db[existCheck].name + '** is already in the database as a tier **' + db[existCheck].tier + '** blaster! If you\'d like to change its tier to ' + interaction.options.getInteger('tier') + ', use the \`\/change tier\` command.');
            } else {
                await interaction.reply('**' + db[existCheck].name + '** is already in the database as a tier **' + db[existCheck].tier + '** blaster!');
            }
            return;
        }
        const date = new Date();
        let toAdd = {
            "name":interaction.options.getString('name'),
            "tier":interaction.options.getInteger('tier'), 
            "caseid":"core", 
            "userID":interaction.user.id, 
            "messageID":"", 
            "date": (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear()
        }

        db.push(toAdd);
        dbJSON = JSON.stringify(db, null, 4);
        fs.writeFileSync(process.env.BLASTER_DB_FILE, dbJSON, "utf-8");
        await interaction.reply('Successfully added **' + interaction.options.getString('name') + '** as a tier **' + interaction.options.getInteger('tier') + '** blaster!');
	},
};
const { SlashCommandBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('node:fs');
const approvalChannelID = '1222008392583745588';
const lib = require("../../lib.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('force')
		.setDescription('Forces a decision on a message')
        .addStringOption(option =>
            option.setName('messageid')
            .setDescription('The message ID to force')
            .setRequired(true)
            .setMinLength(16)
            .setMaxLength(19))
        .addIntegerOption(option =>
            option.setName('tier')
            .setDescription("Blaster tier to change to (4 is for banned blasters, 5 is delete)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(5))
        .addBooleanOption(option =>
            option.setName('conditional')
            .setDescription("Sets it as a conditional decision")),
	async execute(interaction) {
		let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
        let modJSON = fs.readFileSync(process.env.MOD_DB_FILE);
        let db = JSON.parse(dbJSON);
        let mod = JSON.parse(modJSON);
        let msgID = interaction.options.getString('messageid');
        let msg = await interaction.guild.channels.cache.get(approvalChannelID).messages.fetch(msgID);
        const msgs = db.filter((blaster) => blaster.tier == -1).map((blaster) => blaster.messageID).concat(mod.filter((blaster) => blaster.tier == -1).map((blaster) => blaster.messageID));
        if (msgs.includes(msgID)) {
            let inBlastDB = true;
            let goToDB = db;
            let index = db.findIndex((blast) => blast.messageID == msgID);
            if (index == -1) {
                inBlastDB = false;
                index = mod.findIndex((blast) => blast.messageID == msgID);
                goToDB = mod;
            } 
            let author = interaction.guild.members.cache.get(goToDB[index].userID);

            lib.decisionReached(msg, inBlastDB, goToDB, index, author, interaction.options.getInteger('tier'), interaction.options.getBoolean('conditional') ?? false);
            
            console.log(interaction.user.tag + " used the force command on " + interaction.options.getString('messageid'));
            await interaction.reply("Done!")
        } else {
            await interaction.reply('The message ID was not found as pending.');
        }
	},
};
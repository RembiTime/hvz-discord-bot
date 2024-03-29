const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require("fs")

let coreRoleID = '585598775805083660'

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mods')
		.setDescription('Gets a list of modifications based on Case ID')
        .addStringOption(option =>
            option.setName('case_id')
            .setDescription('Your case ID')
            .setMinLength(3)
            .setMaxLength(7)
            .setAutocomplete(true)),
        async autocomplete(interaction) {
            let modJSON = fs.readFileSync(process.env.MOD_DB_FILE);
            let mod = JSON.parse(modJSON);
            const focusedValue = interaction.options.getFocused();
            const choices = mod.map((blaster) => blaster.caseID);
            const filtered = choices.filter(choice => choice.startsWith(focusedValue)).filter((value, index) => choices.indexOf(value) == index);
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: choice })),
            );
        },
	async execute(interaction) {
        let modJSON = fs.readFileSync(process.env.MOD_DB_FILE);
		let mod = JSON.parse(modJSON);
		let id = interaction.options.getString('case_id') ?? "";
        let mods = [];
        let output = ""

        if (id != "" && !interaction.member.roles.cache.has(coreRoleID)) {
            output = "Only core can look up other people's modifications. Here's your's though:"
            id = ""
        }

        const embed = new EmbedBuilder()

        if (id == "") {
            embed.setTitle('Your modifications');
            mods = mod.filter(blaster => blaster.userID == interaction.user.id);
        } else {
            embed.setTitle(id + '\'s modifications')
            mods = mod.filter(blaster => blaster.caseID.toLowerCase() == id.toLowerCase());
        }

        if (mods.length == 0) {
            embed.setDescription('No modifications found!');
        } else {
            mods.forEach(blaster => {
                let tier = "";
                if (blaster.tier == 4) {
                    tier = "DENIED";
                }  else if (blaster.tier == -1) {
                    tier = "Pending";
                } else {
                    tier = "Approved Tier " + blaster.tier;
                }
                embed.addFields({ name: tier, value: blaster.description + " [[image link]](" + blaster.image + ")"});
            });
        }

        await interaction.reply({content: output, embeds: [embed]});
	},
};
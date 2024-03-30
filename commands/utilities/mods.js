const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require("fs")
const lib = require("../../lib.js");

let coreRoleID = process.env.CORE_ROLE_ID;

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
            await interaction.respond(
                lib.autocompleteCaseID(interaction)
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
                const img = blaster.image !== "" ? " [[image link]](" + blaster.image + ")" : "";
                embed.addFields({ name: tier, value: blaster.description + img});
            });
        }
        embed.setColor("#a652bb");

        await interaction.reply({content: output, embeds: [embed]});
	},
};
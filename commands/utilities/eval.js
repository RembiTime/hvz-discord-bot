const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { inspect } = require("util");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('eval')
		.setDescription('Executes a JavaScript command')
        .addStringOption(option =>
            option.setName('code')
            .setDescription("Code to execute")
            .setRequired(true)),
        async execute(interaction) {
            let toEval = interaction.options.getString("code").replace(/[“”]/g, '"')
            console.log(interaction.user.tag + " used the eval command \`" + toEval +"\`")
            try {
                const embed = new EmbedBuilder()
                    .setTitle("EVAL")
                    .setDescription("❌ Error: `Cannot evaluate nothing`")
                    .setThumbnail(interaction.member.user.displayAvatarURL())
                    .setFooter({text: interaction.member.user.tag})
                let evaluated = inspect(eval(toEval, {
                    depth: 0
                }))
                if (!toEval) return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                const embed1 = new EmbedBuilder()
                    .setTitle("EVAL")
                    .setDescription("❌ Error: `Request is too long.`")
                    .setThumbnail(interaction.member.user.displayAvatarURL())
                    .setFooter({text: interaction.member.user.tag})
    
                if (evaluated.length > 1950) return interaction.reply({
                    embeds: [embed1],
                    ephemeral: true
                });
                let hrDiff = process.hrtime(process.hrtime());
                const embed2 = new EmbedBuilder()
                    .setTitle("EVAL")
                    .setDescription(`Executed in ${hrDiff[0] > 0 ? `${hrDiff[0]}s` : ''}${hrDiff[1] / 1000000}ms.*\`\`\`javascript\n${evaluated}\n\`\`\``)
                    .setThumbnail(interaction.member.user.displayAvatarURL())
                    .setFooter({text: interaction.member.user.tag})
                interaction.reply({
                    embeds: [embed2],
                    ephemeral: true
                })
            } catch (e) {
                interaction.reply({
                    content: `An error occurred : \`${e.message}\``,
                    ephemeral: true
                });
            }
    
        },
};
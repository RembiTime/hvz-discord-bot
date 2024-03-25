const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Submits a request to check a blaster')
        .addSubcommand(subcommand =>
            subcommand
                .setName('blaster')
                .setDescription('Submits a request to check a blaster type')
                .addStringOption(option =>
                    option.setName('case_id')
                    .setDescription('Your case ID')
                    .setRequired(true)
                    .setMinLength(4)
                    .setMaxLength(7))
                .addStringOption(option => 
                    option.setName('blaster_name')
                    .setDescription('Ex: Nerf Rival Vision | Make sure to include brand name!')
                    .setRequired(true))
                .addAttachmentOption(option => 
                    option.setName('blaster_image')
                    .setDescription('Example image of your blaster type (can be one found online)')
                    .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('modifications')
                .setDescription('Submits a request to check a blaster with modifications')
                .addStringOption(option =>
                    option.setName('case_id')
                    .setDescription('Your case ID')
                    .setRequired(true)
                    .setMinLength(4)
                    .setMaxLength(7))
                .addStringOption(option =>
                    option.setName('mod_description')
                    .setDescription('Description of what was modified about the blaster')
                    .setRequired(true))
                .addAttachmentOption(option => 
                    option.setName('blaster_image')
                    .setDescription('Image of your modified blaster')
                    .setRequired(true))),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
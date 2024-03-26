const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require("fs");
const approvalChannelID = '1222008392583745588';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Submits a request to check a blaster')
        .addSubcommand(subcommand =>
            subcommand
                .setName('blaster')
                .setDescription('Submits a request to check a blaster type (No custom/modified blasters)')
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
                .setDescription('Submits a request to check a blaster with modifications or a custom blaster')
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
        const img = interaction.options.getAttachment('blaster_image');
        if (img.contentType != "image/gif" && img.contentType != "image/jpeg" && img.contentType != "image/png") {
            await interaction.reply('Please submit an *image* of your blaster!');
            return;
        }

        const approvalChannel = interaction.guild.channels.cache.get(approvalChannelID);
        if (interaction.options.getSubcommand() == 'blaster') {
            let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
            let db = JSON.parse(dbJSON);
            const existCheck = db.findIndex((blast) => blast.name.toLowerCase() == interaction.options.getString('blaster_name').toLowerCase());
            if (existCheck != -1) {
                if (db[existCheck].tier == -1) {
                    await interaction.reply('**' + db[existCheck].name + '** is already pending review! Please check the \`\/lookup\` command later.');
                } else {
                    await interaction.reply('**' + db[existCheck].name + '** is already in the database as a tier **' + db[existCheck].tier + '** blaster!');
                }
                return;
            }
            const embed = new EmbedBuilder()
                .setColor('#ff6700')
                .setAuthor({ name: '@' + interaction.user.tag + ' - ' + interaction.options.getString('case_id'), iconURL: interaction.user.avatarURL()})
                .setTitle('BLASTER APPROVAL REQUEST')
                .setDescription(interaction.options.getString('blaster_name'))
                .setImage(img.url);
            
            const msg = await approvalChannel.send({ embeds: [embed] });
            
           const date = new Date();
            let toAdd = {
                "name":interaction.options.getString('blaster_name'),
                "tier":-1, 
                "caseID":interaction.options.getString('case_id'), 
                "userID":interaction.user.id, 
                "messageID":msg.id, 
                "date": (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear(),
                "image": img.url
            }

            db.push(toAdd);
            dbJSON = JSON.stringify(db, null, 4);
            fs.writeFileSync(process.env.BLASTER_DB_FILE, dbJSON, "utf-8"); 

            msg.react('1️⃣');
            msg.react('2️⃣');
            msg.react('3️⃣');
            msg.react('🇽');
            msg.react('*️⃣');
            msg.react('🤔');
            msg.react('🗑️');

            } else if (interaction.options.getSubcommand() == 'modifications') {
                let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
                let db = JSON.parse(dbJSON);
                
                const embed = new EmbedBuilder()
                    .setColor('#ffaa33')
                    .setAuthor({ name: '@' + interaction.user.tag + ' - ' + interaction.options.getString('case_id'), iconURL: interaction.user.avatarURL()})
                    .setTitle('MODIFICATION APPROVAL REQUEST')
                    .setDescription(interaction.options.getString('mod_description'))
                    .setImage(img.url);
                
                const msg = await approvalChannel.send({ embeds: [embed] });
                
               const date = new Date();
                let toAdd = {
                    "description":interaction.options.getString('mod_description'),
                    "tier":-1, 
                    "caseID":interaction.options.getString('case_id'), 
                    "userID":interaction.user.id, 
                    "messageID":msg.id, 
                    "date": (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear(),
                    "image": img.url
                }
    
                db.push(toAdd);
                dbJSON = JSON.stringify(db, null, 4);
                fs.writeFileSync(process.env.BLASTER_DB_FILE, dbJSON, "utf-8"); 
    
                msg.react('1️⃣');
                msg.react('2️⃣');
                msg.react('3️⃣');
                msg.react('🇽');
                msg.react('🤔');
                msg.react('🗑️');
                }

		await interaction.reply('Thanks! Your request has been submitted! You\'ll recieve a DM when a decision has been reached.');
	},
};
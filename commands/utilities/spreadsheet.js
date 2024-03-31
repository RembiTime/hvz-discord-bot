const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const fs = require("fs")
const XLSX = require('xlsx');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('spreadsheet')
		.setDescription('Checks for blasters that haven\'t been added to the spreadsheet')
        .addAttachmentOption(option => 
            option.setName('xlsx_sheet')
            .setDescription('Spreadsheet in xlsx format')
            .setRequired(true)),
	async execute(interaction) {
        const img = interaction.options.getAttachment('xlsx_sheet');
        if (img.contentType != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
            await interaction.reply({content: 'Please attach a .xlsx file', ephemeral: true});
            return;
        }
		let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
        let db = JSON.parse(dbJSON);
        const workbook = XLSX.read(Buffer.from(await (await (await fetch(img.url)).blob()).arrayBuffer()));
        const sheet_name_list = workbook.SheetNames;

        const date = new Date();
        let converted = []

        for (let i = 0; i < 4; i++) {
            let sheet = Object.values(XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[i]]).filter((blaster) => blaster.hasOwnProperty("Blaster Name") && blaster.hasOwnProperty("Brand")));
            sheet = sheet.map((blaster) => ({
                "name": blaster["Blaster Name"].trim(),
                "tier": i+1,
                "caseID": "sheet",
                "userID": "",
                "messageID": "",
                "date": (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear(),
                "image": blaster["Image Link"] ?? ""
            }));
            converted = converted.concat(sheet)
        }

        const sheetless = [];
        const tierless = [];

        db.forEach(blaster => {
            const existCheck = converted.findIndex((blast) => blast.name.toLowerCase() == blaster.name.toLowerCase());
            if (existCheck == -1 && blaster.tier !== -1) {
                let tier = "";
                if (blaster.tier === 4) {
                    tier = "BANNED";
                } else {
                    tier = "Tier " + blaster.tier;
                }
                sheetless.push(blaster.name + " - " + tier);
            }
        });

        converted = converted.filter(blaster => {
            
            const existCheck = db.findIndex((blast) => blast.name.toLowerCase() == blaster.name.toLowerCase());
            if (existCheck != -1) {
                if (db[existCheck].tier != blaster.tier) { // tier mismatch
                    tierless.push("" + blaster.name + " - Spreadsheet: Tier " + blaster.tier + " | Discord: Tier " + db[existCheck].tier);
                }
                return false;
            }
            return true;
        })

        if (sheetless.length == 0) {
            sheetless.push("All blasters are on the sheet!")
        }
        if (tierless.length == 0) {
            tierless.push("There are no tier inconsistencies between the sheet and the discord DB!")
        }
        
        await interaction.reply("**Blasters not on the sheet:**\n" + sheetless.join("\n") + "\n\n**Blasters with inconsistent tiers:**\n" + tierless.join("\n"));
	},
};
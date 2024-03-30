const { EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('node:fs');
const approvalChannelID = process.env.APPROVAL_CHANNEL_ID;

function changeTier(inBlastDB, index, tier) {
	if (inBlastDB) {
		let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
		let db = JSON.parse(dbJSON);
		oldTier = db[index].tier;
		db[index].tier = tier;
		dbJSON = JSON.stringify(db, null, 4);
		fs.writeFileSync(process.env.BLASTER_DB_FILE, dbJSON, "utf-8");
		console.log("Switched " + db[index].name + " from tier " + oldTier + " to " + tier);
	} else {
		let dbJSON = fs.readFileSync(process.env.MOD_DB_FILE);
		let db = JSON.parse(dbJSON);
		oldTier = db[index].tier;
		db[index].tier = tier;
		dbJSON = JSON.stringify(db, null, 4);
		fs.writeFileSync(process.env.MOD_DB_FILE, dbJSON, "utf-8");
		console.log("Switched " + db[index].name + " from tier " + oldTier + " to " + tier);
	}
}

function deleteBlaster(inBlastDB, index) {
	if (inBlastDB) {
		let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
		let db = JSON.parse(dbJSON);
		oldBlaster = db[index].name;
		db.splice(index, 1)
		dbJSON = JSON.stringify(db, null, 4);
		fs.writeFileSync(process.env.BLASTER_DB_FILE, dbJSON, "utf-8");
		console.log("Deleted " + oldBlaster + ".");
	} else {
		let dbJSON = fs.readFileSync(process.env.MOD_DB_FILE);
		let db = JSON.parse(dbJSON);
		oldDesc = db[index].description;
		db.splice(index, 1)
		dbJSON = JSON.stringify(db, null, 4);
		fs.writeFileSync(process.env.MOD_DB_FILE, dbJSON, "utf-8");
		console.log("Deleted mod request with description \"" + oldDesc + "\".");
	}
}

function switchFromBlastToMod(index) {
	let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
	let db = JSON.parse(dbJSON);
	let toMove = db[index];
	db.splice(index, 1);

	let modJSON = fs.readFileSync(process.env.MOD_DB_FILE);
	let mod = JSON.parse(modJSON);
	let name = toMove.name;
	delete toMove.name;
	toMove = Object.assign({description: name}, toMove);
	mod.push(toMove);

	dbJSON = JSON.stringify(db, null, 4);
	fs.writeFileSync(process.env.BLASTER_DB_FILE, dbJSON, "utf-8");

	modJSON = JSON.stringify(mod, null, 4);
	fs.writeFileSync(process.env.MOD_DB_FILE, modJSON, "utf-8");

	console.log("Moved " + name + " to modifications")
}

function decisionReached(msg, inBlastDB, goToDB, index, author, tier, conditional = false) {
    if (conditional) {
        switch (tier) {
            case 1:
                const embed1 = new EmbedBuilder(msg.embeds[0])
                    .setColor('#008e44')
                    .setTitle('CONDITIONALLY APPROVED - TIER 1')
                msg.edit({ embeds: [embed1] });
                
                changeTier(inBlastDB, index, 1);
                switchFromBlastToMod(index);
                author.send("The blaster **" + goToDB[index].name +"** has been conditionally **approved** for tier **1**, meaning you may use it at any time! This is a ruling specifically for you, so others can't use it unless they request it too.");
                break;
            case 2:
                const embed2 = new EmbedBuilder(msg.embeds[0])
                    .setColor('#008e44')
                    .setTitle('CONDITIONALLY APPROVED - TIER 2')
                msg.edit({ embeds: [embed2] });
                
                changeTier(inBlastDB, index, 2);
                switchFromBlastToMod(index);
                author.send("The blaster **" + goToDB[index].name +"** has been conditionally **approved** for tier **2**, meaning you may only use it during missions. This is a ruling specifically for you, so others can't use it unless they request it too.");
                break;
            case 3:
                const embed3 = new EmbedBuilder(msg.embeds[0])
                    .setColor('#f93a2f')
                    .setTitle('CONDITIONALLY DECIDED - TIER 3')
                msg.edit({ embeds: [embed3] });
                
                changeTier(inBlastDB, index, 3);
                switchFromBlastToMod(index);
                author.send("The blaster **" + goToDB[index].name +"** has been conditionally **approved** for tier **3**, meaning this blaster can **not** be used for Humans vs. Zombies. This means that the blaster might be able to play, but you'll need to talk to someone in core first.");
                break;
            case 4:
                const embed4 = new EmbedBuilder(msg.embeds[0])
                    .setColor('#f93a2f')
                    .setTitle('CONDITIONALLY DENIED')
                msg.edit({ embeds: [embed4] });

                deleteBlaster(inBlastDB, index);
                author.send("The blaster **" + goToDB[index].name +"** has been conditionally **denied** for play. This means that the blaster might be able to play, but you'll need to talk to someone in core first.");
                break;
            case 5:
                const embed = new EmbedBuilder(msg.embeds[0])
                    .setColor('#a62019')
                    .setTitle('BLASTER APPROVAL DELETED')
                msg.edit({ embeds: [embed] });

                deleteBlaster(inBlastDB, index);
                break;
        }
    } else {
        switch (tier) {
            case 1:
                if (inBlastDB) {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#00d166')
                        .setTitle('BLASTER APPROVED - TIER 1')
                    msg.edit({ embeds: [embed] });
                    author.send("The blaster **" + goToDB[index].name +"** has been **approved** for tier **1**, meaning you may use it any time!");
                } else {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#008e44')
                        .setTitle('MODIFICATION APPROVED - TIER 1')
                    msg.edit({ embeds: [embed] });
                    author.send("The modification for the following image has been **approved** for tier **1**, meaning you may use it any time! " + goToDB[index].image);
                }
                
                changeTier(inBlastDB, index, 1);
                break;
            case 2:
                if (inBlastDB) {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#00d166')
                        .setTitle('BLASTER APPROVED - TIER 2')
                    msg.edit({ embeds: [embed] });
                    author.send("The blaster **" + goToDB[index].name +"** has been **approved** for tier **2**, meaning you may only use it during missions.");
                } else {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#008e44')
                        .setTitle('MODIFICATION APPROVED - TIER 2')
                    msg.edit({ embeds: [embed] });
                    author.send("The modification for the following image has been **approved** for tier **2**, meaning you may only use it during missions. " + goToDB[index].image);
                }

                changeTier(inBlastDB, index, 2);
                break;
            case 3:
                if (inBlastDB) {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#f93a2f')
                        .setTitle('BLASTER DECIDED - TIER 3')
                    msg.edit({ embeds: [embed] });
                    author.send("The blaster **" + goToDB[index].name +"** has been **approved** for tier **3**, meaning this blaster can **not** be used for Humans vs. Zombies.");
                } else {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#f93a2f')
                        .setTitle('MODIFICATION DECIDED - TIER 3')
                    msg.edit({ embeds: [embed] });
                    author.send("The modification for the following image has been **approved** for tier **3**, meaning this blaster can **not** be used for Humans vs. Zombies. " + goToDB[index].image);
                }

                changeTier(inBlastDB, index, 3);
                break;
            case 4:
                if (inBlastDB) {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#f93a2f')
                        .setTitle('BLASTER DENIED')
                    msg.edit({ embeds: [embed] });
                    author.send("The blaster **" + goToDB[index].name +"** has been **denied** for play. Please don't use it.");
                } else {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#f93a2f')
                        .setTitle('MODIFICATION DENIED')
                    msg.edit({ embeds: [embed] });
                    author.send("The modification for the following image has been **denied** for play. Please don't use it. " + goToDB[index].image);
                }

                changeTier(inBlastDB, index, 4);
                break;
            case 5:
                if (inBlastDB) {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#a62019')
                        .setTitle('BLASTER APPROVAL DELETED')
                    msg.edit({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#a62019')
                        .setTitle('MODIFICATION APPROVAL DELETED')
                    msg.edit({ embeds: [embed] });
                }

                deleteBlaster(inBlastDB, index);
                break;
        }
    }
}

function autocompleteSearch(interaction) {
    let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
    let db = JSON.parse(dbJSON);
    const focusedValue = interaction.options.getFocused();
    const choices = db.map((blaster) => blaster.name);
    const splitWords = focusedValue.split(" ");
    let filtered = choices.filter(x => splitWords.every(word => x.toLowerCase().includes(word.toLowerCase()))).slice(0, 25);
    //const filtered = choices.filter(choice => choice.split(" ").forEach((blastWord) => blastWord.startsWith(focusedValue)));
    
    return filtered.map(choice => ({ name: choice, value: choice }));
}

function autocompleteCaseID(interaction) {
    let modJSON = fs.readFileSync(process.env.MOD_DB_FILE);
    let mod = JSON.parse(modJSON);
    const focusedValue = interaction.options.getFocused();
    const choices = mod.map((blaster) => blaster.caseID);
    const filtered = choices.filter(choice => choice.startsWith(focusedValue)).filter((value, index) => choices.indexOf(value) == index);
    return filtered.map(choice => ({ name: choice, value: choice }));
}

async function getPendingRequests() {

    let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
    let db = JSON.parse(dbJSON);
    const blasters = db.filter(blaster => blaster.tier == -1).reduce((arr, blaster) => {arr.push({name: blaster.date, value: "[" + blaster.name + "](https://discord.com/channels/" + process.env.BGC_GUILD_ID + "/" + approvalChannelID + "/" + blaster.messageID + ")", inline: true}); return arr;}, []);
    const embed = new EmbedBuilder()
        .setColor("#ff6700")
        .setTitle("The Daily Round-Up")
        .setDescription("Y'all better get approvin'")
        .addFields(blasters)
    
    return embed;
}

module.exports = {decisionReached, autocompleteSearch, autocompleteCaseID, getPendingRequests};
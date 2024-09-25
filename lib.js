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

async function decisionReached(msg, inBlastDB, goToDB, index, author, tier, conditional = false) {
    if (conditional) {
        switch (tier) {
            case 1:
                const embed1 = new EmbedBuilder(msg.embeds[0])
                    .setColor('#008e44')
                    .setTitle('CONDITIONALLY APPROVED - TIER 1')
                
                changeTier(inBlastDB, index, 1);
                switchFromBlastToMod(index);
                await author.send("The blaster **" + goToDB[index].name +"** has been conditionally **approved** for play, meaning you may use it at any time! This is a ruling specifically for you, so others can't use it unless they request it too.")
                    .catch((error) => {
                        console.log("Could not DM " + author.user.username)
                        embed1.setTitle('CONDITIONALLY APPROVED - TIER 1 (Could not DM)')
                    });
                msg.edit({ embeds: [embed1] });
                break;
            case 2:
                const embed2 = new EmbedBuilder(msg.embeds[0])
                    .setColor('#008e44')
                    .setTitle('CONDITIONALLY APPROVED - TIER 2')
                
                changeTier(inBlastDB, index, 2);
                switchFromBlastToMod(index);
                await author.send("The blaster **" + goToDB[index].name +"** has been conditionally **approved** for play, meaning you may use it at any time! This is a ruling specifically for you, so others can't use it unless they request it too.")
                    .catch((error) => {
                        console.log("Could not DM " + author.user.username)
                        embed2.setTitle('CONDITIONALLY APPROVED - TIER 2 (Could not DM)')
                    });
                msg.edit({ embeds: [embed2] });
                break;
            case 3:
                const embed3 = new EmbedBuilder(msg.embeds[0])
                    .setColor('#f93a2f')
                    .setTitle('CONDITIONALLY DECIDED - TIER 3')
                
                changeTier(inBlastDB, index, 3);
                switchFromBlastToMod(index);
                await author.send("The blaster **" + goToDB[index].name +"** has been conditionally **banned** from play, meaning this blaster can **not** be used for Humans vs. Zombies. This means that the blaster might be able to play, but you'll need to talk to someone in core first.")
                    .catch((error) => {
                        console.log("Could not DM " + author.user.username)
                        embed3.setTitle('CONDITIONALLY DECIDED - TIER 3 (Could not DM)')
                    });
                msg.edit({ embeds: [embed3] });
                break;
            case 4:
                const embed4 = new EmbedBuilder(msg.embeds[0])
                    .setColor('#f93a2f')
                    .setTitle('CONDITIONALLY DENIED')

                deleteBlaster(inBlastDB, index);
                await author.send("The blaster **" + goToDB[index].name +"** has been conditionally **denied** for play. This means that the blaster might be able to play, but you'll need to talk to someone in core first.")
                    .catch((error) => {
                        console.log("Could not DM " + author.user.username)
                        embed4.setTitle('CONDITIONALLY DENIED (Could not DM)')
                    });
                msg.edit({ embeds: [embed4] });
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
                    msg.react('📊');
                    await author.send("The blaster **" + goToDB[index].name +"** has been **approved** for play, meaning you may use it any time!")
                        .catch((error) => {
                            console.log("Could not DM " + author.user.username)
                            embed.setTitle('BLASTER APPROVED - TIER 1 (Could not DM)')
                        }).then();
                    msg.edit({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#008e44')
                        .setTitle('MODIFICATION APPROVED - TIER 1')
                    await author.send("The modification for the following image has been **approved** for play, meaning you may use it any time! " + goToDB[index].image)
                        .catch((error) => {
                            console.log("Could not DM " + author.user.username)
                            embed.setTitle('MODIFICATION APPROVED - TIER 1 (Could not DM)')
                        });
                    msg.edit({ embeds: [embed] });
                }
                
                changeTier(inBlastDB, index, 1);
                break;
            case 2:
                if (inBlastDB) {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#00d166')
                        .setTitle('BLASTER APPROVED - TIER 2')
                    msg.react('📊');
                    await author.send("The blaster **" + goToDB[index].name +"** has been **approved** for play, meaning you may use it any time!")
                        .catch((error) => {
                            console.log("Could not DM " + author.user.username)
                            embed.setTitle('BLASTER APPROVED - TIER 2 (Could not DM)')
                        });
                    msg.edit({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#008e44')
                        .setTitle('MODIFICATION APPROVED - TIER 2')
                    await author.send("The modification for the following image has been **approved** for play, meaning you may use it any time! " + goToDB[index].image)
                        .catch((error) => {
                            console.log("Could not DM " + author.user.username)
                            embed.setTitle('MODIFICATION APPROVED - TIER 2 (Could not DM)')
                        });
                    msg.edit({ embeds: [embed] });
                }

                changeTier(inBlastDB, index, 2);
                break;
            case 3:
                if (inBlastDB) {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#f93a2f')
                        .setTitle('BLASTER DECIDED - TIER 3')
                    msg.react('📊');
                    await author.send("The blaster **" + goToDB[index].name +"** has been **banned** from play, meaning this blaster can **not** be used for Humans vs. Zombies.")
                        .catch((error) => {
                            console.log("Could not DM " + author.user.username)
                            embed.setTitle('BLASTER DECIDED - TIER 3 (Could not DM)')
                        });
                    msg.edit({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#f93a2f')
                        .setTitle('MODIFICATION DECIDED - TIER 3')
                    await author.send("The modification for the following image has been **denied**, meaning this blaster can **not** be used for Humans vs. Zombies. " + goToDB[index].image)
                        .catch((error) => {
                            console.log("Could not DM " + author.user.username)
                            embed.setTitle('MODIFICATION DECIDED - TIER 3 (Could not DM)')
                        });
                    msg.edit({ embeds: [embed] });
                }

                changeTier(inBlastDB, index, 3);
                break;
            case 4:
                if (inBlastDB) {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#f93a2f')
                        .setTitle('BLASTER DENIED')
                    msg.react('📊');
                    await author.send("The blaster **" + goToDB[index].name +"** has been **denied** for play. Please don't use it.")
                        .catch((error) => {
                            console.log("Could not DM " + author.user.username)
                            embed.setTitle('BLASTER DENIED (Could not DM)')
                        });
                    msg.edit({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder(msg.embeds[0])
                        .setColor('#f93a2f')
                        .setTitle('MODIFICATION DENIED')
                    await author.send("The modification for the following image has been **denied** for play. Please don't use it. " + goToDB[index].image)
                        .catch((error) => {
                            console.log("Could not DM " + author.user.username)
                            embed.setTitle('MODIFICATION DENIED (Could not DM)')
                        });
                    msg.edit({ embeds: [embed] });
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
    if (blasters.length === 0) {
        return false;
    }
    const embed = new EmbedBuilder()
        .setColor("#ff6700")
        .setTitle("The Daily Round-Up")
        .setDescription("Y'all better get approvin'")
        .addFields(blasters)
    
    return embed;
}

module.exports = {decisionReached, autocompleteSearch, autocompleteCaseID, getPendingRequests};
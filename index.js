const { Client, Collection, Events, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const fs = require('node:fs');
const path = require('node:path');

let coreRoleID = '585598775805083660'

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent], partials: [Partials.Message, Partials.Channel, Partials.Reaction] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	} else if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
	}
});

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

client.on(Events.MessageReactionAdd, async (reaction, user) => {
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
			console.error('Something went wrong when fetching the message:', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
	let modJSON = fs.readFileSync(process.env.MOD_DB_FILE);
	let db = JSON.parse(dbJSON);
	let mod = JSON.parse(modJSON);
	const msgs = db.filter((blaster) => blaster.tier == -1).map((blaster) => blaster.messageID).concat(mod.filter((blaster) => blaster.tier == -1).map((blaster) => blaster.messageID));
	if (msgs.includes(reaction.message.id)) {
		let inBlastDB = true;
		let goToDB = db;
		let index = db.findIndex((blast) => blast.messageID == reaction.message.id);
		if (index == -1) {
			inBlastDB = false;
			index = mod.findIndex((blast) => blast.messageID == reaction.message.id);
			goToDB = mod;
		} 


		await reaction.message.guild.members.fetch(); // cache all users (so it can find how many are in core)
		let numCore = await reaction.message.guild.roles.cache.get(coreRoleID).members.size;
		let author = reaction.message.guild.members.cache.get(goToDB[index].userID);

		if (reaction.count - 1 >= numCore / 2 && reaction.emoji.name != "*️⃣" && reaction.message.reactions.cache.get('*️⃣').count - 1 >= (numCore / 2) - 2) { // Conditional if at least half - 2 vote conditional
			switch (reaction.emoji.name) {
				case "1️⃣":
					const embed1 = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#008e44')
						.setTitle('CONDITIONALLY APPROVED - TIER 1')
					reaction.message.edit({ embeds: [embed1] });
					
					changeTier(inBlastDB, index, 1);
					switchFromBlastToMod(index);
					author.send("The blaster **" + goToDB[index].name +"** has been conditionally **approved** for tier **1**, meaning you may use it at any time! This is a ruling specifically for you, so others can't use it unless they request it too.");
					break;
				case "2️⃣":
					const embed2 = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#008e44')
						.setTitle('CONDITIONALLY APPROVED - TIER 2')
					reaction.message.edit({ embeds: [embed2] });
					
					changeTier(inBlastDB, index, 2);
					switchFromBlastToMod(index);
					author.send("The blaster **" + goToDB[index].name +"** has been conditionally **approved** for tier **2**, meaning you may only use it during the day and at missions. This is a ruling specifically for you, so others can't use it unless they request it too.");
					break;
				case "3️⃣":
					const embed3 = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#008e44')
						.setTitle('CONDITIONALLY APPROVED - TIER 3')
					reaction.message.edit({ embeds: [embed3] });
					
					changeTier(inBlastDB, index, 3);
					switchFromBlastToMod(index);
					author.send("The blaster **" + goToDB[index].name +"** has been conditionally **approved** for tier **3**, meaning you may only use it at missions. This is a ruling specifically for you, so others can't use it unless they request it too.");
					break;
				case "🇽":
					const embed4 = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#f93a2f')
						.setTitle('CONDITIONALLY DENIED')
					reaction.message.edit({ embeds: [embed4] });

					deleteBlaster(inBlastDB, index);
					author.send("The blaster **" + goToDB[index].name +"** has been conditionally **denied** for play. This means that the blaster might be able to play, but you'll need to talk to someone in core first.");
					break;
				case "🗑️":
					const embed = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#a62019')
						.setTitle('BLASTER APPROVAL DELETED')
					reaction.message.edit({ embeds: [embed] });

					deleteBlaster(inBlastDB, index);
					break;
			}
		} else if (reaction.count - 1 >= numCore / 2 && reaction.emoji.name != "*️⃣") {
			switch (reaction.emoji.name) {
				case "1️⃣":
					if (inBlastDB) {
						const embed = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#00d166')
						.setTitle('BLASTER APPROVED - TIER 1')
						reaction.message.edit({ embeds: [embed] });
						author.send("The blaster **" + goToDB[index].name +"** has been **approved** for tier **1**, meaning you may use it any time!");
					} else {
						const embed = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#008e44')
						.setTitle('MODIFICATION APPROVED - TIER 1')
						reaction.message.edit({ embeds: [embed] });
						author.send("The modification for the following image has been **approved** for tier **1**, meaning you may use it any time! " + goToDB[index].image);
					}
					
					changeTier(inBlastDB, index, 1);
					break;
				case "2️⃣":
					if (inBlastDB) {
						const embed = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#00d166')
						.setTitle('BLASTER APPROVED - TIER 2')
						reaction.message.edit({ embeds: [embed] });
						author.send("The blaster **" + goToDB[index].name +"** has been **approved** for tier **2**, meaning you may only use it during the day and at missions.");
					} else {
						const embed = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#008e44')
						.setTitle('MODIFICATION APPROVED - TIER 2')
						reaction.message.edit({ embeds: [embed] });
						author.send("The modification for the following image has been **approved** for tier **2**, meaning you may only use it during the day and at missions. " + goToDB[index].image);
					}

					changeTier(inBlastDB, index, 2);
					break;
				case "3️⃣":
					if (inBlastDB) {
						const embed = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#00d166')
						.setTitle('BLASTER APPROVED - TIER 3')
						reaction.message.edit({ embeds: [embed] });
						author.send("The blaster **" + goToDB[index].name +"** has been **approved** for tier **3**, meaning you may only use it during missions.");
					} else {
						const embed = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#008e44')
						.setTitle('MODIFICATION APPROVED - TIER 3')
						reaction.message.edit({ embeds: [embed] });
						author.send("The modification for the following image has been **approved** for tier **3**, meaning you may only use it during missions. " + goToDB[index].image);
					}

					changeTier(inBlastDB, index, 3);
					break;
				case "🇽":
					if (inBlastDB) {
						const embed = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#f93a2f')
						.setTitle('BLASTER DENIED')
						reaction.message.edit({ embeds: [embed] });
						author.send("The blaster **" + goToDB[index].name +"** has been **denied** for play. Please don't use it.");
					} else {
						const embed = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#f93a2f')
						.setTitle('MODIFICATION DENIED')
						reaction.message.edit({ embeds: [embed] });
						author.send("The modification for the following image has been **denied** for play. Please don't use it. " + goToDB[index].image);
					}

					changeTier(inBlastDB, index, 4);
					break;
				case "🗑️":
					if (inBlastDB) {
						const embed = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#a62019')
						.setTitle('BLASTER APPROVAL DELETED')
						reaction.message.edit({ embeds: [embed] });
					} else {
						const embed = new EmbedBuilder(reaction.message.embeds[0])
						.setColor('#a62019')
						.setTitle('MODIFICATION APPROVAL DELETED')
						reaction.message.edit({ embeds: [embed] });
					}

					deleteBlaster(inBlastDB, index);
					break;
			}
		}
	}
})

client.login(process.env.TOKEN);
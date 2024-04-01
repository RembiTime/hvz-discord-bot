const { Client, Collection, Events, GatewayIntentBits, Partials, EmbedBuilder, ActivityType } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const fs = require('node:fs');
const path = require('node:path');
const lib = require("./lib.js");
const cron = require('node-cron');

const approvalChannelID = process.env.APPROVAL_CHANNEL_ID;
let coreRoleID = process.env.CORE_ROLE_ID;
let unanimousCapacity = 5;

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

client.once(Events.ClientReady, async readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	client.user.setPresence({ activities: [{ name: 'I cast Eldritch Blast(er)!', type: ActivityType.Custom }], status: 'online' });

	cron.schedule('0 19 * * *', async () => { // runs at 7pm every day
		console.log("Running the daily round up...")
		const roundup = await lib.getPendingRequests();
		if (roundup !== false) {
			const approvalChannel = await client.guilds.cache.get(process.env.BGC_GUILD_ID).channels.fetch(approvalChannelID);
			approvalChannel.send({embeds: [roundup]});
		}
	}, {
		timezone: "America/New_York"
	});
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

	if (reaction.emoji.name != "1️⃣" && reaction.emoji.name != "2️⃣" && reaction.emoji.name != "3️⃣" && reaction.emoji.name != "🇽" && reaction.emoji.name != "🗑️") {
		return;
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

		let reactionHasOverThreeQuarters = true;
		reactions = [];
		reaction.message.reactions.cache.forEach(react => {
			reactions.push({name: react._emoji.name, count: react.count - 1});
			if (!(reaction.count-1 >= (react.count-1) * 4) && reaction.emoji.name != react._emoji.name && react._emoji.name != "*️⃣") {
				reactionHasOverThreeQuarters = false;
			}
		});

		await reaction.message.guild.members.fetch(); // cache all users (so it can find how many are in core)
		let numCore = reaction.message.guild.roles.cache.get(coreRoleID).members.size;
		let author = reaction.message.guild.members.cache.get(goToDB[index].userID);

		let consensusReached = false;
		let isConditional = false;
		if (!reactionHasOverThreeQuarters) {
			if (reaction.count - 1 >= numCore / 2 && reaction.emoji.name != "*️⃣" && reaction.emoji.name != "🤔") {
				consensusReached = true;
			}
			if (reaction.message.reactions.cache.get('*️⃣') != undefined && reaction.message.reactions.cache.get('*️⃣').count - 1 >= (numCore / 2) - 2) { // Conditional if at least half - 2 vote conditional
				isConditional = true;
			}
		} else  {
			if (reaction.count - 1 >= unanimousCapacity && reaction.emoji.name != "*️⃣" && reaction.emoji.name != "🤔") {
				consensusReached = true;
			}
			if (reaction.message.reactions.cache.get('*️⃣') != undefined && reaction.message.reactions.cache.get('*️⃣').count - 1 >= unanimousCapacity - 1) {
				isConditional = true;
			}
		}
		
		if (consensusReached) {
			switch (reaction.emoji.name) {
				case "1️⃣": lib.decisionReached(reaction.message, inBlastDB, goToDB, index, author, 1, isConditional); break;
				case "2️⃣": lib.decisionReached(reaction.message, inBlastDB, goToDB, index, author, 2, isConditional); break;
				case "3️⃣": lib.decisionReached(reaction.message, inBlastDB, goToDB, index, author, 3, isConditional); break;
				case "🇽": lib.decisionReached(reaction.message, inBlastDB, goToDB, index, author, 4, isConditional); break;
				case "🗑️": lib.decisionReached(reaction.message, inBlastDB, goToDB, index, author, 5, isConditional); break;
			}
		}
	}
})

client.login(process.env.TOKEN);
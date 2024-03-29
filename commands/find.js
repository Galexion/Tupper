const {article,proper} = require("../modules/lang");

module.exports = {
	help: cfg => "Find and display info about " + cfg.lang + "s by name",
	usage: cfg =>  ["find <name> - Attempts to find " + article(cfg) + " " + cfg.lang + " with exactly the given name, and if none are found, tries to find " + cfg.lang + "s with names containing the given name."],
	permitted: (msg) => true,
	groupArgs: true,
	execute: async (bot, msg, args, cfg) => {
		if(msg.channel.type == 1)
			return bot.send(msg.channel, "This command cannot be used in private messages.");
		if(!args[0])
			return bot.cmds.help.execute(bot, msg, ["find"], cfg);
		let search = args.join(" ").toLowerCase();
		let tul = (await bot.db.query("SELECT * FROM Members WHERE user_id = ANY ($1) AND (CASE WHEN tag IS NULL THEN LOWER(name) LIKE '%' || $2 || '%' ELSE (LOWER(name) || LOWER(tag)) LIKE '%' || $2 || '%' END)",[msg.channel.guild.members.map(m => m.id),search])).rows;
		if(!tul[0])
			bot.send(msg.channel, "Couldn't find " + article(cfg) + " " + cfg.lang + " with that name in this server.");
		else {
			if(tul.length == 1) {
				let t = tul[0];
				let host = bot.users.get(t.user_id);
				let embed = { embed: {
					author: {
						name: t.name,
						icon_url: t.url
					},
					description: `Host: ${host ? host.username + "#" + host.discriminator : "Unknown user " + t.host}\n${bot.generateTulpaField(t).value}`,
				}};
				bot.send(msg.channel, embed);
			} else {
				let embeds = [];
				let current = { embed: {
					title: "Results",
					fields: []
				}};
				tul.forEach(t => {
					if(current.embed.fields.length > 5) {
						embeds.push(current);
						current = { embed: {
							title: "Results",
							fields: []
						}};
					}
					let host = bot.users.get(t.user_id);
					current.embed.fields.push({name: t.name, value: `Host: ${host ? host.username + "#" + host.discriminator : "Unknown user " + t.host}\n${bot.generateTulpaField(t).value}`});
				});
				embeds.push(current);
				if(embeds.length > 1) {
					for(let i = 0; i < embeds.length; i++)
						embeds[i].embed.title += ` (page ${i+1}/${embeds.length} of ${tul.length} results)`;
					return bot.paginate(msg, embeds);
				}
				bot.send(msg.channel,embeds[0]);
			}
		}
	}
};
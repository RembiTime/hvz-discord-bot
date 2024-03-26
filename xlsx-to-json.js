const dotenv = require('dotenv');
dotenv.config();
const fs = require("fs")
const XLSX = require('xlsx');

const workbook = XLSX.readFile('Blaster Categorization List.xlsx');
const sheet_name_list = workbook.SheetNames;

let dbJSON = fs.readFileSync(process.env.BLASTER_DB_FILE);
let db = JSON.parse(dbJSON);

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

db.forEach(blaster => {
    const existCheck = converted.findIndex((blast) => blast.name.toLowerCase() == blaster.name.toLowerCase());
    if (existCheck == -1) {
        console.log('**' + blaster.name + ' was not found in the spreadsheet!');
    }
});

console.log()

converted = converted.filter(blaster => {
    
    const existCheck = db.findIndex((blast) => blast.name.toLowerCase() == blaster.name.toLowerCase());
    if (existCheck != -1) {
        if (db[existCheck].tier != blaster.tier) { // tier mismatch
            const oldTier = db[existCheck].tier;
            db[existCheck].tier = blaster.tier;
            console.log('Updated \"' + db[existCheck].name + '\" to tier \"' + db[existCheck].tier + '\" (from ' + oldTier + ')!');
        } else {
            console.log('    \"' + db[existCheck].name + '\" is already in the database as a tier \"' + db[existCheck].tier + '\" blaster!');
        }
        return false;
    }
    return true;
})

dbJSON = JSON.stringify(db.concat(converted), null, 4);
fs.writeFileSync(process.env.BLASTER_DB_FILE, dbJSON, "utf-8");
const Discord = require('discord.js');
const config = require('./config.json');
const fs = require('fs');
const child = require('child_process');
const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
});

const client = new Discord.Client();
client.login(config.token);

var exetype = "";

function getExecType() {
    rl.question("\n1: python\n2: python with cmd\n3: write to file\n4: write to file and make run.bat\n5: clear log\n", ans => {
        console.log(`\nRecieved option ${ans}`);
        if (ans == "5") truncateLog();
        else exetype = ans;
    });
}

function truncateLog() {
    rl.question(`\nAre you sure? Y/N    `, ans => {
        if (ans == "y" || "Y") {
            console.log(`\nTruncating ${config.logPath}...`);
            fs.truncate(config.logPath, err => {
                if (err) throw err;
                console.log(`Cleared ${config.logPath}`);
                getExecType();
            });
        } else if (ans == "n" || "N") {
            getExecType();
        } else {
            console.log("\nInvalid answer!");
            truncateLog();
        }
    });
}

client.on('ready', () => {
    console.log("\n---Start---\n\nWorking, Getting exec type...");
    getExecType();
});

rl.on('line', termput => {
    switch (termput) {
        case 'exit':
            console.log("Exitting process...");
            process.exit();
            break;
        case 'kill':
            console.log("Killing process...");
            process.exit();
            break;
        case 'exec':
            getExecType();
            break;
    }
});

client.on('message', msg => {
    if (msg.author.id == "324468886357540865" && msg.content.indexOf("```") == 0)
        if (exetype != undefined || "" || null) {
            fs.appendFile(config.logPath, `\n\n### [${Date().toString()}]\n\n***---Command---***\n\n#### Type: ${exetype}\n\n${msg.content.slice(3, -3)}\n`, err => {
                if (err) throw err;
                switch (exetype) {
                    case "1":
                        python(msg);
                        break;
                    case "2":
                        exec('main.py', true);
                        cmd(msg, false);
                        break;
                    case "3":
                        receive(msg.content);
                        break;
                    case "4":
                        receive(msg.content).then(ans => {
                            exec(ans, false);
                        });
                        break;
                }
            });
        } else {
            console.log("Didn't receive an exec type!\n");
        }
});

async function receive(content) {
    return new Promise(res => {
        rl.question(`\n---Received---\n\nWhich file to write to?  `, ans => {
            fs.appendFile(config.logPath, `\n#### File: ${ans}`, err0 => {
                if (err0) throw err0;
                console.log('\n---Log---\n\nLogged, Writing to file...');
                fs.writeFile(ans, content.slice(3, -3), err => {
                    if (err) throw err;
                    console.log("Wrote to file " + ans);
                    res(ans);
                });
            });
        });
    });
}

function exec(path, log) {
    if (log) console.log('\n---Log---\n\nLogged, Writing to executable file...');
    else console.log('\n---Log---\n\nWriting to executable file...');
    fs.writeFile(config.executablePath, `@ECHO OFF\npython "${path}"\nPAUSE`, err => {
        if (err) throw err;
        console.log(`Wrote executable file ${config.executablePath}`);
        return;
    });
}

function cmd(msg, log) {
    if (log) console.log('\n---Log---\n\nLogged, Writing to python file...');
    else console.log('\n---Log---\n\nWriting to python file...');
    fs.writeFile(config.pythonPath, msg.content.slice(3, -3), err => {
        if (err) throw err;
        console.log("Wrote python file, running...\n");
        var spawned = child.exec(config.executablePath, (err2, stdout, stdin) => {
            if (err2) throw err2;
            console.log(`---Final---\n\n${stdout}`);
            fs.appendFileSync(config.logPath, `\n***---Final---***\n\n${stdout}\n`);
        });
        var temPID = spawned.pid;
        spawned.stdout.on('data', data => {
            console.log(data.toString());
            fs.appendFileSync(config.logPath, `\n***---Output---***\n\n${data.toString()}`);
        });
        spawned.on('exit', (code, sig) => {
            fs.appendFile(config.logPath,
                `\n***---Exit---***\n\nPID ${temPID} on ${spawned.spawnfile} ended with ${code} and sig ${sig}`,
                err => {
                    if (err) throw err;
                    console.log(`---Log---\n\nProcess ended with code ${code} and signal ${sig}.\nLogged.`);
                });
        });
        console.log(`Spawned with ${spawned.spawnfile} and a PID of ${temPID}\n\n---Output---\n`);
    });
}

function python(msg) {
    console.log("\n---Log---\n\nLogged, Writing to python file...");
    fs.writeFile(config.pythonPath, msg.content.slice(3, -3), err1 => {
        if (err1) throw err1;
        console.log("Wrote python file, running...\n");
        var spawned = child.spawn('python', [config.pythonPath]);
        var temPID = spawned.pid;
        spawned.stdout.on('data', data => {
            console.log(data.toString());
            fs.appendFileSync(config.logPath, `\n***---Output---***\n\n${data.toString()}`);
        });
        spawned.on('exit', (code, sig) => {
            fs.appendFile(config.logPath,
                `\n***---Exit---***\n\nPID ${temPID} on ${spawned.spawnfile} ended with ${code} and sig ${sig}`,
                err => {
                    if (err) throw err;
                    console.log(`---Log---\n\nProcess ended with code ${code} and signal ${sig}.\nLogged.`);
                });
        });
        console.log(`Spawned with ${spawned.spawnfile} and a PID of ${temPID}\n\n---Output---\n`);
    });
}
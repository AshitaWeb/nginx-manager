#!/usr/bin/env node
var program = require('commander');
var fs = require('fs');
var os = require('os');
var execSync = require('child_process').execSync;
var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);

program
 .option('-d, --dir <folder>', 'Webroot')
 .option('-u, --url <url>', 'Url')
 .option('-t, --template <file>', 'template')
 .option('-p, --port <port>', 'port to loadbalance configuration eg. 12 be will create ports like 1212 1213 1214 to number of cpus from computer')
 .option('-n, --name <name>', 'name for config eg. newsite')
 .parse(process.argv);

if (program.dir && program.url && program.port && program.name) {
    var template;

    if (!program.template) {
        template = fs.readFileSync(__dirname + '/template').toString();
    } else {
        template = fs.readFileSync(program.template).toString();
    }

    var qtdCpu = os.cpus().length;
    var servers = '';

    for (var i = 0; i < qtdCpu; i++) {
        if (i > 0) {
            servers += '    ';
        }

        servers += 'server localhost:' + program.port + '' + (parseInt(program.port) + i) + ';\n';
    }

    template = template.replace(/template.webroot/gm, program.dir);
    template = template.replace(/template.url/gm, program.url);
    template = template.replace(/template.name/gm, program.name);
    template = template.replace(/template.servers/gm, servers);

    console.log(template);

    rl.question('Its ok? [yes]/no: ', function (answer) {
        if (answer === 'no') {
            console.log('Canceled.');
            process.exit(0);
        } else {
            var dirAvailable = '/etc/nginx/sites-available/';
            var dirEnabled = '/etc/nginx/sites-enabled/';

            fs.writeFileSync(dirAvailable + program.name, template);

            if (fs.existsSync(dirEnabled + program.name)) {
                console.log('SymLink already exists!');
            } else {
                fs.symlinkSync(dirAvailable + program.name, dirEnabled + program.name);
            }

            var reload = execSync('sudo service nginx reload');
            console.log(reload.toString());
            process.exit(0);
        }
    });

}

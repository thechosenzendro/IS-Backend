
//Inicializace všech potřebných modulů + proměnných
var express = require("express");
var app = express();
var fs = require('fs');
var cors = require('cors')
var crypto = require('crypto-js')
var port = 8080;
var frontend = "http://127.0.0.1:5500/"
WriteToLog("______________Inicializace MZISAPI______________")
app.listen(port, () => WriteToLog("Vše funguje na localhost:" + port));
//Middleware
app.use(express.json());
app.use(cors(corsOptions));
app.options('*', cors());
var corsOptions = {
    origin: 'http://127.0.0.1:5500/',
    optionsSuccessStatus: 200
}

//Setup časovače
function Timestamp() {
    let date = new Date();
    let hh = date.getHours();
    let mm = checkTime(date.getMinutes());
    let ss = checkTime(date.getSeconds());
    let day = date.getDay()
    let month = date.getMonth()
    let year = date.getFullYear()
    let time = "(" + day + "." + month + "." + year + ") " + "[" + hh + ":" + mm + ":" + ss + "] ";
    return time;
}
function checkTime(i) {
    if (i < 10) { i = "0" + i };
    return i;
}
//Logování do server.log
function WriteToLog(msg) {
    const msgwts = Timestamp() + msg + "\n";
    fs.appendFile('server.log', msgwts, function (err) {
        if (err) throw err;
    });
    console.log(msgwts)

}

app.get("/ping", (req, res) => {
    res.status(200).send("pong")
    WriteToLog("Ping zaznamenán");
})






//Request souboru z ./server
app.get("/file/:filename", (req, res) => {
    const { filename } = req.params
    fs.readFile("./server/" + filename, "utf8", (err, data) => {
        if (err) {
            res.status(400).send(err);
            WriteToLog("Error: " + err)
            return;
        }
        res.status(200).send(data)
        WriteToLog("Data poslána: " + filename)

    })
})
//Request zakázky z ./server/-----/ui.json
app.get("/getcontract/:id/", (req, res) => {
    const { id } = req.params
    fs.readFile("./server/" + id + "/ui.json", "utf8", (err, uidata) => {
        if (err) {
            res.status(400).send(err);
            WriteToLog("Error: " + err)
            return;
        }
        fs.readFile("./server/" + id + "/data.json", "utf8", (err, data) => {
            if (err) {
                res.status(400).send(err);
                WriteToLog("Error: " + err)
                return;
            }
            res.status(200).send({ "ui": uidata, "data": data })
        })
        WriteToLog("Zakázka poslána: " + id)
    })
})

//Autorizace uživatele
app.post("/auth", (req, res) => {
    //Vybrání jména a hesla z URI
    uri = req.url
    const urlParams = new URLSearchParams(uri.replace("/auth", ""));
    //Login funkce
    function Login(jmeno, heslo, db) {
        const parsedjmeno = jmeno.toLowerCase().replace(/\s/g, '');
        const napsaneHeslo = crypto.SHA256(heslo);
        const databaseHeslo = db[parsedjmeno];
        if (logindata.hasOwnProperty(parsedjmeno)) {
            if (napsaneHeslo == databaseHeslo) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
    //Přečtení logindata
    let logindata;
    fs.readFile("./server/login.json", "utf8", (err, data) => {
        if (err) {
            res.status(500).send(err);
            WriteToLog("Auth Read Error: " + err)
            return;
        }
        daticka = data;
        //Logika která převede formát login.json na formát který se dá přečíst Login().
        daticka = JSON.parse(daticka)
        temparrlog = {}
        for (var i = 0; i < daticka.length; i++) {
            let obj = daticka[i]
            objkeys = Object.keys(obj)
            for (var u = 0; u < objkeys.length; u++) {
                let tag = objkeys[u]
                temparrlog[tag] = obj[tag]

            }
        }
        logindata = temparrlog
        WriteToLog("loginData přečtena.");
        const name = urlParams.get("name");
        const pass = urlParams.get("pass");
        let ans = Login(name, pass, logindata)
        const datinka = { "Auth": ans, "Role": logindata["role_" + name], "Jmeno": logindata["jmeno_" + name] }
        res.status(200).send(datinka)
        WriteToLog(" Uživatel " + name + " se snaží přihlásit. Povedlo se?: " + ans);

    })

    WriteToLog("Autorizační request přijat.")

})
//Vytvoření nové zakázky
app.post("/newcontract/", (req, res) => {
    fs.readFile("./templates/newcontract.json", "utf8", (err, data) => {
        psdata = data
        fs.readFile("./templates/idname.json", "utf8", (err, data) => {
            parsedata = JSON.parse(data)
            id = parsedata["id"]
            lastitem = id[id.length - 1]
            const newid = lastitem + 1
            id.push(newid)
            parsedata["id"] = id
            fs.writeFile('./templates/idname.json', JSON.stringify(parsedata), function (err) {
                if (err) throw err;
            });
            wowfile = './server/' + newid.toString() + '/ui.json'
            wowfile2 = './server/' + newid.toString() + '/data.json'
            if (!fs.existsSync("./server/" + newid.toString())) {
                fs.mkdirSync("./server/" + newid.toString(), { recursive: true });
            }
            fs.writeFile(wowfile, psdata, function (err) { if (err) throw err; });
            fs.writeFile(wowfile2, JSON.stringify({ "foo": "bar" }), function (err) { if (err) throw err; });
            fs.readFile("./server/dashinfo.json", "utf8", (err, data) => {
                if (err) throw err
                dashdata = JSON.parse(data)
                dashdata.push(
                    {
                        "Číslo zakázky": newid
                    },
                )
                fs.writeFile("./server/dashinfo.json", JSON.stringify(dashdata), function (err) {
                    if (err) throw err;
                    res.status(200).send(newid.toString())
                });

            })
        })
    })
})
//Vytvoření či změna dat v zakázce
app.patch("/newdata/:project/:element/:value", (req, res) => {
    const { project } = req.params
    const { element } = req.params
    const { value } = req.params
    file = "./server/" + project + "/data.json"
    fs.readFile(file, "utf8", (err, data) => {
        if (err) throw err
        filedata = JSON.parse(data)
        filedata[element] = value
        fs.writeFile(file, JSON.stringify(filedata), function (err) {
            if (err) throw err;
            res.status(200).send()
        })

    })


})
app.patch("/newactivity/:project/:value", (req, res) => {
    WriteToLog('New activity')
    const { project } = req.params
    const { value } = req.params
    file = "./server/" + project + "/data.json"
    Check()
    function Check() {
        fs.readFile(file, "utf8", (err, data) => {
            if (err) throw err
            parsedata = JSON.parse(data)
            if (parsedata.hasOwnProperty('provedenecinnosti')) {
                let date = new Date();
                let day = date.getDay()
                let month = date.getMonth()
                let year = date.getFullYear()
                let datum = day + '.' + month + '.' + year
                obj = decodeURIComponent(value).split('-')
                newactivity = {}
                newactivity['Datum'] = datum
                newactivity['Popis činnosti'] = obj[0]
                newactivity['Zapisovatel'] = obj[1]
                console.log('Newactivity vytvořeno')
                parsedata['provedenecinnosti'][parsedata['provedenecinnosti'].length] = newactivity
                fs.writeFile(file, JSON.stringify(parsedata), err => {
                    if (err) {
                        WriteToLog(err);
                    }
                    WriteToLog('Přidána nová činnost pro projekt ' + project + ' od uživatele ' + obj[1])
                    res.status(200).send()
                });
            }
            else {
                parsedata['provedenecinnosti'] = []
                console.log(parsedata)
                fs.writeFile(file, JSON.stringify(parsedata), err => {
                    if (err) {
                        WriteToLog(err);
                    }
                    Check()
                });
            }
        })
    }
})
app.post("/issue/:name/:title/:body", (req, res) => {
    const { name } = req.params
    const { title } = req.params
    const { body } = req.params
    const data = "Jméno: " + name + "\nTitle:" + decodeURIComponent(title) + "\nBody:" + decodeURIComponent(body) + "\n"
    fs.appendFile( "./issues.json", data, () => {
        WriteToLog('Přidán nový problém od ' + name)
        res.status(200).send('Ok')
    })
})
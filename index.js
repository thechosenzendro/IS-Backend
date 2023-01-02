//Inicializace všech potřebných modulů + proměnných
var express = require("express");
require("dotenv").config();
var app = express();
var fs = require('fs');
var cors = require('cors')
var crypto = require('crypto-js')
var port = 8080;
let date = new Date();
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
    let hh = date.getHours();
    let mm = checkTime(date.getMinutes());
    let ss = checkTime(date.getSeconds());
    let day = date.getDate()
    let month = date.getMonth() + 1
    let year = date.getFullYear()
    let time = "(" + day + "." + month + "." + year + ") " + "[" + hh + ":" + mm + ":" + ss + "] ";
    return time;
}
function checkTime(i) {
    if (i < 10) { i = "0" + i };
    return i;
}
//Logování do ../Backend_Assets/server.log
function WriteToLog(msg) {
    const msgwts = Timestamp() + msg + "\n";
    fs.appendFile('../Backend_Assets/server.log', msgwts, function (err) {
        if (err) throw err;
        if (err) { WriteToLog('Error! Nejde psát do logu! Error: ' + err) }
    });
    console.log(msgwts)

}
//Počítání objektů v JSONu
function countObjectKeys(obj) {
    return Object.keys(obj).length;
}
//Ping
app.get("/ping", (req, res) => {
    res.status(200).send("pong")
    WriteToLog("Ping zaznamenán z IP Adresy " + req.ip);
})

//Request souboru z ../Backend_Assets/server/
app.get("/file/:filename", (req, res) => {
    const { filename } = req.params
    fs.readFile("../Backend_Assets/server/" + filename, "utf8", (err, data) => {
        if (err) {
            res.status(400).send(err);
            WriteToLog("Error při čtení souboru: " + filename + "\n Error: " + err)
            return;
        }
        res.status(200).send(data)
        WriteToLog("Data poslána: " + filename)

    })
})
//Request templatu z ../Backend_Assets/template/
app.get("/template/:templatename", (req, res) => {
    const { templatename } = req.params
    fs.readFile("../Backend_Assets/templates/" + templatename, "utf8", (err, data) => {
        if (err) {
            res.status(400).send(err);
            WriteToLog("Error při čtení templatu: " + templatename + "\n Error: " + err)
            return;
        }
        res.status(200).send(data)
        WriteToLog("Template poslán: " + templatename)

    })
})
//Request zakázky z ../Backend_Assets/server/-----/ui.json
app.get("/getcontract/:id/", (req, res) => {
    const { id } = req.params
    fs.readFile("../Backend_Assets/server/" + id + "/ui.json", "utf8", (err, uidata) => {
        if (err) {
            res.status(400).send(err);
            WriteToLog("Error při čtení UI zakázky: " + id + "\n Error: " + err)
            return;
        }
        fs.readFile("../Backend_Assets/server/" + id + "/data.json", "utf8", (err, data) => {
            if (err) {
                res.status(400).send(err);
                WriteToLog("Error při čtení dat zakázky: " + id + "\n Error: " + err)
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
    fs.readFile("../Backend_Assets/server/login.json", "utf8", (err, loginjsondata) => {
        if (err) {
            res.status(500).send(err);
            WriteToLog("Error při přečtení LOGIN dat: " + err)
            return;
        }
        daticka = loginjsondata;
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
        const name = urlParams.get("name").toLowerCase().replace(/\s/g, '');
        const pass = urlParams.get("pass");
        let ans = Login(name, pass, logindata)
        WriteToLog(" Uživatel " + name + " se snaží přihlásit. Povedlo se?: " + ans);
        if (ans == true) {
            datinka = { "Auth": ans, "Role": logindata["role_" + name], "Jmeno": logindata["jmeno_" + name] }
            easteregg = logindata["jmeno_" + name]

            fs.readFile("../Backend_Assets/server/loggedusers.json", "utf8", (err, data) => {
                obj = JSON.parse(data);
                loggedusers = obj
                newuserlogged = {}
                newuserlogged['Přihlášení uživatelé (uživatelské jméno)'] = easteregg
                console.log(newuserlogged)
                loggedusers.push(newuserlogged)
                fs.writeFile("../Backend_Assets/server/loggedusers.json", JSON.stringify(loggedusers), (err) => {
                    res.status(200).send(datinka)
                })
            })
        }
        if (ans == false) {
            datinka = { "Auth": ans }
            res.status(200).send(datinka)
        }
    })

    WriteToLog("Autorizační request přijat.")

})
//Odhlášení uživatele
app.post("/userlogout/:jmeno", (req, res) => {
    const { jmeno } = req.params
    fs.readFile("../Backend_Assets/server/loggedusers.json", "utf8", (err, data) => {
        loggeddata = JSON.parse(data)
        for (var i = 0; i < loggeddata.length; i++) {
            ld = loggeddata[i]['Přihlášení uživatelé (uživatelské jméno)']
            if (ld == jmeno) {
                console.log(true)
                loggeddata.splice(i)
                break
            }

        }
        console.log(JSON.stringify(loggeddata))
        fs.writeFile("../Backend_Assets/server/loggedusers.json", JSON.stringify(loggeddata), (err) => {
            res.status(200).send("Ok")
        })
    })

})
//Vytvoření nové zakázky
app.post("/newcontract/", (req, res) => {
    fs.readFile("../Backend_Assets/templates/newcontract.json", "utf8", (err, data) => {
        psdata = data
        fs.readFile("../Backend_Assets/templates/idname.json", "utf8", (err, data) => {
            parsedata = JSON.parse(data)
            id = parsedata["id"]
            lastitem = id[id.length - 1]
            const newid = lastitem + 1
            id.push(newid)
            parsedata["id"] = id
            fs.writeFile('../Backend_Assets/templates/idname.json', JSON.stringify(parsedata), function (err) {
                if (err) throw err;
                WriteToLog("Error při přečtení IDNAME. Error: " + err)
            });
            wowfile = '../Backend_Assets/server/' + newid.toString() + '/ui.json'
            wowfile2 = '../Backend_Assets/server/' + newid.toString() + '/data.json'
            if (!fs.existsSync("../Backend_Assets/server/" + newid.toString())) {
                fs.mkdirSync("../Backend_Assets/server/" + newid.toString(), { recursive: true });
            }
            fs.writeFile(wowfile, psdata, function (err) { if (err) throw err; if (err) { WriteToLog("Error při přečtení UI nové zakázky. Error: " + err) }; });
            fs.writeFile(wowfile2, JSON.stringify({ "foo": "bar", "stavebnici": [] }), function (err) { if (err) throw err; if (err) { WriteToLog("Error při přečtení dat nové zakázky. Error: " + err) }; });
            fs.readFile("../Backend_Assets/server/dashinfo.json", "utf8", (err, data) => {
                if (err) throw err
                dashdata = JSON.parse(data)
                dashdata.push(
                    {
                        "Číslo zakázky": newid
                    },
                )
                fs.writeFile("../Backend_Assets/server/dashinfo.json", JSON.stringify(dashdata), function (err) {
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
    file = "../Backend_Assets/server/" + project + "/data.json"
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
    const { project } = req.params
    const { value } = req.params
    file = "../Backend_Assets/server/" + project + "/data.json"
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
                newactivity['Datum provedení'] = datum
                newactivity['Popis činnosti'] = obj[0]
                newactivity['Zapisovatel'] = obj[1]
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
    const data = "Jméno: " + name + "\nTitle:" + decodeURIComponent(title) + "\nBody:" + decodeURIComponent(body) + "\n" + "______________________\n"
    fs.appendFile("../Backend_Assets/issues.txt", data, () => {
        WriteToLog('Přidán nový problém od ' + name)
        res.status(200).send('Ok')
    })
})
app.post("/datasync/", (req, res) => {
    index = ["nazevzakazky", "katastralniuzemi", "stavebnik", "status", "studie", "projekt", "inzenyring", "archivace"]
    formattedindex = ["Název Zakázky", "Katastr", "Stavebník", "Status", "Studie", "Projekt", "Inženýring", "Archivace"]
    fs.readFile("../Backend_Assets/templates/idname.json", "utf8", (err, data) => {
        obj = JSON.parse(data)
        object = obj['id']
        for (var i = 1; i < object.length; i++) {
            jmeno = '../Backend_Assets/server/' + object[i] + '/data.json'
            bruh = object[i]
            RF1(jmeno, bruh)
            function RF1(jmeno, bruh) {
                fs.readFile(jmeno, "utf8", (err, obsah) => {
                    objekt = JSON.parse(obsah)
                    RF2(jmeno, bruh)
                    function RF2(jmeno, bruh) {
                        for (var u = 0; u < countObjectKeys(objekt); u++) {
                            RF3(jmeno, bruh)
                            function RF3(jmeno, bruh) {
                                compare = Object.keys(objekt)[u]
                                if (index.indexOf(compare) > -1) {
                                    val = objekt[compare]
                                    RF4(bruh, val)
                                    function RF4(bruh, val) {
                                        result = compare;
                                        fs.readFile("../Backend_Assets/server/dashinfo.json", "utf8", (err, dashdata) => {
                                            object = JSON.parse(dashdata)
                                            tag = formattedindex[index.indexOf(result)]
                                            for (var i = 0; i < object.length; i++) {
                                                otc = object[i]
                                                if (otc["Číslo zakázky"] == bruh) {
                                                    if (val != "nodata") {
                                                        otc[tag] = val;
                                                    }
                                                    else {
                                                        otc[tag] = undefined
                                                    }
                                                    fs.writeFile('../Backend_Assets/server/dashinfo.json', JSON.stringify(object), err => {
                                                        if (err) {
                                                            WriteToLog("Error při psaní do DASHINFO. Err: " + err)
                                                        }
                                                        res.status(200).send('Ok')
                                                    });
                                                }
                                            }
                                        })
                                    }
                                }
                            }
                        }
                    }

                })
            }
        }
    })
})
app.post("/newuser/:jmeno/:role/:heslo", (req, res) => {
    const { jmeno } = req.params
    const { role } = req.params
    const { heslo } = req.params
    fs.readFile("../Backend_Assets/server/login.json", "utf8", (err, data) => {
        obj = JSON.parse(data)
        newuser = {}
        newjmeno = jmeno.toLowerCase().replace(/\s/g, '')
        newheslo = crypto.SHA256(heslo.toString()).toString()
        newuser[newjmeno] = newheslo
        newuser['role_' + newjmeno] = role
        newuser['jmeno_' + newjmeno] = jmeno
        obj.push(newuser)
        fs.writeFile('../Backend_Assets/server/login.json', JSON.stringify(obj), err => {
            res.status(200).send("Ok")
        })
    })
})
app.post("/newadressbookentry/", (req, res) => {
    fs.readFile("../Backend_Assets/server/adressbook.json", "utf8", (err, data) => {
        data = JSON.parse(data)
        newdata = {}
        data.push(newdata)
        fs.writeFile("../Backend_Assets/server/adressbook.json", JSON.stringify(data), err => {
            if (err) {
                WriteToLog(err);
            }
            res.status(200).send()
        });
    })
})
app.post("/newadressbookdata/:index/:element/:value", (req, res) => {
    const { index } = req.params
    const { element } = req.params
    const { value } = req.params
    fs.readFile("../Backend_Assets/server/adressbook.json", "utf8", (err, data) => {
        parseddata = JSON.parse(data)
        if (index == "true") {
            parseddata[parseddata.length - 1][element.toString()] = value
        }
        else {
            parseddata[parseInt(index)][element.toString()] = value
        }
        fs.writeFile("../Backend_Assets/server/adressbook.json", JSON.stringify(parseddata), err => {
            if (err) {
                WriteToLog(err);
            }
            res.status(200).send()
        });
    })
})
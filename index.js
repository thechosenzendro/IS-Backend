//Inicializace všech potřebných modulů + proměnných
var express = require("express");
var app = express();
var fs = require('fs');
var cors = require('cors')
var port = 8080;
var frontend = "http://127.0.0.1:5500"
app.listen(port, () => console.log("Vše funguje na localhost:" + port));
//Middleware
app.use(express.json());

//Nastavování pravidel CORS
var corsOptions = {
    origin: frontend,
    optionsSuccessStatus: 200
}

//Request souboru z ./server
app.get("/file/:filename", cors(corsOptions), (req, res) => {
    const { filename } = req.params
    fs.readFile("./server/" + filename, "utf8", (err, data) => {
        if (err) {
            res.status(400).send(err);
            console.log("Error: " + err)
            return;
        }
        res.status(200).send(data)
        console.log("Data poslána: " + filename)

    })
})
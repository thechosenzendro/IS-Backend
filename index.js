//Inicializace všech potřebných modulů + proměnných
const express = require("express");
const app = express();
const fs = require('fs');
const port = 8080;
app.listen(port, () => console.log("Vše funguje na localhost:" + port));
//Middleware
app.use(express.json());

//Request souboru z ./server
app.get("/file/:filename", (req, res) => {
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
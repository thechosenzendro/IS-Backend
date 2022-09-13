const express = require("express");
const app = express();
const port = 8080;
app.listen(port, () => console.log("Vše funguje na localhost:" + port));

app.use(express.json());

app.post("/auth", (req, res) => {
    const { username } = req.body;
    const { password } = req.body;
    res.status(200).send({
        message: "jj"
    })
    console.log("Username: " + username + ", Password: " + password)
})
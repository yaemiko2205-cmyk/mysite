const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Подключение к PostgreSQL через переменную окружения
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Создаем таблицу, если ее нет
pool.query(`
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT,
        password TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`)
.then(() => console.log("Таблица users готова"))
.catch(err => console.error("Ошибка при создании таблицы:", err));

app.post("/submit", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Сохраняем данные в базу
        await pool.query(
            "INSERT INTO users (username, password) VALUES ($1, $2)",
            [username, password]
        );

        // Получаем все записи для отображения
        const result = await pool.query("SELECT * FROM users ORDER BY id DESC");

        // Формируем таблицу HTML
        let rows = result.rows.map(u =>
            `<tr>
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>${u.password}</td>
                <td>${u.created_at}</td>
            </tr>`
        ).join("");

        res.send(`
            <h2>Данные сохранены в БД</h2>
            <table border="1" cellpadding="5" cellspacing="0">
                <tr>
                    <th>ID</th>
                    <th>Логин</th>
                    <th>Пароль</th>
                    <th>Дата</th>
                </tr>
                ${rows}
            </table>
            <br>
            <a href="/">Назад</a>
        `);

    } catch (err) {
        console.error(err);
        res.send("<h2>Ошибка при сохранении данных</h2><a href='/'>Назад</a>");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));

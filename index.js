/**
   Настройки
*/
const PORT = 3000
const UPLOAD_PATH = __dirname + '/public_html/uploads/'
const DB_CONFIG = {
    host: "localhost",
    user: "root",
    database: "test_file_uploader",
    password: 'Licey1553'
};



const express = require('express');
const mysql = require('mysql')
const fileUpload = require('express-fileupload');

const app = express()

// Папка public_html теперь обрабатывается как обычный статический сайт
app.use(express.static('public_html'))
app.use(fileUpload({ createParentPath: true })) // enable files upload
app.use(express.json());

/** 
    Обработка POST-запросов по адресу ... /api/upload
    в форме должен быть указан этот адрес: <form action='/api/upload'
*/
app.post('/api/upload', function(req, res) {
    try {
        if (!req.files) res.send('ERROR. No file uploaded');
        
        let files = req.files.many_files; // так как мы пишем <input name="many_files" 
        if (files.length > 1)
            files.forEach(function(file, index){
                file.mv(UPLOAD_PATH + file.name); 
            })
        else{
                files.mv(UPLOAD_PATH + files.name); 
        }
        res.send( {errors: null, data: files.name, message: 'OK'} );
        
    } catch (err) {
        console.log(err)
        res.status(500).send({errors: err, data: 'ERROR', message: 'ERROR'});
    }
});

/** 
    Перенаправление запроса к базе данных
*/
app.post('/api/sql', function(req, res) {
    
    const {query, inserts} = req.body
    console.log('formated:', mysql.format(query, inserts))
    
    const conn = mysql.createConnection(DB_CONFIG)
    conn.query(query, inserts, (errors, data, fields) => {
        console.log(errors)
        res.send(JSON.stringify({errors, data, fields}));
    });
    conn.end();
});

app.listen(PORT, function() {
    console.log('Server started at ', PORT, ' port')
})
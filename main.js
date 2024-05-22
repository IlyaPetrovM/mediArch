//electronApp.js
/**
   Настройки
*/

const express = require('express');
const mysql = require('mysql')
const fileUpload = require('express-fileupload');


const config  = require('./config')
const recognizeAudio = require('./recognizeAudio')

const appExp = express()

// Папка public_html теперь обрабатывается как обычный статический сайт
appExp.use(express.static(__dirname + '/public_html'))
appExp.use(fileUpload({ createParentPath: true })) // enable files upload
appExp.use(express.json());

/** 
    Обработка POST-запросов по адресу ... /api/upload
    в форме должен быть указан этот адрес: <form action='/api/upload'
*/
appExp.post('/api/upload', function(req, res) {
    try {
        if (!req.files) res.send('ERROR. No file uploaded');
        
        let files = req.files.many_files; // так как мы пишем <input name="many_files" 
        if (files.length > 1)
            files.forEach(function(file, index){
                file.name = Buffer.from(file.name, 'latin1').toString('utf8');
                file.mv(config.UPLOAD_PATH + 'newFile' + transliterate(file.name)); 
            })
        else{
                files.name = Buffer.from(files.name, 'latin1').toString('utf8');
                files.mv(config.UPLOAD_PATH + transliterate(files.name)); 
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
appExp.post('/api/sql', function(req, res) {
    
    const {query, inserts} = req.body
    console.log('formated:', mysql.format(query, inserts))
    
    const conn = mysql.createConnection(config.DB)
    conn.query(query, inserts, (errors, data, fields) => {
        console.info('DATA:')
        console.info(data)
        if (errors) console.error(errors)
        res.send(JSON.stringify({errors, data, fields}));
    });
    conn.end();
});


/** 
    Перенаправление запроса к базе данных возвращение только данных таблицы
*/
appExp.post('/api/sql/dataOnly', function(req, res) {
    
    const {query, inserts} = req.body
    console.log('formated:', mysql.format(query, inserts))
    
    const conn = mysql.createConnection(config.DB)
    conn.query(query, inserts, (errors, data, fields) => {
        console.info('DATA:')
        console.info(data)
        if (errors) console.error(errors)
        res.send(JSON.stringify(data));
    });
    conn.end();
});

/** 
    Перенаправление запроса к базе данных
*/
appExp.post('/api/speech-recognition', function(req, res) {
    
    const {inputPath, fragmentDuration} = req.body
    
    recognizeAudio('public_html/' + inputPath, 'temp_audio/', fragmentDuration, function(data){
        console.log('\n  Удалось обработать кусочки:', data)
        res.send(JSON.stringify({data}))
    })
});

appExp.listen(config.PORT, function() {
    console.log('Server started at ', config.PORT, ' port')
})


const alphabet = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z","х":"h","ъ":"","Ф":"F","Ы":"I","В":"V","А":"A","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"","б":"b","ю":"yu", ' ':'_'};

function transliterate(word){
    
  return word.split('').map(function (char) { 
    return alphabet[char] || char; 
  }).join("");
}


const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadURL('http://localhost:'+config.PORT+"/index.html")
}

app.whenReady().then(() => {
  createWindow()
})
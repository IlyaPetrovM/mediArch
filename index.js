/**
   Настройки
*/

const express = require('express');
const mysql = require('mysql')
const fileUpload = require('express-fileupload');
const fs = require('fs');

const session = require('express-session')
const crypto = require('crypto')


const config  = require('./config')
const users  = require('./users')
const recognizeAudio = require('./recognizeAudio')

const app = express()

// Папка public_html теперь обрабатывается как обычный статический сайт

app.use(fileUpload({ 
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: "/tmp/"
 })) // enable files upload
app.use(express.json());

// Инициализация express-session
app.use(session({
  secret: crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: true,
  cookie: {
    // maxAge: 1000 // 5 minutes
  }
}));

app.get('/index.html',(req, res)=>{
    console.log('INDEX')
    res.sendFile(__dirname + '/public_html/index.html');
})

app.post('/api/login', (req, res) => {
    const {username, password} = req.body;
    console.log(username, password)

    // аутентификация. поиск в базе
    const user = users.find(user => user.username === username && user.password === password);
    if(user) {
        req.session.user = user;
        // req.session.cookie.maxAge = 500;
        res.send( {errors: null, data: 'ok', message: 'OK'} );
    }else{
         res.send( {errors: true, data: null, message: 'no auth. user does not found'} );
    }
})

app.get('/js/*.js', (req, res) => {
    res.sendFile(__dirname + '/public_html' + req.path);
})

app.get('/style/*', (req, res) => {
    res.sendFile(__dirname + '/public_html' + req.path);
})

app.use((req, res, next) => {
    // Здесь вы можете добавить вашу логику проверки условий
    console.log('Проверка!')
    console.log(req.session)

    if (!req.session.user) {
        console.log('Пользователь не авторизован!')
        // Если условие не выполнено, отправляем сообщение об ошибке
        return res.redirect('/index.html');
    }
    // Если условие выполнено, переходим к следующему middleware
    next();
})

app.use(express.static('public_html'))
app.use('/uploads', express.static(config.UPLOAD_PATH));

app.post('/api/session/username', (req, res)=>{
    res.send({errors: null, data: req.session.user.username})
})

app.post('/api/session/end', (req, res)=>{
    req.session.destroy();
    // return res.redirect('/index.html');    
    res.send( {errors: null, data: 'ok', message: 'OK'} );
})




/** 
    Обработка POST-запросов по адресу ... /api/upload
    в форме должен быть указан этот адрес: <form action='/api/upload'
*/
app.post('/api/upload', async function(req, res) {

    try {
         console.info('-----------file upload Start----------');
        if (!req.files) res.send('ERROR. No file uploaded');
        
        let files = req.files.many_files; // так как мы пишем <input name="many_files" 
        if (files.length > 1)
            files.forEach(function(file, index){
                file.name = Buffer.from(file.name, 'latin1').toString('utf8');
                let filePath = config.UPLOAD_PATH + 'newFile' + transliterate(file.name);
                file.mv(filePath);
                console.info('filePath:',filePath);
//                let fct = getFileCreationTime()
            })

        else{
                files.name = Buffer.from(files.name, 'latin1').toString('utf8');
                let filePath = config.UPLOAD_PATH + transliterate(files.name);
                console.log(filePath);
                files.mv(filePath);
//                let fctime = await getFileCreationTime(filePath)
//                console.log('METADATA:', await fileMetadata('index.js'));
        }
        res.send( {errors: null, data: files.name, message: 'OK'} );
        // console.log('SESSION: ',req.session.user)
        
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
    
    const conn = mysql.createConnection(config.DB)
    conn.query(query, inserts, (errors, data, fields) => {
        console.info('DATA:')
        console.info(data)
        if (errors) console.error(errors)
        res.send(JSON.stringify({errors, data, fields}));
    });
    conn.end();
});

app.get('/api/servertime', (req, res) => {
    const serverTime = new Date().toLocaleTimeString();
    console.log(new Date(), serverTime);
    res.send(serverTime);
});

/** 
    Перенаправление запроса к базе данных возвращение только данных таблицы
*/
app.post('/api/sql/dataOnly', function(req, res) {
    
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
app.post('/api/speech-recognition', function(req, res) {
    
    const {inputPath, fragmentDuration, recId} = req.body
    
    recognizeAudio('public_html/' + inputPath, 'temp_audio/', recId, fragmentDuration, function(fragments){
        console.log('\n  Удалось обработать кусочки:', fragments)
        //todo sql-запрос

//        text = ''
//        for (let i in fragments){
//            text += i + ':'+ fragments[i].recognitionResults.variant[0]._ + ' '
//        }
//
        const conn = mysql.createConnection(config.DB)
//        conn.query(`UPDATE files SET recognizedText= concat_ws(recognizedText, '${text}') WHERE id=${recId}`, (errors, data, fields) => {
//            if (errors) console.error(errors);
//            console.log(text, '--- ЗАПИСАН')
//        });
        conn.query(`UPDATE files SET recognitionStatus='Готово' WHERE id=${recId}`, (errors, data, fields) => {
            if (errors) console.error(errors);
            console.log('Статус ГОТОВО')
        });
        conn.end();

        res.send(JSON.stringify({fragments}))
    })
});

app.listen(config.PORT, function() {
    console.log('Server started at ', config.PORT, ' port')
})


const alphabet = {
    "Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'",
    "ё":"yo",
    "й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z",
    "х":"h","ъ":"","Ф":"F","Ы":"I","В":"V","А":"A","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E",
    "ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e",
    "Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU",
    "я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"","б":"b","ю":"yu",
    ' ':'_'};

/**
 * Преобразует кириллицу в латиницу
 * @param {String} word 
 * @returns 
 */
function transliterate(word){
    
  return word.split('').map(function (char) { 
    return alphabet[char] || char; 
  }).join("");
}
///**
// * @brief getFileCreationTime
// * @param
// * @return
// */
//// LOOK!   https://github.com/exif-js/exif-js
//function getFileCreationTime(filePath) {
//
//  return new Promise((resolve, reject) => {
//    fs.stat(filePath, (err, stats) => {
//      if (err) {
//        reject(err);
//      } else {
//          console.log('time129:\n',stats.ctime,'\n', stats.mtime);
//        resolve(stats.birthtime);
//      }
//    });
//  });
//}

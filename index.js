/**
   Настройки
*/
// export NODE_OPTIONS=--max-old-space-size=4096;

const v8 = require('v8');
v8.setFlagsFromString('--max-old-space-size=4096');

const express = require('express');
const mysql = require('mysql')

const fs = require('fs');

const pump = require('pump');

const fileUpload = require('express-fileupload');
// const multer = require('multer'); // alternative to express-fileupload


const session = require('express-session')
const crypto = require('crypto')


const config  = require('./config')
const users  = require('./users')
const recognizeAudio = require('./recognizeAudio');
const { pipeline } = require('stream');

const app = express()

// Папка public_html теперь обрабатывается как обычный статический сайт

app.use(fileUpload({ 
    createParentPath: true,
    limits: { fileSize: 1000 * 1024 * 1024 * 1024 },
    uploadTimeout:0
 })) // enable files upload
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended:true }));

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
    // console.log('INDEX')
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



// const storage = multer.diskStorage({
//     destination: function(req, file, cb){
//         cb(null, config.UPLOAD_PATH);
//     },
//     filename: function(req, file, cb){
//         cb(null, file.originalname);
//     }
// })

// const upload = multer({ storage:storage })
const CHUNKS_DIR = config.CHUNKS_DIR;

// app.use('/uploads', express.static(CHUNKS_DIR));



/** 
    Обработка POST-запросов по адресу ... /api/upload
    в форме должен быть указан этот адрес: <form action='/api/upload'
*/
app.post('/api/upload', function(req, res) {
    console.info('\n-----------file upload Start----------');
    try {
        // console.info('\n');
        
        if (req.files == null || req == undefined || req.files == undefined) res.send('ERROR. No file uploaded');

        let files = req.files.many_files; // так как мы пишем <input name="many_files" 
        if (files.length > 1){
            files.forEach(function(file, index){
                file.name = Buffer.from(file.name, 'latin1').toString('utf8');
                let filePath = config.UPLOAD_PATH + 'newFile' + transliterate(file.name);
                file.mv(filePath);
                console.info('filePath:',filePath);
            })
        }else{
                
                console.info( 'пользователь: ', req.session.user.username); //req.session.user.username
                console.info(files.name);

                files.name = Buffer.from(files.name, 'latin1').toString('utf8');
                let filePath = config.UPLOAD_PATH + transliterate(files.name);
                console.info('new filePath:',filePath);
                files.mv(filePath);
        }
        res.send( {errors: null, data: files.name, message: 'OK'} );
        // console.log('SESSION: ',req.session.user)
        
    } catch (err) {
        console.error( new Date().toLocaleString(),'Произошла ошибка у пользователя: ', req.session.user.username);
        console.error(err)
        res.status(500).send({errors: err, data: 'ERROR', message: 'ERROR '});
    }
});




/**
 * 
 * @param {String} filePath 
 * @returns 
 */
function calculateHash(filePath) {
    const fileData = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileData).digest('hex');
    return hash;
}

app.get('/api/file/size', (req, res)=>{
    const { filename } = req.query;
    const filepath = config.UPLOAD_PATH + filename;
    console.log('file: ', filepath);
    try{
        const stats = fs.statSync(filepath);
        const fileSizeInBytes = stats.size;
        console.log('size: ', fileSizeInBytes);
        res.send(JSON.stringify({fileSizeInBytes: fileSizeInBytes}));
    }catch(err){
        res.send('0');
        console.error(err);
    }
});


app.get('/api/file/hash', (req, res)=>{
    const { filename } = req.query;
    const filepath = config.UPLOAD_PATH + filename;
    const hash = calculateHash(filepath)
    console.log('file: ', filepath);
    console.log('hash: ', hash)
    res.send(String(hash));
});


/**
 * Клиент может проверить, существует ли чанк на сервере
 */
app.get('/api/upload/chunk/isLoaded/', (req, res)=>{


    const { query:{totalChunks, currnetChunk, filename} } = req;
    filenameLatin = transliterate(filename)
    const chunkFileName = `${filenameLatin}.${currnetChunk}`;
    const chunkPath = `${CHUNKS_DIR}/${chunkFileName}`;
    
    console.log(chunkPath);
    if(fs.existsSync(chunkPath)){
        res.send('true');
    }else{
        res.send('false');
    }
})



app.post('/api/upload/chunks', function(req, res) {

    const { files: {file}, body:{totalChunks, currnetChunk, filename} } = req;
    filenameLatin = transliterate(filename)
    const chunkFileName = `${filenameLatin}.${currnetChunk}`;
    const chunkPath = `${CHUNKS_DIR}/${chunkFileName}`;
    
    console.log(chunkPath);
    if(fs.existsSync(chunkPath)) {
        if(+currnetChunk === +totalChunks){
            assembleChunks(filenameLatin, totalChunks)
                .then(() => res.send({errors: null, data: filenameLatin, message: 'Chunk success 177'}))
                .catch((err) => {
                    console.error('Err ass 179');
                    console.error(err);
                    res.status(500).send({errors: err, data: "ERR", message: 'err 180'});
                });
        } else {
            res.send({errors: null, data: chunkPath, message: 'Chunk exists 146'} );
        }
        return;
    }
    file.mv(chunkPath, err => {
        if(err){
            console.error(err);
        }else{
            if(+currnetChunk === +totalChunks){
                assembleChunks(filenameLatin, totalChunks)
                    .then(() => res.send({errors: null, data: filenameLatin, message: 'Chunk success 177'}))
                    .catch((err) => {
                        console.error('Err ass 179');
                        console.error(err);
                        res.status(500).send({errors: err, data: "ERR", message: 'err 180'});
                    });
            } else {
                res.send({errors: null, data: chunkPath, message: 'Chunk success 146'} );
            }
        }
    })

})

async function assembleChunks(filename, totalChunks){
    const filePath = config.UPLOAD_PATH + filename;
    const out = fs.createWriteStream(filePath);
    for(let i = 1; i <= totalChunks; i++){
       
        const chunkPath = `${CHUNKS_DIR}/${filename}.${i}`;
        const chunk = fs.readFileSync(chunkPath);
        out.write(chunk);
        fs.unlink(chunkPath, (err)=> {if(err)console.error(err)});
    }
    out.end();
    // const chunkPath = `${CHUNKS_DIR}/${filename}.${totalChunks}`;
    // await fs.createReadStream(chunkPath).pipe(out, { end: true });
    // fs.unlink(chunkPath, (err)=> {if(err)console.error(err)});
}









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

        const conn = mysql.createConnection(config.DB)

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

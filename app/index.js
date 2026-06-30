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
    // username здесь — это email выбранного пользователя
    const {username, password} = req.body;
    console.log(username, password)

    // аутентификация. поиск в базе данных
    const conn = mysql.createConnection(config.DB);
    conn.query(
        'SELECT id, last_name, first_name, email FROM users WHERE email = ? AND password = ?',
        [username, password],
        (errors, results) => {
            conn.end();
            if(!errors && results && results.length > 0) {
                const u = results[0];
                req.session.user = {
                    id: u.id,
                    email: u.email,
                    last_name: u.last_name,
                    first_name: u.first_name,
                    fullName: (u.last_name + ' ' + u.first_name).trim()
                };
                res.send( {errors: null, data: 'ok', message: 'OK'} );
            } else {
                if(errors) console.error(errors);
                res.send( {errors: true, data: null, message: 'no auth. user does not found'} );
            }
        }
    );
})

// Список пользователей для выпадающего списка на странице входа
app.get('/api/users', (req, res) => {
    const conn = mysql.createConnection(config.DB);
    conn.query(
        'SELECT id, last_name, first_name, email FROM users ORDER BY last_name, first_name',
        (errors, results) => {
            conn.end();
            if(errors) {
                console.error(errors);
                return res.send({errors: errors, data: []});
            }
            res.send({errors: null, data: results});
        }
    );
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
    res.send({errors: null, data: req.session.user.fullName})
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
                
                console.info( 'пользователь: ', req.session.user.fullName);
                console.info(files.name);

                files.name = Buffer.from(files.name, 'latin1').toString('utf8');
                let filePath = config.UPLOAD_PATH + transliterate(files.name);
                console.info('new filePath:',filePath);
                files.mv(filePath);
        }
        res.send( {errors: null, data: files.name, message: 'OK'} );
        // console.log('SESSION: ',req.session.user)
        
    } catch (err) {
        console.error( new Date().toLocaleString(),'Произошла ошибка у пользователя: ', req.session.user.fullName);
        console.error(err)
        res.status(500).send({errors: err, data: 'ERROR', message: 'ERROR '});
    }
});




/**
 * @param {String} filePath
 * @returns
 */
function calculateHash(filePath) {
    const fileData = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileData).digest('hex');
    return hash;
}


const http = require('http');
const https = require('https');

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
 * @brief Вспомогательная функция для POST запроса
 */
function postToService(url, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = JSON.stringify(data);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = protocol.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (e) {
                    resolve({ raw: responseData });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(postData);
        req.end();
    });
}


/**
 * @brief Инициировать распознавание через master-wisper
 */
app.post('/api/transcription/start', async (req, res) => {
    try {
        const { file_id } = req.body;

        if (!file_id) {
            return res.status(400).send({ errors: 'file_id is required' });
        }

        const conn = mysql.createConnection(config.DB);

        conn.query('SELECT name FROM files WHERE id = ?', [file_id], async (err, results) => {
            if (err || !results || results.length === 0) {
                conn.end();
                return res.status(404).send({ errors: 'File not found' });
            }

            const filename = results[0].name;
            const fileUrl = config.FILE_STORAGE_URL + '/api/files/' + filename;

            const payload = {
                file_id: file_id,
                url: fileUrl,
                model_size: 'bzikst/faster-whisper-large-v3-russian-int8',
                format: 'json',
                min_mark_duration_ms: 60000
            };

            try {
                const wisperUrl = config.MASTER_WISPER_URL + '/transcribe';
                const wisperData = await postToService(wisperUrl, payload);
                conn.end();
                res.send({ errors: null, data: wisperData });
            } catch (fetchErr) {
                conn.end();
                console.error('Error calling master-wisper:', fetchErr);
                res.status(500).send({ errors: 'Failed to call master-wisper service' });
            }
        });
    } catch (err) {
        console.error('Error in /api/transcription/start:', err);
        res.status(500).send({ errors: err.message });
    }
});


/**
 * @brief Получить статус задачи транскрибации
 */
app.get('/api/transcription/status', (req, res) => {
    try {
        const { file_id } = req.query;

        if (!file_id) {
            return res.status(400).send({ status: null, task_id: null });
        }

        const conn = mysql.createConnection(config.DB);

        conn.query(
            'SELECT status, task_id FROM transcribtion_tasks WHERE file_id = ? ORDER BY created_at DESC LIMIT 1',
            [file_id],
            (err, results) => {
                conn.end();

                if (err) {
                    console.error('DB Error:', err);
                    return res.send({ status: null, task_id: null });
                }

                if (results && results.length > 0) {
                    res.send({ status: results[0].status, task_id: results[0].task_id });
                } else {
                    res.send({ status: null, task_id: null });
                }
            }
        );
    } catch (err) {
        console.error('Error in /api/transcription/status:', err);
        res.send({ status: null, task_id: null });
    }
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

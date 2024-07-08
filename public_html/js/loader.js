uploadButton.addEventListener('click', load)

//Перехватываем событие отправки формы, чтобы нас не перенаправляло на другие страницы
loaderForm.addEventListener('submit', (e) => {
    e.preventDefault(); // запрещаем распространение события после исполнения нашей функции
    return false;
})


let USERNAME = null;
fetch('/api/session/username', {
    method:'POST', headers: { 'Content-Type': 'application/json'},
}).then(res => res.json())
.then(json => {
    USERNAME = json.data;
})


// let response = await fetch('/api/sql', {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//         'query': query,
//         'inserts': inserts
//     })
// });
// if (response.ok) {
//     return await response.json();
// }

/** 
   Общее
    Печать в текстовом поле
*/
function print(t) {
    filesReadyList.innerHTML = t + '\n' + filesReadyList.innerHTML;
}




/** 
Загрузка
    Загрузка нескольких файлов
    https://stackforgeeks.com/blog/html5-read-video-metadata-of-mp4
*/
async function load() {
    let files = filesInput.files;
    print('-- ЗАГРУЖАЕМ --')

    for (let i = 0; i < files.length; i++) {
        print(`... грузим на сервер ...`)
        let load_res = await loadFileXhr(files[i], progressPrint); // с помощью await ждём загрузки каждого файла по отдельности
        print(`... загружен на сервер ...`)
        let fext = getUrlExtention(files[i].name)
        let ftype = getFileType(fext)
        print(`... читаем мета-информацию файла ...`)

        let exif = await getExif(files[i]);
        let exif_str = JSON.stringify(exif);

        const avmeta = await getAVmetadata(files[i]);
        if (exif_str.length == 2) exif_str = JSON.stringify(avmeta)


        let  {dateCreatedUTC, dateCreatedLOCAL, dateUpdatedLOCAL} = getDateCreation(files[i], exif, avmeta);
        console.log({dateCreatedUTC, dateCreatedLOCAL, dateUpdatedLOCAL});
        let gps = getGPSCoords(exif)

        let deviceModel = (exif.Make) ? (exif.Make + '_' + exif.Model) : null;
        
        print(`... заносим информацию в БД ...`)
        const sql_res = await sql('INSERT INTO ?? (??) VALUES ( ? ) ',
            ['files', [ 'event_id', 'user_created','oldName', 'name', 'fileExt', 'filetype', 'file_created_UTC', 'file_created_LOCAL','file_updated_LOCAL', 'deviceModel', 'gps_str', 'exif'],
                [ selectEvents.value ? selectEvents.value : undefined,
                    USERNAME, 
                    files[i].name,
                 transliterate(files[i].name),
                 fext,
                 ftype,
                 dateCreatedUTC,
                 dateCreatedLOCAL,
                 dateUpdatedLOCAL,  // Может врать! В видео записыватся UTC, а в телефоне, например локальное время!
                 deviceModel,
                 gps,
                 exif_str]]);

        if (load_res.errors) print('!!! Ошибка загрузки файла')
        if (sql_res.errors) print('!!! Ошибка выполнения SQL-запроса')

        print(`id ${sql_res.data.insertId}. ${load_res.data}\tOK`);
    }
    print(`-- ГОТОВО --`);

}


/**
 * @brief Определяет дату создания файла по различным признакам
 * @param [in] File file - файл, дату которого нужно определить
 * @param [in] JSON exif данные EXIF - для фотографии
 * @param [in] JSON avmeta метаданные, получаемые в основном для аудио и видео
 * @return Возвращает дату в формате 2024-02-20 15:34:05 UTC
 */
function getDateCreation( file, exif, avmeta) {
     console.log([[exif.GPSDateStamp, exif.GPSTimeStamp ],
        avmeta.media.track[0].Tagged_Date,
        avmeta.media.track[0].Encoded_Date,
        exif.DateTime,
        exif.DateTimeOriginal,
        file.lastModified        ]);

    let dateCreatedUTC = getGPSdate(exif) ||     // GPS-дата задаётся в часовом поясе  UTC
        avmeta.media.track[0].Tagged_Date ||     // "2024-02-20 15:34:05 UTC" // UTC
        avmeta.media.track[0].Encoded_Date;     // "2024-02-20 15:34:05 UTC" // UTC

    let dateCreatedLOCAL = exif.DateTime ||     // 2024:02:21 09:37:57       // local - фотоаппарата (но неизвестно как он был настроен)
        exif.DateTimeOriginal;                // 2024:02:21 09:37:57       // local - фотоаппарата (но неизвестно как он был настроен)
    if (dateCreatedUTC){
        dateCreatedUTC = dateCreatedUTC.substr(0,dateCreatedUTC.length-3);
    }

    let dateUpdatedLOCAL;
    if (file.lastModified){
        dateUpdatedLOCAL = luxon.DateTime.fromMillis(file.lastModified).toFormat('yyyy-MM-dd hh:mm:ss');
        console.log(dateUpdatedLOCAL);
    }
    return {dateCreatedUTC, dateCreatedLOCAL, dateUpdatedLOCAL };
}
function getGPSdate(exif){
    if (exif.GPSDateStamp == undefined) {return undefined;}
    const dp = exif.GPSDateStamp.split(':');
    console.log([dp,Number.parseInt(dp[0]), // year
                                 Number.parseInt(dp[1]), // month
                                 Number.parseInt(dp[2]), // day
                                 Number.parseInt(exif.GPSTimeStamp[0]),   // hour
                                 Number.parseInt(exif.GPSTimeStamp[1]),    // minute
                                 Number.parseInt(exif.GPSTimeStamp[2])]);

    let gps = luxon.DateTime.utc(Number.parseInt(dp[0]), // year
                                 Number.parseInt(dp[1]), // month
                                 Number.parseInt(dp[2]), // day
                                 Number.parseInt(exif.GPSTimeStamp[0]),   // hour
                                 Number.parseInt(exif.GPSTimeStamp[1]),    // minute
                                 Number.parseInt(exif.GPSTimeStamp[2]) ).toFormat('yyyy-MM-dd hh:mm:ss')   // second                     // milliseconds
    console.log(gps);
    if(gps == 'Invalid DateTime') return undefined;
    return gps+ ' UTC';
}

/**
 * @brief Формирует временной сдвиг для временной зоны в формате +03:00
 * @param [in|out] Date date дата
 * @return Строка - временной сдвиг для временной зоны в формате "+03:00"
 */
function getTimezoneFromJSDate(date){
    const ofst = String(date).split('GMT')[1].substring(0,5);
    return ofst.substring(0,3)+':'+ofst.substring(3,5);
}



/**
 * @brief Извлекает из EXIF данных GPS-координаты и преобразует их в пару чисел
 * @param [in] JSON exif
 * @return Широта и долгота в градусах (без минут и секунд) Соответствие сторонам света см. ниже
 */
function getGPSCoords(exif){
    // http://the-mostly.ru/konverter_geograficheskikh_koordinat.html
    /*
          N+
          |
     -W-------E+
          |
          S-
    */
    /*
        GPSLatitude
        GPSLatitudeRef
        GPSLongitude
        GPSLongitudeRef
    */
    if (exif.GPSLatitude === undefined) return undefined;
    let gps = {
        lat: undefined,
        lng: undefined
    };
    gps.lat = exif.GPSLatitude[0] + exif.GPSLatitude[1] / 60 + exif.GPSLatitude[2] / (60 * 60)
    gps.lng = exif.GPSLongitude[0] + exif.GPSLongitude[1] / 60 + exif.GPSLongitude[2] / (60 * 60)
    if (exif.GPSLatitudeRef == 'S') gps.lat = -gps.lat
    if (exif.GPSLongitudeRef == 'W') gps.lng = -gps.lng
    return gps.lat + ', ' + gps.lng;
}


/**
 * @brief Получает EXIF-данные из фотографии
 * @param [in] File file - фотография или просто файл
 * @return JSON с информацией EXIF
 */
async function getExif(file) {
    EXIF.enableXmp();
    return new Promise(resolve => {
        EXIF.getData(file, function() {
            return resolve(EXIF.getAllTags(this));
        })
    })
}

/**
* Определяет расширение файла
*/
function getUrlExtention( url ) {
  return url.split(/[#?]/)[0].split('.').pop().trim().toLowerCase();
}


/**
* Определяет тип файла по его расширению
*/
function getFileType(ext) {
    let typ = 'other'
    switch (ext.toLowerCase()) {
        case 'mkv':
        case 'mp4':
        case 'mov':
        case 'avi':
        case 'm4v':
        case 'wmv':
        case 'vp9':
            typ = 'video'
            break;
        case 'ogg':
        case 'aac':
        case 'mp3':
        case 'wav':
        case 'wma':
        case 'm4a':
            typ = 'audio'
            break;
        case 'gif':
        case 'bmp':
        case 'svg':
        case 'png':
        case 'tif':
        case 'tiff':
        case 'jpg':
        case 'jpeg':
        case 'cr2':
            typ = 'image'
            break;
        case 'xlsx':
        case 'xls':
        case 'csv':
        case 'pdf':
        case 'docx':
        case 'doc':
        case 'fb2':
        case 'djvu':
        case 'djv':
        case 'txt':
            typ = 'text'
    }

    return typ;
}


/**
   Загрузка
    Вывод промежуточных результатов процесса загрузки 
*/
async function progressPrint(event, file) {
    progressOutput.value =
        Math.ceil((event.loaded / event.total) * 10000) / 100 + '%\t-->\t' + file.name + '\n';
};

/** 
    Способ загрузки #1. 
    Загрузка одного файла. async чтобы она происходила последовательно
*/
async function loadOneFile(file){    
    const formData = new FormData();
    formData.append('many_files', file);

    let result = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    if (result.ok){
        const data = await result.json()
        console.log(data)
        return data;
    }
}

/** 
    Способ загрузки #2. 
    В параметр onprogress необходимо передать функцию с двумя параметрами event и file 
      и она будет запускаться каждый раз при загрузке очередной порции
*/
function loadFileXhr(file, onprogress){     
    return new Promise((resolve, reject) =>{
        const formData = new FormData();
        formData.append('many_files', file);
        
        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');
        xhr.upload.onprogress = (event) => {onprogress(event, file); };
        
        xhr.onload = function(){
            resolve(JSON.parse(xhr.response))
        };

        xhr.onerror = function () {
            reject({
                errors: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send(formData);
    });
}   

/**
 * @brief Превращает кириллицу в латиницу
 * @param [in|out] String word слово содержащее символы кириллицы или латиницы
 * @return Строка без кириллицы, но с латиницей
 */
function transliterate(word){
    const alphabet = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z","х":"h","ъ":"","Ф":"F","Ы":"I","В":"V","А":"A","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"","б":"b","ю":"yu", ' ':'_'};
  return word.split('').map(function (char) { 
    return alphabet[char] || char; 
  }).join("");
}


/*
    Показывает в консоли метаданные 1-го видеофайла который был прикреплён
    Используется библиотека mediainfo.js
    НЕОБХОДИМО, чтобы на один уровень выше был расположен файл MediaInfoModule.wasm
*/
async function getAVmetadata(file) {
    if (file) {
        const mediainfo = await window.MediaInfo.mediaInfoFactory();
        const readChunk = async (chunkSize, offset) =>
            new Uint8Array(await file.slice(offset, offset + chunkSize).arrayBuffer())
        const result = await mediainfo.analyzeData(file.size, readChunk);
        return result;
    }
    return undefined;
}
//
//filesInput.addEventListener('change', () => getAVmetadata(filesInput.files[0]))


const serverTime = document.getElementById('serverTime')
sql('SELECT curtime() as t').then(res => {
    console.log(res.data);
    serverTime.innerHTML = res.data[0].t;

    const browserTime = document.getElementById('browserTime')
    browserTime.innerHTML = new Date().toLocaleTimeString()
    if (browserTime.innerHTML !== serverTime.innerHTML){
        browserTime.style.color = 'red';
    }else{
        browserTime.style.color = 'green';
        serverTime.style.color = 'green';
    }
})




function addEventsToList(){
    sql(`SELECT * FROM events ORDER BY date_start DESC, id DESC`).then(res => {
        if(res.errors) return;
        console.log(res.data)
        const x = document.getElementById('selectEvents');
        const option = document.createElement('option');
        option.text = '';
        option.label = '-- выберите событие --';
        // option.label = 'Выберите событие';
        option.disabled = true;
        option.selected = true;
        x.add(option)
        
        const nullOption = document.createElement('option');
        nullOption.text = '';
        nullOption.style.color ='red';
        nullOption.label = '[ Не привязывать к событию ]';
        x.add(nullOption)
        res.data.forEach(evt => {
            const option = document.createElement('option');
            option.text = evt.id;
            option.label = evt.title + ' --- ' + luxon.DateTime.fromISO(evt.date_start).toFormat('dd.MM.yyyy');
            x.add(option)
        });
        x.onblur = (e)=>{
            console.log(e.target.value);
        }
    })


}
addEventsToList();
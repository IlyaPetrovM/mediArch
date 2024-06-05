uploadButton.addEventListener('click', load)

/** 
   Общее
    Печать в текстовом поле
*/
function print(t) {
    filesReadyList.innerHTML = t + '\n' + filesReadyList.innerHTML;
}


/** 
    Перехватываем событие отправки формы, чтобы нас не перенаправляло на другие страницы
*/
loaderForm.addEventListener('submit', (e) => {
    e.preventDefault(); // запрещаем распространение события после исполнения нашей функции
    return false;
})


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
        print(`... читаем EXIF информацию файла ...`)
        let exif = await getExif(files[i])
        let exif_str = JSON.stringify(exif)
        console.log( 'длина EXIF', exif_str.length, exif)
        
        let dateCreated = exif.DateTime
        if (dateCreated === undefined) dateCreated = exif.DateTimeOriginal
        if (dateCreated === undefined) dateCreated = luxon.DateTime.fromJSDate(files[i].lastModifiedDate).toFormat('yyyy-MM-dd hh:mm:ss');


        let gps = getGPSCoords(exif)
        console.log(gps)

        print(`... заносим информацию в БД ...`)
        const sql_res = await sql('INSERT INTO ?? (??) VALUES ( ? ) ',
            ['files', ['oldName', 'name', 'fileExt', 'filetype', 'date_created','gps_str', 'exif'],
                [files[i].name, transliterate(files[i].name), fext, ftype, dateCreated, gps, exif_str]]);

        if (load_res.errors) console.log('Ошибка загрузки файла')
        if (sql_res.errors) console.log('Ошибка выполнения SQL-запроса')

        print(`id ${sql_res.data.insertId}. ${load_res.data}\tOK`);
    }
    print(`-- ГОТОВО --`);

}


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
    if(exif.GPSLatitude === undefined) return undefined;
    let gps = {lat:undefined, lng:undefined};
    gps.lat = exif.GPSLatitude[0] + exif.GPSLatitude[1]/60 + exif.GPSLatitude[2]/(60*60)
    gps.lng = exif.GPSLongitude[0] + exif.GPSLongitude[1]/60 + exif.GPSLongitude[2]/(60*60)
    if (exif.GPSLatitudeRef == 'S') gps.lat = -gps.lat
    if (exif.GPSLongitudeRef == 'W') gps.lng = -gps.lng
    return gps.lat+', '+gps.lng;
}

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

const alphabet = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z","х":"h","ъ":"","Ф":"F","Ы":"I","В":"V","А":"A","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"","б":"b","ю":"yu", ' ':'_'};

function transliterate(word){
  return word.split('').map(function (char) { 
    return alphabet[char] || char; 
  }).join("");
}


/*
    Показывает в консоли метаданные 1-го видеофайла который был прикреплён
    Используется библиотека mediainfo.js
    НЕОБХОДИМО, чтобы на один уровень выше был расположен файл MediaInfoModule.wasm
*/
const onChangeFile = async () => {
  const file = filesInput.files[0]
  console.log(file)
  if (file) {
      console.log('Working…')
      console.log(window.MediaInfo);
      const  mediainfo = await window.MediaInfo.mediaInfoFactory();

    const readChunk = async (chunkSize, offset) =>
      new Uint8Array(await file.slice(offset, offset + chunkSize).arrayBuffer())

    mediainfo
      .analyzeData(file.size, readChunk)
      .then((result) => {
        console.log(result)
      })
      .catch((error) => {
        console.error(`An error occured:\n${error.stack}`)
      })
  }
}

filesInput.addEventListener('change', () => onChangeFile())

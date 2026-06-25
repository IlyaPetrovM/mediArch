uploadButton.addEventListener('click', load)

//Перехватываем событие отправки формы, чтобы нас не перенаправляло на другие страницы
loaderForm.addEventListener('submit', (e) => {
    e.preventDefault(); // запрещаем распространение события после исполнения нашей функции
    return false;
})


let user_created = null;
fetch('/api/session/username', {
    method:'POST', headers: { 'Content-Type': 'application/json'},
}).then(res => res.json())
.then(json => {
    user_created = json.data;
})

async function checkChunk(totalChunks, currnetChunk, filename, chunkSize) {
  const res = await fetch(
    '/api/upload/chunk/isLoaded?'+
    new URLSearchParams({
      totalChunks: totalChunks,
      currnetChunk: currnetChunk,
      filename: filename,
      chunkSize:chunkSize
    }).toString()
  );
  let ans = await res.json();
    console.log(ans)
  return JSON.parse(ans);
}

function getHash(file) {
  print('Вычисляю контрольную сумму...');
  return new Promise((resolve, reject) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const fileData = event.target.result;
        const hash = CryptoJS.SHA256(fileData).toString();
        
        resolve(hash);
      };
      reader.readAsArrayBuffer(file);

    } else {
      reject(undefined);
    }
  });
}

useCacheCheckbox.addEventListener('click', (e)=>{
  const useCache = e.target.checked;
  if(!useCache){
    const yes = confirm('Вы уверены? Скорость загрузки может увеличиться.')
    if(!yes){
      e.target.checked = true;
    }}
  console.log(useCache);
})

/**
 * 
 * @param {String} filename 
 * @returns 
 */
async function getHashFromServer(filename){
  const res = await fetch('/api/file/hash?' + new URLSearchParams({
    filename:filename
  }) );
  console.log(res)
  const hash_on_server = await res.json();
  console.log('Server hash: ', hash_on_server)
  // return 
  return JSON.parse(hash_on_server);
}


async function getRemoteFileSize(filename){
  const res = await fetch('/api/file/size?' + new URLSearchParams({
    filename:filename
  }) );
  console.log(res)
  const {fileSizeInBytes} = await res.json();
  console.log('Remote size: ', fileSizeInBytes)
  return fileSizeInBytes;
}

/**
 * Загружает один файл, разделяя его на отдельные чанки
 * @param {FileObject} file 
 */
async function loadByChunks(file){

  // Проверить, существует ли уже такой чанк на сервере


  // console.log(file, typeof(file))
  const chunkSize = 1024 * 1024 * 10; //10 MB
  const totalChunks = Math.ceil(file.size / chunkSize)+1;
  const ost = file.size - (chunkSize * totalChunks);
  console.log(file.size / chunkSize )
  let startByte = 0;
  let hash = '';
  
  try{
    for(let i=1; i <= totalChunks; i++){
      const endByte = Math.min( startByte + chunkSize, file.size );
      const chunk = file.slice( startByte, endByte );
      if(i == totalChunks) {
        print('   соединяю файл воедино... подождите (здесь может долго висеть 100%)')
      }
      
      const useCache = useCacheCheckbox.checked;
      let chunkExist = false;
      if(useCache) chunkExist = await checkChunk(totalChunks, i, file.name, chunkSize);

      if(chunkExist){
        print(`Часть файла ${file.name}.${i} уже есть сервере! -- не гружу её`)
      }else{
        await uploadChunk( chunk, totalChunks, i, file.name );
      }
      startByte = endByte;
      progressOutput.value = Math.ceil((i / totalChunks) * 10000) / 100 + '%\t-->\t' + file.name + '\n';
    }
    console.info('Upload complete')
  }catch(err){
    print('   ошибка (см консоль)')
    console.error(err)
  }

}

async function uploadChunk(chunk, totalChunks, currnetChunk, filename){
  const formData = new FormData();
  formData.append('file', chunk);
  formData.append('totalChunks', totalChunks);
  formData.append('currnetChunk', currnetChunk);
  formData.append('filename', filename);
  const response = await fetch('/api/upload/chunks',{
    method: 'POST',
    body: formData
  })
  if(!response.ok){
    throw new Error('Chunk upload failed');
  }
  if (response.ok){
    const data = await response.json()
    console.log(data)
    return data;
}
}

/** 
   Общее
    Печать в текстовом поле
*/
function print(t) {
    filesReadyList.innerHTML = t + '\n' + filesReadyList.innerHTML;
    console.info(t)
}


async function recordExists(filename){
  const res = await sql(`SELECT id FROM files WHERE oldName like '${filename}' `);
  console.log('db record', res.data, 'recordExists: ', res.data.length > 0);
  if(res.errors) return false;
  
  return res.data.length > 0;
}

/** 
Загрузка
    Загрузка нескольких файлов
    https://stackforgeeks.com/blog/html5-read-video-metadata-of-mp4
*/
async function load() {
  let files = filesInput.files;
  print('-- ЗАГРУЖАЕМ --');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    let file_id;
    try {
      let doLoad = true;
      let doSaveToDb = true;
      print(`  |____________________________________\t|`);
      print(`  | Размер файла : ${file.size} - у вас\t|`);
      let remoteFileSize = await getRemoteFileSize(transliterate(file.name));
      print(`  | Размер файла : ${remoteFileSize} - на сервере\t|`);
      print(`  _________________________________________________`);
      const fileExists = (file.size === remoteFileSize);

      const recExists = await recordExists(file.name);

      const forceLoad = !passRepeatedFilesBox.checked;
      // const forceSaveToDb = addDbRecordBox.checked;
      /**
      Варианты:
                                  doLoad        doDbRecord
          1. Файл не найден =>     Грузим,      Добавляем запись в БД 

          2. Файл найден    =>     Грузим,      Добавляем запись в БД (полное дублирование записи)
          3. Файл найден    =>  Не грузим,      Добавляем запись в БД (файл загружен другим способом)
          4. Файл найден    =>  Не Грузим,   Не Добавляем запись в БД (пропускаем повторы)
          5. Файл найден    =>     Грузим,   Не Добавляем запись в БД (обновить файл в архиве)
       */
      
      if(recExists){
        doSaveToDb = false
      }

      if(fileExists) {
        console.log('forceLoad: ', forceLoad)
        doLoad = forceLoad && confirm(`Загрузить повторно? для ${file.name} совпадают размер у вас и в архиве) `)
      }

      if(doLoad) {
        await loadByChunks(file)
      }

      if(doSaveToDb){ // doLoad ==> saveToDb;  notLoad ==> not save
            file_id = await saveToBD(file.name, transliterate(file.name), user_created );
      }else{
        continue;
      }
      
    } catch (e) {
      console.error(e);
      print(`ERR - ${file.name} - Ошибка загрузки файла`);
      continue;
    }

    try {
      let exif = await getExif(file);
      let gps = getGPSCoords(exif);
      let deviceModel = (exif.Make) ? (exif.Make + '_' + exif.Model) : null;

      const res = await sql(
        `UPDATE files SET gps_str = '${gps}', deviceModel = '${deviceModel}'  WHERE id = ${file_id}`
      );
      if (res.errors) {
        throw new Error(JSON.stringify(res.errors));
      }
    } catch (e) {
      console.error(e);
      print(`ERR - ${file.name} - Ошибка определения EXIF`);
      continue;
    }
  }
  print(`-- ГОТОВО --`);
}



// const fext = getUrlExtention(file.name)
// const ftype = getFileType(fext)
// const event_id = selectEvents.value ? selectEvents.value : undefined;
// const user_created = USERNAME;

// print(`... читаем exif-информацию файла ...`)
// // let exif = undefined;
// let exif_str = JSON.stringify(exif);

// // print(`... читаем мета-информацию видео ...`)
// const avmeta = undefined;
// // const avmeta = await getAVmetadata(files[i]);
// // if (exif_str.length == 2) exif_str = JSON.stringify(avmeta)
// let  {dateCreatedUTC, dateCreatedLOCAL, dateUpdatedLOCAL} = getDateCreation(files[i], exif, avmeta);
// console.log({dateCreatedUTC, dateCreatedLOCAL, dateUpdatedLOCAL});

//             'file_created_UTC', 'file_created_LOCAL','file_updated_LOCAL', 'deviceModel', 'gps_str'],
//     [ ,
//         USERNAME, 
//         files[i].name, transliterate(files[i].name), fext, ftype, dateCreatedUTC,
//      dateCreatedLOCAL,
//      dateUpdatedLOCAL,  // Может врать! В видео записыватся UTC, а в телефоне, например локальное время!
//      deviceModel,
//      gps
//      ]]);



/**
 * Сохраняет в БД самую необходимую инфу о загруженом файле
 * @param {String} oldName 
 * @param {String} name 
 * @returns ID загруженого файла в БД
 */
async function saveToBD(oldName, name, user_created) {
    console.log(`... заносим информацию в БД ...`);
    const selectEvents = document.getElementById('selectEvents');
    const event_id = selectEvents.value ? selectEvents.value : 'NULL';
    const fileExt = getUrlExtention(oldName)
    const filetype = getFileType(fileExt)
    const sql_res = await sql(
        `INSERT INTO files ( oldName,      name,         user_created, event_id, fileExt, filetype )  
                  VALUES ('${oldName}', '${name}' ,   '${user_created}' , ${event_id}, '${fileExt}', '${filetype}') `
    );
    if (sql_res.errors) {
        print('!!! Ошибка выполнения SQL-запроса');
        throw new Error(JSON.stringify(sql_res.errors));
    }
    const ID = sql_res.data.insertId;
    print(`OK - ${oldName} - Сохранён в базе под id ${ID}`);
    return ID ;
}



/**
 * Загружает один файл на сервер постепенно
 * @param {File} file 
 * @returns 
 */
async function loadOne(file) {
    console.log(`... грузим на сервер ...`);
    const res = await loadFileXhr(file, progressPrint); // с помощью await ждём загрузки каждого файла по отдельности
    if (res.errors) {
        throw new Error(JSON.stringify(res.errors));
    }
    print(`OK - ${file.name} - загружен на сервер ...`);
    return res;
}




/**
 * @brief Определяет дату создания файла по различным признакам
 * @param [in] File file - файл, дату которого нужно определить
 * @param [in] JSON exif данные EXIF - для фотографии
 * @param [in] JSON avmeta метаданные, получаемые в основном для аудио и видео
 * @return Возвращает дату в формате 2024-02-20 15:34:05 UTC
 */
function getDateCreation(file, exif, avmeta) {
  let dateCreatedUTC;
  let dateCreatedLOCAL;
  let dateUpdatedLOCAL;
  try {
    dateCreatedUTC =
      getGPSdate(exif) || // GPS-дата задаётся в часовом поясе  UTC
      avmeta.media.track[0].Tagged_Date || // "2024-02-20 15:34:05 UTC" // UTC
      avmeta.media.track[0].Encoded_Date; // "2024-02-20 15:34:05 UTC" // UTC

    dateCreatedLOCAL =
      exif.DateTime || // 2024:02:21 09:37:57       // local - фотоаппарата (но неизвестно как он был настроен)
      exif.DateTimeOriginal; // 2024:02:21 09:37:57       // local - фотоаппарата (но неизвестно как он был настроен)
    if (dateCreatedUTC) {
      dateCreatedUTC = dateCreatedUTC.substr(0, dateCreatedUTC.length - 3);
    }

    if (file.lastModified) {
      dateUpdatedLOCAL = luxon.DateTime.fromMillis(file.lastModified).toFormat(
        'yyyy-MM-dd hh:mm:ss'
      );
      console.log(dateUpdatedLOCAL);
    }
    return { dateCreatedUTC, dateCreatedLOCAL, dateUpdatedLOCAL };
  } catch (e) {
    console.error('getDateCreation:', e);
    return { dateCreatedUTC, dateCreatedLOCAL, dateUpdatedLOCAL };
  }
}


/**
 * Определить дату на основе EXIF данных
 * @param {Object} exif 
 * @returns 
 */
function getGPSdate(exif){
    try{
    if(exif === undefined) return;
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
}catch(e){
    console.error(e)
    return undefined;
}
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
   if(!exif) return undefined;
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
  try {
    EXIF.enableXmp();
    return new Promise((resolve) => {
      EXIF.getData(file, function () {
        return resolve(EXIF.getAllTags(this));
      });
    });
  } catch (e) {
    console.error(e);
    return undefined;
  }
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
    sql(`SELECT * FROM events ORDER BY id DESC, date_start DESC`).then(res => {
        if(res.errors) return;
        // console.log(res.data)
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
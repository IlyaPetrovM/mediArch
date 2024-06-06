///
/// КОНСТАНТЫ И КОНФИГУРАЦИЯ
///
const UPLOAD_PATH = 'uploads/'; // must en with '/'

// Запрос к таблице
const STANDARD_QUERY = `SELECT id, 
                        '>>>' as play,
                        'Просмотр' as view,
                        description, 
                        date_created_GMT,
                        date_created_timezone,
                        date_upload,
                        date_upload_timezone,
                        date_updated,
                        date_updated_timezone,
                        oldName, 
                        name, 
                        fileType,
                        fileExt,
                        'Скачать' as download,
                        'Опись' as marks
                    FROM files `;   

/**
 * Картинки для кнопок
 */
const ICON_DOWNLOAD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill-rule="evenodd" d="M7.47 10.78a.75.75 0 001.06 0l3.75-3.75a.75.75 0 00-1.06-1.06L8.75 8.44V1.75a.75.75 0 00-1.5 0v6.69L4.78 5.97a.75.75 0 00-1.06 1.06l3.75 3.75zM3.75 13a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5z"></path></svg>';

const ICON_PLAY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M9.5 15.584V8.416a.5.5 0 01.77-.42l5.576 3.583a.5.5 0 010 .842l-5.576 3.584a.5.5 0 01-.77-.42z"></path><path fill-rule="evenodd" d="M12 2.5a9.5 9.5 0 100 19 9.5 9.5 0 000-19zM1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12z"></path></svg>';

const ICON_TEXT = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-text" viewBox="0 0 16 16"> <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/> <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/> </svg>';

/**
 * Форматирование колонок таблицы
 */
const FORMAT_FILES_COLUMNS = [
    //id
    {
        field: 'id', 
        width:40 ,
        hozAlign:  "center",
    },
    //description
    {
        field: 'description', 
        editor: 'list',
        width:250 ,
        editorParams:{autocomplete:"true", allowEmpty:true,listOnEmpty:true, valuesLookup:true, freetext:true},
        cellEdited: async function (cell){ 
            let res = await sql( `UPDATE files SET description='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
        },
    },
    //recognizedText
    {
        field: 'recognizedText', 
        editor: 'textarea',
        width:200,
        cellEdited: async function (cell){ 
            let res = await sql( `UPDATE files SET recognizedText='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
        },
    },
    //'recognitionStatus'
    {
        // TODO добавить возможность "заказывать" распознавание и разрывать сессию
        title: "Распознавание",
        field: 'recognitionStatus',
        hozAlign:  "center",  
        cellClick: async function(e, cell){
            const REC_ID = cell.getRow().getData().id

            cell.getTable().updateData([{id: REC_ID, recButton:'Обработка...'}])
                .then(async function(){
                     let sqlres = await sql( `UPDATE files SET recognitionStatus='Обработка' WHERE id=${REC_ID}`);
                })
            
            
            
            let response = await fetch('/api/speech-recognition', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputPath: UPLOAD_PATH + cell.getRow().getData().name, 
                    fragmentDuration:15
                }
              )
            });
            if (response.ok) {
                cell.getTable().updateData([{id: cell.getRow().getData().id, recButton:'Готово'}]).then(async function(){
                     let sqlres = await sql( `UPDATE files SET recognitionStatus='Готово' WHERE id=${REC_ID}`);
                })
                
                let res = await response.json()
                console.log("Распознан текст", res)
                const fragments = res.data
                text = ''
                for (let i in fragments){
                    text += i + ':'+ fragments[i].recognitionResults.variant[0]._ + ' '
                }
                
                cell.getTable().updateData([{id: REC_ID, recognizedText:text}])
                    .then(async function(){
                     let sqlres = await sql( `UPDATE files SET recognizedText='${text}' WHERE id=${cell.getRow().getData().id}`);
                })
            }
        } 
    },
    //fileType
    {
        title: "Тип",
        field: 'fileType',
        editor: 'list',
        hozAlign: "center",
        editorParams: {
            autocomplete: "true",
            allowEmpty: true,
            listOnEmpty: true,
            valuesLookup: true,
            freetext: false,
            values: ['image', "video", "audio", "text", "other"]
        },
        cellEdited: async function (cell) {
            let res = await sql(`UPDATE files SET fileType='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
        },
    },
    //play
    { 
        field:'play',
        formatter: () => {return ICON_PLAY },
        width:     20, 
        hozAlign:  "center",
        cellClick: function(e, cell){ playFile(e, cell.getRow().getData().name, true);} 
    },
    //marks
    {
        field:'marks',
        formatter: (cell) => {
            if (cell.getRow().getData().fileType == 'audio' || cell.getRow().getData().fileType == 'video')
                return `<a href='marks.html?file_id=${cell.getRow().getData().id}'>${ICON_TEXT}</a>`
            else 
                return ''
        },
        width:     20, 
        hozAlign:  "center"
    },
    //view
    {
        title: 'Просмотр',
        field: 'view',
        width:     80,
        hozAlign:  "center",
        formatter: function(cell) {return `<img alt=':(' src='${UPLOAD_PATH + cell.getRow().getData().name}' class='previewImage'>`; }
    },
    //download
    {
        title: "Скачать",
        field: 'download',
        formatter:function(){return ICON_DOWNLOAD;}, 
        width:     20, 
        hozAlign:  "center",  
        cellClick: function(e, cell){ downloadFile(e, UPLOAD_PATH + cell.getRow().getData().name);} 
    },
    //date_created_GMT
    {
        title: "Дата съёмки",
        field: 'date_created_GMT',
        width:     100,
        formatter: (e) => {
            if(e.getValue() != undefined)
                return luxon.DateTime.fromISO(e.getValue()).toFormat('dd.MMM hh:mm')
            else return '';
        }
    },
    //date_upload
     {
        title: "Часовой пояс даты съёмки",
        field: 'date_created_timezone',
        width:     60,
    },
    //date_upload
    {
        title: "Дата загрузки",
        field: 'date_upload',
        width:     100,
        formatter: (e) => {
            if(e.getValue() != undefined)
                return luxon.DateTime.fromISO(e.getValue()).toFormat('dd.MMM hh:mm')
            else return '';
        }
    },
    //date_upload_timezone
    {
        title: "Часовой пояс даты загрузки",
        field: 'date_upload_timezone',
        width:     60,
    },
    //date_updated
    {
        title: "Дата обновления",
        field: 'date_updated',
        width:     100,
        formatter: (e) => {
            if(e.getValue() != undefined)
                return luxon.DateTime.fromISO(e.getValue()).toFormat('dd.MMM hh:mm')
            else return '';
        }
    },
    //date_updated_timezone
     {
        title: "Часовой пояс даты обновления",
        field: 'date_updated_timezone',
        width:     60,
    },
    //fileExt
    {
        title: "Расширение",
        field: 'fileExt',
        width:     60,
        hozAlign:  "center",
    },
];

/**
 * MAIN CODE -  начало основного кода
 */

var table = new Tabulator("#fileTable", {
    height:"100%",
    layout: "fitColumns",
    placeholder: "Введите поисковую фразу",
    ajaxContentType: "json",
    autoColumns: true,
    autoColumnsDefinitions: FORMAT_FILES_COLUMNS
});
table.on('tableBuilt', function(e){
    loadDataToTable(STANDARD_QUERY)
});

/**
* Поведение строки поиска
*/
srch.addEventListener('keydown', function(e){
        if (e.code == 'Enter') {
            srch.blur() 
            startSearch()
        }
    
});

/**
*  downloadFile - Открывает ссылку на определённый файл в новой вкладке
*  eventOnClick - событие при нажатии кнопки загрузки файла
*  path - полный путь к файлу, который нужно загружать
*/
function downloadFile(eventOnClick, path){
   window.open(path,"_blank");
   eventOnClick.stopPropagation();
}


/**
    Поиск по таблице
*/
function startSearch() {
    let where = ''
    if (!(srch.value === undefined || srch.value === '')){
        where = `  WHERE (description like '%${srch.value}%' OR recognizedText like '%${srch.value}%' OR oldName like '%${srch.value}%' OR name like '%${srch.value}%' OR fileExt like '%${srch.value}%' OR fileType like '%${srch.value}%' )`
    }
    loadDataToTable(STANDARD_QUERY + where);
}

/**
 * @brief Запрос к БД. 
 * @return Обновляет таблицу на странице.
 */
function loadDataToTable(q) {
    table.setData("api/sql/dataOnly", {
        'query': q,
        'inserts': ''
    }, "POST");
}

/**
* Определение пути к файлам
*/
function getFilePath(filename, useProxy=true){
   return UPLOAD_PATH + filename;
}

/**
* Определяет расширение файла
*/
function getUrlExtention( url ) {
  return url.split(/[#?]/)[0].split('.').pop().trim().toLowerCase();
}

 /**
* Запуск просмотра файла в окне предпросмотра
* previewImg, previewVideo, peviewIframe - идентефикаторы элементов, где будут появляться предпросмотр
*/
function playFile(event, name, useProxy=false){
   let path = getFilePath(name, useProxy);
   let ext = getUrlExtention(path);
    
   previewImg.hidden = previewVideo.hidden = previewIframe.hidden = true;
   switch(ext){
      case 'mkv':
      case 'mov':
      case 'wav':
      case 'aac':
      case 'mp3':
      case 'mp4': 
        previewVideo.src = path; 
        previewVideo.hidden = false;
        break;
      case 'gif':
      case 'bmp':
      case 'svg':
      case 'png':
      case 'tif':
      case 'jpg':
        previewImg.src = path;
        previewImg.hidden = false;
        break;
      default:
        previewIframe.src = path;
        previewIframe.hidden = false;
   } 
}

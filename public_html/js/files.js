///
/// КОНСТАНТЫ И КОНФИГУРАЦИЯ
///
const UPLOAD_PATH = 'uploads/'; // must en with '/'

const STANDARD_QUERY = `SELECT id, 
                        '>>>' as play,
                        'Просмотр' as view,
                        description, 
                        oldName, 
                        name, 
                        fileType,
                        'Скачать' as download
                    FROM files `;   

const icon_download = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill-rule="evenodd" d="M7.47 10.78a.75.75 0 001.06 0l3.75-3.75a.75.75 0 00-1.06-1.06L8.75 8.44V1.75a.75.75 0 00-1.5 0v6.69L4.78 5.97a.75.75 0 00-1.06 1.06l3.75 3.75zM3.75 13a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5z"></path></svg>';
const icon_play = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M9.5 15.584V8.416a.5.5 0 01.77-.42l5.576 3.583a.5.5 0 010 .842l-5.576 3.584a.5.5 0 01-.77-.42z"></path><path fill-rule="evenodd" d="M12 2.5a9.5 9.5 0 100 19 9.5 9.5 0 000-19zM1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12z"></path></svg>';

const FORMAT_FILES_COLUMNS = [
    {
        field: 'id', 
        width:40  
    },
    {
        field: 'description', 
        editor: 'list',
        editorParams:{autocomplete:"true", allowEmpty:true,listOnEmpty:true, valuesLookup:true, freetext:true},
        cellEdited: async function (cell){ 
            let res = await sql( `UPDATE files SET description='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
        },
    },
    {
        field:'play',
        formatter: () => {return icon_play },
        width:     20, 
        hozAlign:  "center",
        cellClick: function(e, cell){ playFile(e, cell.getRow().getData().name, true);} 
    },
    {
        title: 'Просмотр',
        field: 'view',
        width:     128, 
        hozAlign:  "center",
        formatter: function(cell) {return `<img alt=':(' src='${UPLOAD_PATH + cell.getRow().getData().name}' class='previewImage'>`; }
    },
    {
        title: "Скачать",
        field: 'download',
        formatter:function(){return icon_download;}, 
        width:     20, 
        hozAlign:  "center",  
        cellClick: function(e, cell){ downloadFile(e, UPLOAD_PATH + cell.getRow().getData().name);} 
    },
];

/**
*  downloadFile
*/
function downloadFile(event, path){
   window.open(path,"_blank");
   event.stopPropagation();
}   


/**
* Поведение строки поиска
*/
srch.addEventListener('keydown', function (e) {
    let where = `  WHERE description like '%${srch.value}%' `
    if (e.code == 'Enter') srch.blur(), loadDataToDable(STANDARD_QUERY + where);
});


/**
 * MAIN CODE -  начало основного кода
 */

console.log('creating table');
var table = new Tabulator("#fileTable", {
    height:"100%",
    layout: "fitColumns",
    placeholder: "Введите поисковую фразу",
    ajaxContentType: "json",
    layout: "fitColumns",
    autoColumns: true,
    autoColumnsDefinitions: FORMAT_FILES_COLUMNS
    
});
table.on('tableBuilt', function(e){ 
    console.log('ready!')
    loadDataToDable(STANDARD_QUERY)
});


/**
 * @brief Запрос к БД. 
 * @return Обновляет таблицу на странице.
 */
function loadDataToDable(q) {
    table.setData("api/sql/dataOnly", {
        'query': q,
        'inserts': ''
    }, "POST");
}

/**
*
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

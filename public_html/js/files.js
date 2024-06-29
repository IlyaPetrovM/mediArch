///
/// КОНСТАНТЫ И КОНФИГУРАЦИЯ
///
const UPLOAD_PATH = 'uploads/'; // must en with '/'

// Запрос к таблице
const STANDARD_QUERY = `SELECT f.id as id,
                        '>>>' as play,
                        'Просмотр' as view,
                        f.description description,
                        f.recognizedText recognizedText,
                        recognitionStatus,
                        file_created_UTC,
                        file_created_LOCAL,
                        file_updated_LOCAL,
                        date_upload_UTC,
                        date_upload_timezone,
                        date_upload_UTC,
                        date_updated_timezone,
                        oldName, 
                        f.name name,
                        fileType,
                        fileExt,
                        CONCAT(
                            '[',
                                GROUP_CONCAT( DISTINCT 
                                    JSON_OBJECT( 
                                        "id",          inf.id, 
                                        "last_name",   inf.last_name, 
                                        "first_name",  inf.first_name,
                                        "middle_name", inf.middle_name
                                    )
                                ),
                            ']'
                            ) AS informants,
                        'Скачать' as download,
                        'Опись' as marks
                    FROM ((files as f
                            LEFT JOIN files_to_informants AS conn ON (conn.file_id = f.id) )
                            LEFT JOIN informants inf ON (conn.inf_id = inf.id)) GROUP BY f.id`;
const ORDER_BY = ` ORDER BY id DESC `;
let START_PAGE = 0;
let OFFSET = 10;
let where = '';

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
        width: 250,
        editorParams: {
            autocomplete: "true",
            allowEmpty: true,
            listOnEmpty: true,
            valuesLookup: true,
            freetext: true
        },
        cellEdited: async function (cell) {
            let res = await sql(`UPDATE files SET description='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
        },
    },
    {
        field: 'name',
        visible: false,
    },
    {
        field: 'oldName',
        visible: false,
    },
    //recognizedText
    {
        field: 'recognizedText', 
        editor: 'textarea',
        visible: false,
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
        cellClick: (e, cell) => { startRecognition(cell.getRow().getData().id, UPLOAD_PATH + cell.getRow().getData().name, cell);}
    },
    //fileType
    {
        title: "Тип",
        field: 'fileType',
        visible: false,
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
        field: 'file_created_UTC',
        visible: false,
        width:     100,
        formatter: (e) => {
            if(e.getValue() != undefined)
                return luxon.DateTime.fromISO(e.getValue()).toFormat('dd.MMM hh:mm')
            else return '';
        }
    },
    //date_upload
    {
        title: "Дата загрузки",
        field: 'date_upload_UTC',
        visible: false,
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
        visible: false,
        width:     60,
    },
    //date_updated
    {
        title: "Дата обновления",
        field: 'file_updated_LOCAL',
        visible: false,
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
         visible: false,
        width:     60,
    },
        //date_updated_timezone
     {
        title: "Часовой пояс даты обновления",
        field: 'file_created_LOCAL',
         visible: false,
        width:     60,
    },
    //fileExt
    {
        title: "Расширение",
        field: 'fileExt',
        visible: false,
        width:     60,
        hozAlign:  "center",
    },
    //informants
    {
        title: "Люди",
        field: 'informants',
        editor: editorInformants,
//        editorParams: {
//            valuesLookup: true,
//            multiselect: true,
//            clearable:true,
//            valuesLookup: getInformantsList
//        },
        mutator: (value, data, type, params, component)=>{
            console.log(value, type)
            if(type == 'data'){
                 return JSON.parse(value);
            }
            return value;
        },
        formatter: formatInformantList
//        (cell)=>{

//
//        }
    }, 
];
function editorInformants(filesCell, onRendered, success, cancel, editorParams) {
  //cell - the cell component for the editable cell
  //onRendered - function to call when the editor has been rendered
  //success - function to call to pass thesuccessfully updated value to Tabulator
  //cancel - function to call to abort the edit and return to a normal cell
  //editorParams - params object passed into the editorParams column definition property
  var modal = new bootstrap.Modal(document.getElementById('informantSelector'));
  // Toggle Modal
  modal.toggle();
  const informantSelectorBody = document.getElementById(
    'informantSelectorBody'
  );
  const file_id = filesCell.getData().id;
  sql(`SELECT i.id AS id, i.last_name AS last_name, i.first_name AS first_name, (fti.file_id = ${file_id})  AS file_id
        FROM informants i 
        LEFT JOIN ( SELECT * FROM files_to_informants WHERE file_id = ${file_id} ) fti 
        ON fti.inf_id = i.id 
        ORDER BY file_id desc, last_name ASC` ).then((res) => {
    console.log(res);
    const infTable = new Tabulator('#informantsTable', {
      // height:"100%",
      layout: 'fitColumns',
      placeholder: 'Информанты',
      ajaxContentType: 'json',
      autoColumns: true,
      data: res.data,
      autoColumnsDefinitions: [
        {
            field: 'id',
            title: 'id',
            visible:false,
            width: 30,            
          },
        {
          field: 'last_name',
          title: 'Фамилия',
          headerFilter: 'input',
        },
        {
          field: 'first_name',
          title: 'Имя',
          headerFilter: 'input',
        },
        {
            field: 'file_id',
            title: 'file_id',
            formatter:'tickCross',
            formatterParams: {
                allowEmpty:true,
                allowTruthy:true,
            },
            cellClick: (e, cell)=>{
                const prevValue = cell.getValue();
                const inf_id = cell.getData().id;
                cell.setValue( prevValue ? null : true );

                if(prevValue===null){
                    // значит нам надо добавить запись в таблицу
                    sql(`INSERT INTO files_to_informants (file_id, inf_id) VALUES (${file_id}, ${inf_id})`)
                    .then(res => {
                        console.log(res);
                        // todo^ update cell in page
                    }).catch(e => {
                        console.error(e)
                        alert('Не удалось отметить информанта');
                    })
                }
                if(prevValue===true){
                    sql(`DELETE FROM files_to_informants WHERE file_id = ${file_id} AND inf_id = ${inf_id})`)
                    .then(res => {
                        console.log(res);
                    }).catch(e => {
                        console.error(e)
                        alert('Не удалось отметить информанта');
                    })
                }
            },
            visible:true,
            width: 30,
          },
      ],
    });
    document.getElementById('closeModalButton').onclick = function(){
        infTable.destroy();
        console.log(infTable);
    }
  });
  
}

function formatInformantList(cell){
    cell.getElement().style.whiteSpace = "pre-wrap";
    try{
        const informants = cell.getValue();

        if(informants.length == 0 || informants[0].id == null) return null;
        console.log(informants);

        let tags = document.createElement('span')
        for(let inf of informants){
            const span = document.createElement('span');
            span.className = 'tags'
            const content = document.createElement('span');
            content.innerHTML = inf.last_name + ' ' + inf.first_name[0] + '.' + (inf.middle_name[0] || '')

            const cross = document.createElement('span');
            cross.innerHTML = ' x '
            span.appendChild(content);
            span.appendChild(cross);

            tags.appendChild(span)
        }
        return tags.innerHTML;
    }catch(e){
        console.log(e)
        return null;
    }
}
/**
 * @brief Получает список всех информантов
 * @param [in] cell - the cell component for the current cell
 * @param [in] filterTerm - the current value of the input element
 * @return Array of informants 
 */
async function getInformantsList(cell, filterTerm) {
    console.log(cell.getElement());

    try {
        const res = await sql(`SELECT id, last_name, first_name, middle_name FROM informants`);
        if (res.error) {
            console.log(res.error)
            return null;
        }
        const options = [];
        res.data.forEach(inf => {
            options.push({
                label: inf.last_name + ' ' + inf.first_name[0] + '.' + (inf.middle_name[0] || '') + ";",
                value: inf
            })
        })
        return options;
    } catch (e) {
        console.error(e);
        return cell.getValue();
    }
}
/**
 * @brief Загружает для каждого объекта
 * @param [in] Array of Objects data
 * @return none
 */
function loadInformants(table, data) {
//    data.forEach(async (file) => {
//        try{
//            const res = await sql(`SELECT * FROM files_to_informants WHERE file_id=${file.id}`);
//            table.updateData([{
//                id: file.id,
//                informants:res.data
//            }])
//        }catch(err) {console.log(err);}
//    })
}

/**
 * @brief Запуск распознавания текста в аудио
 * @param [in] e - событие
 * @param [in] cell - ячейка таблицы
 * @return Description of returned value.
 */
async function startRecognition(REC_ID, inputPath, cell) {

    cell.getTable().updateData([{
            id: REC_ID,
            recButton: 'Обработка...'
        }])
        .then(async function () {
            let sqlres = await sql(`UPDATE files SET recognitionStatus='Обработка' WHERE id=${REC_ID}`);
        });

    let response = await fetch('/api/speech-recognition', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputPath: inputPath,
            fragmentDuration: 15,
            recId: REC_ID
        })
    });
}

/**
 * MAIN CODE -  начало основного кода
 */

var table = new Tabulator("#fileTable", {
    height:"800px",
    layout: "fitColumns",
    placeholder: "Введите поисковую фразу",
    ajaxContentType: "json",
    autoColumns: true,
    rowHeader:{formatter:"rownum", headerSort:true, hozAlign:"center", resizable:true, frozen:true},
    autoColumnsDefinitions: FORMAT_FILES_COLUMNS
});
table.on('tableBuilt', function(e){
    loadDataToTable(STANDARD_QUERY  + where + ORDER_BY + ` LIMIT ${START_PAGE},${START_PAGE+OFFSET} `)
});

nextPage.addEventListener('click', (event)=>{
    START_PAGE += OFFSET;
    if(START_PAGE > 0) {
        prevPage.hidden = false;
    }
     loadDataToTable(STANDARD_QUERY  + where + ORDER_BY + ` LIMIT ${START_PAGE},${START_PAGE+OFFSET} `);
})

prevPage.addEventListener('click', (event)=>{
    START_PAGE -= OFFSET;
    if(START_PAGE <= 0) {
        START_PAGE = 0;
        prevPage.hidden = true;
    }
     loadDataToTable(STANDARD_QUERY + where  + ORDER_BY + ` LIMIT ${START_PAGE},${START_PAGE+OFFSET} `);
})


table.on('dataLoaded', async function(data){
    if(!data) return;
    console.log(data);
    loadInformants(table, data);
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

    if (!(srch.value === undefined || srch.value === '')){
        where = `  HAVING (description like '%${srch.value}%' OR recognizedText like '%${srch.value}%' OR oldName like '%${srch.value}%' OR name like '%${srch.value}%' OR fileExt like '%${srch.value}%' OR fileType like '%${srch.value}%' )`
    }
    loadDataToTable(STANDARD_QUERY + where + ORDER_BY + ` LIMIT ${START_PAGE},${START_PAGE+OFFSET} `);
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

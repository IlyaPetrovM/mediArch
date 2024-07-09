///
/// КОНСТАНТЫ И КОНФИГУРАЦИЯ
///
const UPLOAD_PATH = 'uploads/'; // must en with '/'

const urlParams = new URLSearchParams(document.location.search)
const EVENT_ID = urlParams.get('event_id');

let USER = '';
getUsername().then(res => {
    USER = res.data
    userName.innerHTML = USER;
});

btnExit.onclick = () => {
    endSession().then(res => {
        window.location.reload()
    })
}

// Запрос к таблице
const STANDARD_QUERY = `SELECT 
                        '>>>' as play,
                        'Просмотр' as view,
                        'Опись' as marks,
                        oldName, 
                        f.tags as tags,
                        f.description description,
                        f.status,
                        event_id,
                        ev.title as event_title,
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
                            f.recognizedText recognizedText,
                            recognitionStatus,
                            file_created_UTC,
                            file_created_LOCAL,
                            file_updated_LOCAL,
                            date_upload_UTC,
                            date_upload_timezone,
                            date_upload_UTC,
                            date_updated_timezone,
                            f.name name,
                            fileType,
                            f.user_created as user_created,
                            'Скачать' as download,
                            fileExt,
                            f.gps_str,
                            f.deviceModel,
                            f.id as id
                    FROM ((files as f
                            LEFT JOIN files_to_informants AS conn ON (conn.file_id = f.id) )
                            LEFT JOIN informants inf ON (conn.inf_id = inf.id)
                            LEFT JOIN EVENTS ev ON (ev.id = f.event_id)) GROUP BY f.id`;
const ORDER_BY = ` ORDER BY id DESC `;
let OFFSET = 0;
let LIMIT = 30;
let where = `  `;

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
    width: 40,
    hozAlign: 'center',
  },
  //tags
  {
    title: 'Теги',
    field: 'tags',
    editor: 'list',
    width: 100,
    hozAlign: 'center',
    editorParams: {
      autocomplete: 'true',
      allowEmpty: true,
      listOnEmpty: true,
      values: [
          'архитектура',
          'бэкстейдж',
        'портрет',
        'интервью',
        'документ',
        'природа',
        'животные',
        'рабочие моменты',
      ],
      freetext: false,
    },
    cellEdited: async function (cell) {
      let res = await sql(
        `UPDATE files SET tags = '${cell.getValue()}' WHERE id=${
          cell.getRow().getData().id
        }`
      );
    },
  },
  {
    field:'status',
    title:'Удаление',
    editor:'list',
    visible:false,
    width:80,
    cellEdited:(cell)=>{
      console.log(cell.getValue())
    },
    editorParams: {
      autocomplete: 'true',
      allowEmpty: true,
      listOnEmpty: true,
      values: [
          'на удаление',
          'дубликат',
          'битый файл',
          'ок',
      ],
      freetext: false,
    },
    // formatter:(e)=>{

    // }
  },
  //description
  {
    title: 'Описание',
    headerWordWrap: true,
    field: 'description',
    editor: 'textarea',
    width: 200,
    formatter: 'textarea',
    headerFilter: 'input',
    editorParams: {
      autocomplete: 'true',
      allowEmpty: true,
      listOnEmpty: true,
      valuesLookup: true,
      freetext: true,
    },
    cellEdited: async function (cell) {
      let res = await sql(
        `UPDATE files SET description='${cell.getValue()}' WHERE id=${
          cell.getRow().getData().id
        }`
      );
    },
  },
  {
    field: 'name',
    visible: false,
    width:50,
    headerWordWrap: true,
  },
  {
    field: 'event_id',
    visible: false,
    headerFilter: 'input',
  },
  {
    field: 'event_title',
    title: 'Событие',
    editor: 'list',
    cellEdited: (cell) => {
      console.log('event_title');
      sql(
        `UPDATE files SET event_id = ${cell.getValue()} WHERE id=${
          cell.getRow().getData().id
        }`
      ).then((res) => {
        res.errors
          ? alert('Не могу добавть событие')
          : console.log('событие ', cell.getValue());
      });
    },
    editorParams: {
      clearable: true,
      listOnEmpty: true,
      autocomplete: true, //enable autocomplete mode,
      freetext: false, //allow the user to set the value of the cell to a free text entry
      valuesLookup: async function (cell, filterTerm) {
        const res = await sql(
          `SELECT * FROM events ORDER BY date_start DESC, id DESC`
        );
        const eventsList = [{value:null, label: '[ Открепить файл от события ]'}];
        // })
        // for (let i in res.data) {
        res.data.forEach((evt) => {
          eventsList.push({
            value: String(evt.id),
            label:
              evt.title +
              ' --- ' +
              luxon.DateTime.fromISO(evt.date_start).toFormat('dd.MM.yyyy'),
          });
        });
        // console.log(eventsList);
        return eventsList;
      },
    },
  },
  {
    field: 'user_created',
    // visible: false,
    headerWordWrap: true,
    headerFilter: 'input',
  },
  {
    title: 'Имя файла',
    field: 'oldName',
    formatter: 'input',
    // visible: false,
    width:80,
    headerWordWrap: true,
    headerFilter: 'input',
  },
  //recognizedText
  {
    field: 'recognizedText',
    editor: 'textarea',
    visible: false,
    // width:200,
    headerWordWrap: true,
    cellEdited: async function (cell) {
      let res = await sql(
        `UPDATE files SET recognizedText='${cell.getValue()}' WHERE id=${
          cell.getRow().getData().id
        }`
      );
    },
  },
  //'recognitionStatus'
  {
    // TODO добавить возможность "заказывать" распознавание и разрывать сессию
    title: 'Распознавание',
    field: 'recognitionStatus',
    hozAlign: 'center',
    visible: false,
    cellClick: (e, cell) => {
      startRecognition(
        cell.getRow().getData().id,
        UPLOAD_PATH + cell.getRow().getData().name,
        cell
      );
    },
  },
  //fileType
  {
    title: 'Тип',
    field: 'fileType',
    // visible: false,
    editor: 'list',
    hozAlign: 'center',
    editorParams: {
      autocomplete: 'true',
      allowEmpty: true,
      listOnEmpty: true,
      valuesLookup: true,
      freetext: false,
      values: ['image', 'video', 'audio', 'text', 'other'],
    },
    cellEdited: async function (cell) {
      let res = await sql(
        `UPDATE files SET fileType='${cell.getValue()}' WHERE id=${
          cell.getRow().getData().id
        }`
      );
    },
  },
  //play
  {
    field: 'play',
    formatter: () => {
      return ICON_PLAY;
    },
    // width:     20,
    hozAlign: 'center',
    cellClick: function (e, cell) {
      playFile(e, cell.getRow().getData().name, true);
    },
  },
  //marks
  {
    field: 'marks',
    formatter: (cell) => {
      if (
        cell.getRow().getData().fileType == 'audio' ||
        cell.getRow().getData().fileType == 'video'
      )
        return `<a href='marks.html?file_id=${
          cell.getRow().getData().id
        }'>${ICON_TEXT}</a>`;
      else return '';
    },
    width: 20,
    hozAlign: 'center',
  },
  //view
  {
    title: 'Просмотр',
    field: 'view',
    width: 80,
    hozAlign: 'center',
    formatter: function (cell) {
      return `<img alt=':(' src='${
        UPLOAD_PATH  +  cell.getRow().getData().name
      }' class='previewImage'>`;
    },
  },
  //download
  {
    title: 'Скачать',
    field: 'download',
    formatter: function () {
      return ICON_DOWNLOAD;
    },
    width: 20,
    // verticalHeader:true,
    hozAlign: 'center',
    headerWordWrap: true,
    cellClick: function (e, cell) {
      downloadFile(e, UPLOAD_PATH + cell.getRow().getData().name);
    },
  },
  //date_created_GMT
  {
    title: 'Дата съёмки (по Гринвичу)',
    field: 'file_created_UTC',
    hozAlign: 'center',
    width: 70,
    // visible: false,
    // headerFilter:"date",
    headerWordWrap: true,
    formatter: (e) => {
      e.getElement().style.whiteSpace = 'pre-wrap';
      if (e.getValue() != undefined)
        return luxon.DateTime.fromISO(e.getValue(), {
          setZone: false,
        }).toFormat('dd.MM HH:mm:ss');
      else return '';
    },
  },
  //date_upload
  {
    title: 'Дата загрузки (по Гринвичу)',
    field: 'date_upload_UTC',
    // visible: false,
    hozAlign: 'center',
    width: 70,
    headerWordWrap: true,
    // headerFilter:'input',
    formatter: (e) => {
      e.getElement().style.whiteSpace = 'pre-wrap';
      if (e.getValue() != undefined) {
        // console.log('time', e.getData().id, new Date(e.getValue()));
        // const d = new Date(e.getValue());
        // `${d.getDate()}.${d.getMonth()+1} ${d.getHours()}:${d.getMinutes()}`
        return luxon.DateTime.fromISO(e.getValue(), {
          setZone: false,
        }).toFormat('dd.MM HH:mm:ss');
      } else return '';
    },
  },
  //date_upload_timezone
  {
    title: 'Часовой пояс даты загрузки',
    field: 'date_upload_timezone',
    // visible: false,
    width: 60,
    headerWordWrap: true,
  },
  //date_updated
  {
    title: 'Дата обновления',
    field: 'file_updated_LOCAL',
    // visible: false,
    width: 70,
    headerWordWrap: true,
    formatter: (e) => {
      e.getElement().style.whiteSpace = 'pre-wrap';
      if (e.getValue() != undefined)
        return luxon.DateTime.fromISO(e.getValue(), {
          setZone: false,
        }).toFormat('dd.MM HH:mm:ss');
      else return '';
    },
  },
  //date_updated_timezone
  {
    title: 'Часовой пояс даты обновления',
    field: 'date_updated_timezone',
    visible: false,
    headerWordWrap: true,
    // width:     60,
  },
  //gps_str
  {
    title: 'GPS',
    field: 'gps_str',
    formatter: 'textarea',
    //  visible: false,
    headerWordWrap: true,
    width: 80,
  },
  //date_updated_timezone
  {
    title: 'Часовой пояс даты обновления',
    field: 'file_created_LOCAL',
    visible: false,
    headerWordWrap: true,
    // width:     60,
  },
  //fileExt
  {
    title: 'Расширение',
    field: 'fileExt',
    // visible: false,
    width: 60,
    headerWordWrap: true,
    hozAlign: 'center',
  },
  //informants
  {
    title: 'Люди',
    field: 'informants',
    // headerFilter:'input',
    // width: 120,
    cellClick: (e, cell) => {
      editorInformants(cell);
    },
    mutator: (value, data, type, params, component) => {
      // console.log(value, type);
      if (type == 'data') {
        const informants = JSON.parse(value);
        if (informants.length == 1 && informants[0].id === null) return [];
        return informants;
      }
      return value;
    },
    formatter: formatInformantList,
  },
  {
    field: 'deviceModel',
    headerFilter: 'input',
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
  const informantsInCell = filesCell.getValue();
  sql(`SELECT i.id AS id,  
        (fti.file_id = ${file_id})  AS file_id,
        i.last_name AS last_name, 
        i.first_name AS first_name, 
        i.middle_name AS middle_name, 
        i.nickname AS nickname
    FROM informants i 
    LEFT JOIN 
        ( SELECT * FROM files_to_informants WHERE file_id = ${file_id} )  fti 
    ON fti.inf_id = i.id 
    WHERE i.hide <> 1
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
            visible: false,
            width: 30,
        },
        {
          field: 'nickname',
          title: 'Короткое имя',
          headerFilter: 'input',
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
          field: 'middle_name',
          title: 'Отчество',
          headerFilter: 'input',
        },
        {
          field: 'file_id',
          title: 'Выбрать',
          width: 50,
          formatter: 'tickCross',
          formatterParams: {
            allowEmpty: false,
            allowTruthy: true,
            tickElement:"<input type=checkbox checked>",
            crossElement:"<input type=checkbox>",
          },
          cellClick: (e, cell) => {
            const prevValue = cell.getValue();
            const inf = cell.getData();

            cell.setValue(prevValue ? null : true);
            console.log(prevValue);
            if (prevValue === null) {
              // значит нам надо добавить запись в таблицу
              sql(
                `INSERT INTO files_to_informants (file_id, inf_id) VALUES (${file_id}, ${inf.id})`
              )
                .then((res) => {
                  console.log(res);
                  // todo^ update cell in page

                  informantsInCell.push(inf);
                })
                .catch((e) => {
                  console.error(e);
                  alert('Не удалось отметить информанта');
                });
            } else {
              sql(
                `DELETE FROM files_to_informants WHERE (file_id = ${file_id} AND inf_id = ${inf.id})`
              )
                .then((res) => {
                  const index = informantsInCell.findIndex(
                    (elem) => elem.id == inf.id
                  );
                  informantsInCell.splice(index, 1);
                  console.log('Успешно удалено');
                })
                .catch((e) => {
                  console.error(e);
                  alert('Не удалось отметить информанта');
                });
            }
          },
          visible: true,
          width: 30,
        },
      ],
    });
    document.getElementById('closeModalButton').onclick = function(){
        infTable.destroy();
        filesCell.setValue(informantsInCell);
        filesCell.getRow().reformat();
    }
  });
  
}

function formatInformantList(cell){
    cell.getElement().style.whiteSpace = "pre-wrap";

    try{
        const informants = cell.getValue();
        // console.log(informants);

        if(informants.length == 0 || informants.length == 1 && informants[0].id === null) return null;
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
            // span.appendChild(cross);

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
    height:"calc(100vh - 58px)",
    // maxWidth:"calc(300px)",
    // responsiveLayout:'collapse',
    // layout: "fitColumns",
    selectableRows:1,
    rowHeader: {
        headerSort: false,
        resizable: false,
        frozen: true,
        width: 5,
        headerHozAlign: "center",
        hozAlign: "center",
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        // cellClick: function (e, cell) {
        //     cell.getRow().toggleSelect();
        // }
    },
    placeholder: "Введите поисковую фразу",
    ajaxContentType: "json",
    autoColumns: true,
    pagination:true,
    paginationSize: 8,
    rowHeight:100,
    paginationSizeSelector: [5, 8, 15, 25, 100],
    // rowHeader:{formatter:"rownum", headerSort:true, hozAlign:"center", resizable:true, frozen:true},
    autoColumnsDefinitions: FORMAT_FILES_COLUMNS
});
table.setFilter('status', '!=', 'на удаление')
table.on("rowSelected", function(row){
  const btn = document.getElementById('btnDeleteFile');
  btn.style.display = 'block';
});
table.on("rowDeselected", function(row){
  const btn = document.getElementById('btnDeleteFile');
  btn.style.display = 'none';
});
const btnDeleteFile = document.getElementById('btnDeleteFile');
btnDeleteFile.onclick = ()=>{
  const ans = confirm('Вы уверены?');
  if(ans == false) return;

  const selectedData  = table.getSelectedData()[0];
  console.log(selectedData);
  table.updateData( [ { id:selectedData.id, status:'на удаление' } ] );
  table.deleteRow(selectedData.id);
  const status = 'на удаление';
  sql(`UPDATE files SET status = '${status}' WHERE id = ${selectedData.id} `)
  .then(res => {
    if(res.errors){
      alert('Ошибка при удалении из SQL базы')
      console.error(res.errors);
    }
  })
}

table.on('tableBuilt', function(e){
    loadDataToTable(STANDARD_QUERY  + where + ORDER_BY  )
});



table.on('dataLoaded', async function(data){
    if(!data) return;
    // console.log(data);
    table.redraw();
    
    btnShowMyFiles.onclick = ()=>{
        table.setHeaderFilterValue("user_created", USER);
    }

    console.log('EVENT_ID', EVENT_ID)
    if(EVENT_ID) table.setFilter('event_id','=', EVENT_ID );
    
    
    // createColumnToggler(table, 'file_created_UTC', 'file_created_UTC');
    // // document.getElementById('showColumnsMenu').onchange = function(e){
    // //     console.log(e)
    // //     // e.target.checked ? tab.showColumn(e.target.name) : tab.hideColumn(e.target.name)
    // // };
    loadInformants(table, data);
});

// function createColumnToggler(tab, field, title){
//     const select = document.createElement('showColumnsMenu');
//     // const select = document.createElement('select');
//     const option = document.createElement('option');
//     option.value = field ;
//     option.innerHTML = field;
//     console.log(field);
//     select.appendChild(option)
//     // parent.appendChild(select)
// }

srch.addEventListener('input',(e)=>{
    if(e.target.value === ''){
        srch.blur();
        startSearch();
    }
})

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
        where = ` HAVING (tags like '%${srch.value}%' OR description like '%${srch.value}%' OR recognizedText like '%${srch.value}%' OR oldName like '%${srch.value}%' OR name like '%${srch.value}%' OR fileExt like '%${srch.value}%' OR fileType like '%${srch.value}%' )`
    }else{
        where = ` `;
    }
    loadDataToTable(STANDARD_QUERY + where + ORDER_BY  );
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
   console.log(path)
    
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

/**
TODO при загрузке абсолютно нового видео - нужно создать самую первую запись на 00-00-00


*/

const urlParams = new URLSearchParams(document.location.search)
const FILE_ID = urlParams.get('file_id');
const QUERY_MARKS = `SELECT  m.id,  
                            start_time, 
                            time_msec,
                            m.tags, 
                            describtion,
                            recognition0,
                            recognition1,
                            recognition2,
                            hide,
                            file_id,
                            f.oldName AS file_name,
                            e.title AS event_title
                        FROM marks m
                        LEFT JOIN files AS f ON f.id = file_id
                        LEFT JOIN events AS e ON e.id = f.event_id `;
let where = ` WHERE file_id = ${FILE_ID} and hide <> 1 ORDER BY time_msec ASC`;
if(!FILE_ID) {
    where = 'WHERE  hide <> 1 ORDER BY file_id ASC, time_msec ASC'
    btnAddRow.disabled = true;
}

const tags = () => {
    return [
        'Кино',

        'Генеалогия',

        'Праздники',
        
        'Война',

        'Раскулачивание',
        
        'Семейные традиции',
        
        'Детство',
        
        'Игры',
        'Фольклорный текст',
        
        'Художники в Чусовом',

        'Детский сад',
        'Дом культуры',
        'Библиотека',
        'Музея история',
        'Школа',
        'Завод',
        'Больница - ФАП - Госпиталь',
        'Колхоз',

        'Карта и топонимика',
        'Диалектный словарь',

        'Предметы быта',
        
        'Скотоводство',
        'Пчеловодство',
        
        'Хор',
        
        'Окказиональная обрядность',
        'Свадьба',
        'Похороны',

        'Кулинария',
        
        'Рыбалка',
        'Охота',

        'Староверы',
        'Церковь',
        
        'Плетение из ивовой лозы',

        'Архитектура',

        'Медицина',
    ].sort()
  };

const FORMAT_MARKS_COLUMNS = [   
    {
        field: 'id',
        hozAlign:  "center",
        visible: false,
        width:40
    },
    {
        title:'Время',
        field: 'start_time',
        hozAlign:  "center",
        width:100,
        visible: false
    },
    {
        title:'Темы',
        field: 'tags',
        width: 100,
        editor:'list',
        hozAlign: 'center',
        vertAlign: 'middle',
        formatter: 'textarea',
        headerFilterPlaceholder: 'Поиск',
        headerFilter: 'list',
        headerFilterFunc: 'like',
        headerFilterParams: { values: tags(), sortValuesList: 'asc', autocomplete: true,listOnEmpty: true,},
        editorParams: {
            // autocomplete: 'true',
            allowEmpty: true,
            // listOnEmpty: true,
            multiselect: true,
            sortValuesList: 'asc',
            values: tags(),
            freetext: false,
          },
          cellEdited:async(cell)=>{
            cell.getElement().style.whiteSpace = "pre-wrap";
            let edit_result = await sql(
                `UPDATE marks SET tags = '${cell.getValue()}' WHERE id = ${cell.getRow().getData().id}`)
            if (edit_result.errors) {alert('Ошибка при сохранении описания метки в БД')}
          }
        // visible:false
    },
    {
        field: 'file_name',
        visible:false
    },
    {
        title: 'Событие',
        field: 'event_title',
        visible:false
    },
    {
        title:'Время',
        field: 'time_msec',
        hozAlign:  "center",
        width:100,
        // editor:timeEditor,
        formatter: function(cell){ return '<code class="link-secondary link-offset-2" style="color:#0d6efd; text-decoration: underline;">' + String(cell.getValue()/1000).toHHMMSS() + '</code>'},
        cellClick:async (e, cell)=>{
            const player = document.getElementById('previewVideo');
            // console.log(player);
            console.log(player.currentTime);
            const file_id = cell.getRow().getData().file_id;
            const fileName = await getFileName(file_id);
            console.log(fileName);
            if(player.src != UPLOAD_PATH + fileName){
                fileNameLogo.innerHTML = file_id + ' -- ' + fileName;
                playFile(null, fileName, true);
            }
            player.currentTime = cell.getValue()/1000;
            timeMonitor.innerHTML = toHHMMSSsss( player.currentTime * 1000 );
            
        },
        cellEdited: async function(cell){
            console.log('Отредактировано. Новое значение:', cell.getValue())
        }
    },
    {
        field: 'describtion',
        title:'Описание',
        editor: 'input',
        formatter:'textarea',
        headerFilter:'input',
        headerFilterPlaceholder:'Поиск',
        cellEdited: async function(cell){
            cell.getElement().style.whiteSpace = "pre-wrap";
            let edit_result = await sql(
                `UPDATE marks SET describtion = '${cell.getValue()}' WHERE id = ${cell.getRow().getData().id}`)
            if (edit_result.errors) {alert('Ошибка при сохранении описания метки в БД')}
        }
    },
        {
        field: 'recognition0',
        visible:false,
        formatter:(cell)=>{cell.getElement().style.whiteSpace = "pre-wrap"; return cell.getValue() ? textDiff(cell.getValue(), cell.getRow().getData().recognition1, cell.getRow().getData().recognition2):null;}
    },
            {
        field: 'recognition1',
        visible:false,
        formatter: (cell)=>{cell.getElement().style.whiteSpace = "pre-wrap"; return cell.getValue() ? textDiff(cell.getValue(), cell.getRow().getData().recognition0, cell.getRow().getData().recognition2):null;},

    },
            {
        field: 'recognition2',
        visible:false,
        formatter: (cell)=>{cell.getElement().style.whiteSpace = "pre-wrap"; return cell.getValue() ? textDiff(cell.getValue(), cell.getRow().getData().recognition0, cell.getRow().getData().recognition1):null; }
    },
    {
        title:'',
        field: 'hide',
        width:16,
        formatter: () => {return 'X' },
        hozAlign:  "center",
        cellClick: async function(e,cell){
            let ans = confirm('Вы уверены, что хотите удалить метку?')
            if(!ans)return;
            let edit_result = await sql(
                `UPDATE marks SET hide = 1 WHERE id = ${cell.getRow().getData().id}`)
            if (edit_result.errors) {alert('Ошибка при сохранении описания метки в БД')}
            cell.getRow().delete()
        }
    },
    {
        field: 'file_id',
        visible:false
    }
]


/**
 * @brief Выделяет красным различающиеся слова в тексте
 * @param [in] String mainText - текст, в котором будут выделяться красным слова
 * @param [in] String text2 - ещё текст
 * @param [in] String text3 - ещё текст
 * @return mainText но с выделенными словами
 */
function textDiff(mainText, text2, text3) {
    const texts = [mainText, text2, text3];
    const wordsMap = {};

    texts.forEach(text => {
        const words = text.split(/\s+/);
        words.forEach(word => {
            if (!wordsMap[word]) {
                wordsMap[word] = 1;
            } else {
                wordsMap[word]++;
            }
        });
    });
    const differingWords = Object.keys(wordsMap).filter(word => wordsMap[word] < texts.length);
    let diffText = mainText;
    differingWords.forEach(uniqueWord => {
        diffText = diffText.replace(uniqueWord, `<span class='diffWord'>${uniqueWord}</span>`);
    })
    return diffText;
}

/**
 * @brief Главная функция
 */
async function runMarks(){
    var table = new Tabulator("#marksTable", {
        height:"calc(100vh - 64px)",
        layout: "fitColumns",
        groupBy:["event_title", 'file_name'],
        placeholder: "Введите поисковую фразу",
        ajaxContentType: "json",
        layout: "fitColumns",
        autoColumns: true,
        selectableRows:1,
        autoColumnsDefinitions: FORMAT_MARKS_COLUMNS
    });
    
    
    table.on('tableBuilt', function (e) {
      table.setData(
        'api/sql/dataOnly',
        {
          query: QUERY_MARKS + where,
          inserts: '',
        },
        'POST'
      );
    });
    table.on('dataLoaded', (data) => {
      console.log(data);
      if (data.length === 0) {
        // добавить первую метку
        addMark(table, FILE_ID);
        table.setData(
          'api/sql/dataOnly',
          {
            query: QUERY_MARKS + where,
            inserts: '',
          },
          'POST'
        );
      }
    });
    
    btnAddRow.onclick = function(){ addMark(table, FILE_ID);};
    const btnPlay = document.getElementById('btnPlay')
    btnPlay.onclick = playVideo;
    
    document.body.addEventListener('keydown',(e)=>{
        if(e.altKey){
            console.log(e)
            if(e.code == 'KeyJ') back();
            if(e.code == 'KeyK') playVideo();
            if(e.code == 'KeyL') forward();

            if(e.code == 'KeyM')  addMark(table, FILE_ID);

        }
    })
    
    previewVideo.ontimeupdate = function(e){ 
        timeMonitor.innerHTML = toHHMMSSsss(previewVideo.currentTime*1000);
        if(FILE_ID) goToMark(Number.parseInt(previewVideo.currentTime*1000), table);
    }

    let fileName = await getFileName(FILE_ID);
    if(fileName)playFile(null, fileName, true);
}
runMarks();



/**
* @brief Редактор времени клипа в фромате ЧЧ:ММ:СС:ссс
* @param cell       - the cell component for the editable cell
* @param onRendered - function to call when the editor has been rendered
* @param success    - function to call to pass thesuccessfully updated value to Tabulator
* @param cancel     - function to call to abort the edit and return to a normal cell
* @param editorParams - params object passed into the editorParams column definition property
*/
function timeEditor(cell, onRendered, success, cancel, editorParams) {
    var editor = document.createElement('input')
    editor.setAttribute('step', '0.001')
    editor.setAttribute('type', 'time')
    editor.style.width = "100%";
    console.log(editor.value)
    editor.value = toHHMMSSsss(cell.getValue())

    onRendered(function () {
        editor.focus();
        editor.style.css = "100%";
    });

    function successFunc() {
        console.log(editor.value, toMillis(editor.value))
        success(toMillis(editor.value));
    }

    function waitForEnter(e) {
        if (e.key == 'Enter') successFunc();
        if (e.key == 'Escape') cancel();
    }
    editor.addEventListener("keydown", waitForEnter);
    editor.addEventListener("edited", successFunc);
    editor.addEventListener("blur", successFunc);
    return editor;
}


/**
 * @brief Преобразовать в миллисекунды
 * @param [in] time_str в формате ЧЧ:ММ:СС.ссс
 * @return время в миллисекундак, начиная от 0 
 */
function toMillis(time_str){
    let parts = time_str.split('.')
    let hhmmss = parts[0].split(':')
    let hh = hhmmss[0]
    let mm = hhmmss[1]
    let ss = hhmmss[2]
    let SSS = Number.parseInt(parts[1])
    return (hh*60*60 + mm*60 + ss)*1000 + SSS;
}



/**
* @brief Переходим на нужную метку
* @param [in] millis время миллисекундах
*/
function toHHMMSSsss(millis) {
    return String(Math.floor(millis/1000)).toHHMMSS() + '.' + String(Math.floor((millis))%1000).padStart(3, '0');
}


/**
* @brief Получаем название файла по его id
*/
async function getFileName(file_id){
    if(!file_id) return '';
    // TODO загружать имя файла по file_id
    const query = `SELECT name FROM files WHERE id = ${file_id} LIMIT 1`;
    let res = await sql(query);
    
    if (res.errors) { alert('Не удалось выполнить запрос к БД'); return null; }
    if (res.data == null){ alert('Не удалось найти файл с номером ${file_id}'); return null; }
    
    return res.data[0].name; // [0] так как мы ищем всего лишь один элемент, но res.data - это массив
}


/**
* @brief Переходим на нужную метку
*/
async function goToMark(curtime_ms, tab) {
    let rows = tab.getRows();
    // линейный поиск метки
    for (let i = 0; i < rows.length-1; i++) {
        if (rows[i].getData().time_msec <= curtime_ms && curtime_ms < rows[i+1].getData().time_msec){
            tab.deselectRow()
            rows[i].select();
            rows[i].getCell('describtion').edit()
            return;
        }
    }
    tab.deselectRow()
    rows[rows.length-1].select();
    rows[rows.length-1].getCell('describtion').edit()
}




/**
* @brief Добавление метки
*/
async function addMark(_table, _file_id){
    console.log(previewVideo.currentTime)
    let current_time_sec = Number.parseInt(previewVideo.currentTime)
    let cur_time_msec = Number.parseInt(previewVideo.currentTime*1000)
    for(let i=0; i<_table.getData().length; i++){
        if (Number.parseInt(_table.getData()[i].time_msec) == cur_time_msec){
            console.log('Метка уже существует')
            return;
        }
    }
    const query = `INSERT INTO marks (start_time, time_msec, file_id) VALUES ('${String(current_time_sec).toHHMMSS()}', '${cur_time_msec}', ${_file_id})`;
    let res = await sql(query);
    console.log(res);
    if (res.errors) {
        alert('Ошибка при добавлении в таблицу');
        return;
    }
    let row = _table.addRow({ 
        id: res.data.insertId, 
        time_msec: cur_time_msec,
        start_time: String(current_time_sec).toHHMMSS() 
    });
    _table.deselectRow()
    _table.selectRow(res.data.insertId);
    _table.setSort("time_msec", "asc");
    
}



/**
*   @brief Преобразование секунд в обычную строку
*   Пример использования: "602".toHHMMSS() // Результат: "00:10:02"
*   @return Строка содержащая время в формате hh:mm:ss 
*/
String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}



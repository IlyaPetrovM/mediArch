const urlParams = new URLSearchParams(document.location.search)
const FILE_ID = urlParams.get('file_id');
const QUERY_MARKS = `SELECT  id,  
                            start_time, 
                            tags, 
                            describtion,
                            hide
                        FROM marks
                        WHERE 
                        file_id = ${FILE_ID} and hide <> 1 ORDER BY start_time ASC`;
const FORMAT_MARKS_COLUMNS = [   
    {
        field: 'id',
        hozAlign:  "center",
        width:40
    },
    {
        field: 'start_time',
        hozAlign:  "center",
        width:128
    },
    {
        field: 'describtion',
        editor: 'textarea',
        cellEdited: async function(cell){
            let edit_result = await sql(
                `UPDATE marks SET describtion = '${cell.getValue()}' WHERE id = ${cell.getRow().getData().id}`)
            if (edit_result.errors) {alert('Ошибка при сохранении описания метки в БД')}
        }
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
    }
]




/**
 * @brief Главная функция
 */
async function runMarks(){
    var table = new Tabulator("#marksTable", {
        height:"100%",
        layout: "fitColumns",
        placeholder: "Введите поисковую фразу",
        ajaxContentType: "json",
        layout: "fitColumns",
        autoColumns: true,
        selectableRows:1,
        autoColumnsDefinitions: FORMAT_MARKS_COLUMNS
    });
    
    
    table.on('tableBuilt', function(e){ 
    table.setData("api/sql/dataOnly", {
            'query': QUERY_MARKS,
            'inserts': ''
        }, "POST");
    });
    
    btnAddRow.onclick = function(){ addMark(table, FILE_ID);};
    
    let fileName = await getFileName(FILE_ID);
    playFile(null, fileName, true);
    
    previewVideo.ontimeupdate = function(e){ 
        console.log(previewVideo.currentTime)
        timeMonitor.innerHTML = String(previewVideo.currentTime).toHHMMSS();
        console.log(table.getData())
    }
}
runMarks();
/**
* @brief Получаем название файла по его id
*/
async function getFileName(file_id){
    // TODO загружать имя файла по file_id
    const query = `SELECT name FROM files WHERE id = ${file_id} LIMIT 1`;
    let res = await sql(query);
    console.log(res);
    if (res.errors) { alert('Не удалось выполнить запрос к БД'); return null; }
    if (res.data == null){ alert('Не удалось найти файл с номером ${file_id}'); return null; }
    
    return res.data[0].name; // [0] так как мы ищем всего лишь один элемент, но res.data - это массив
}


/**
* @brief Добавление метки
*/
async function addMark(_table, _file_id){
    console.log(previewVideo.currentTime)
    let timestr = String(previewVideo.currentTime).toHHMMSS();
    
    const query = `INSERT INTO marks (start_time, file_id) VALUES ('${timestr}', ${_file_id})`;
    let res = await sql(query);
    console.log(res);
    if (res.errors) {
        alert('Ошибка при добавлении в таблицу');
        return;
    }
    let row = _table.addRow({ 
        id: res.data.insertId, 
        start_time: timestr 
    });
    _table.deselectRow()
    _table.selectRow(res.data.insertId);
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



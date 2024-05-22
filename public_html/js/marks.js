// marks.js


const urlParams = new URLSearchParams(document.location.search)
var file_id = urlParams.get('file_id');
const QUERY_MARKS = `SELECT  id,  
                            start_time, 
                            tags, 
                            describtion
                        FROM marks
                        WHERE 
                        file_id = ${file_id}`;

const file_name = 'matrix.mp4'
playFile(null, file_name , true)

/**
 * MAIN CODE -  начало основного кода
 */
var table = new Tabulator("#marksTable", {
    height:"100%",
    layout: "fitColumns",
    placeholder: "Введите поисковую фразу",
    ajaxContentType: "json",
    layout: "fitColumns",
    autoColumns: true,
//    autoColumnsDefinitions: FORMAT_FILES_COLUMNS
});


table.on('tableBuilt', function(e){ 
    console.log('ready!')
    loadDataToDable(QUERY_MARKS)
    
});


btnAddRow.onclick = addMark;
/*
* Добавление метки
*/
async function addMark(){
    console.log(previewVideo.currentTime)
    let timestr = String(previewVideo.currentTime).toHHMMSS();
    
    let query = `INSERT INTO marks (start_time, file_id) VALUES ('${timestr}', ${file_id})`;
    let res = await sql(query);
    console.log(res);
    if (res.errors) {
        alert('Ошибка при добавлении в таблицу');
        return;
    }
    table.addRow({id:res.data.insertId, start_time:timestr});
}

/**
*   Преобразование секунд в обычную строку
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

/**
 * @brief Запрос к БД. 
 * @return Обновляет таблицу на странице.
 */
function loadDataToDable( q) {
    table.setData("api/sql/dataOnly", {
       'query': q,
        'inserts': ''
    }, "POST");
}


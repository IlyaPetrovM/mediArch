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

playFile(null, 'matrix.mp4', true)

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


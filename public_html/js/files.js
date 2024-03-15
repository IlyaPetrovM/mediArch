///
/// КОНСТАНТЫ И КОНФИГУРАЦИЯ
///
const STANDARD_QUERY = `SELECT id, 
                        'Просмотр' as 'Просмотр',
                        description, 
                        oldName, 
                        name, 
                        fileType,
                        'Скачать' as download
                    FROM files `;   

const icon_download = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill-rule="evenodd" d="M7.47 10.78a.75.75 0 001.06 0l3.75-3.75a.75.75 0 00-1.06-1.06L8.75 8.44V1.75a.75.75 0 00-1.5 0v6.69L4.78 5.97a.75.75 0 00-1.06 1.06l3.75 3.75zM3.75 13a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5z"></path></svg>';


const FORMAT_FILES_COLUMNS = [
    {
        field: 'id', 
        width:40  
    },
    {
        field: 'description', 
        editor:'textarea',
        cellEdited: async function (cell){ 
            let res = await sql( `UPDATE files SET description='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
        },
    },
    {
        field: 'Просмотр',
        width:     128, 
        formatter: function(cell) {return `<img alt=':(' src='uploads/${cell.getRow().getData().name}' class='previewImage'>`; }
    },
    {
        title: "Скачать",
        field: 'download',
        formatter:function(){return icon_download;}, 
        width:     20, 
        hozAlign:  "center",  
        cellClick: function(e, cell){ downloadFile(e, 'uploads/'+cell.getRow().getData().name);} 
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
    maxHeight:"100%",
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


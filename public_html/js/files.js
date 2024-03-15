///
/// КОНСТАНТЫ И КОНФИГУРАЦИЯ
///
const STANDARD_QUERY = `SELECT id, 
                    'Открыть' as 'preview',
                    'Смотреть' as 'watchBtn',
                        description, oldName, name, fileType
                    FROM files `;

const FORMAT_FILES_COLUMNS = [
    {
        field: 'description', 
        editor:'textarea', 
        cellEdited: 
            async function(cell){ let res = await sql( `UPDATE files SET description='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);}
    },
    {
        field: 'preview',
        formatter: function(cell) {return `<img src='uploads/${cell.getRow().getData().oldName}' class='previewImage'>`; }
    }
];

/**
* Поведение строки поиска
*/
srch.addEventListener('keydown', function (e) {
    if (e.code == 'Enter') srch.blur(), loadDataToDable(STANDARD_QUERY);
});

/**
 * MAIN CODE -  начало основного кода
 */

console.log('creating table');
var table = new Tabulator("#fileTable", {
    height: "800px",
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


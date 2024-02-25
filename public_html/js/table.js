var table = document.getElementById('contentTable');

async function addRow(selectQuery,tableName){
    const insert_res = await sql('INSERT INTO interfaces (tableName,col) VALUES ("table", "col") ');
    if (insert_res.errors) console.log('Ошибка создания строки')
    console.log(insert_res.data.insertId);
    
    interfaces = await getInterfaces();
    console.log(interfaces)
    let pk = await getPrimaryKey(tableName);
    selectQuery = selectQuery.replace('SELECT', 'SELECT '+pk+', ')
    const res = await sql(selectQuery + ` where ${pk}=${insert_res.data.insertId} LIMIT 1`);
    if (res.errors) console.log('Ошибка выполнения SQL-запроса')
    let dataRow = res.data[0];
    
    
    let row = document.createElement('div');
        table.prepend(row);
        
        row.classList.add('row');
        row.id = '' + dataRow[pk];

        for(let col_name in dataRow){
// TODO тут надо использовать похожий метод, но только обновление ячеек должно создавать новую строку
            setupCells(row, dataRow, pk, col_name, row[pk], tableName);
    };
}


/**
 * TODO: сделать импорт этой конфигурации из таблицы
 */
var interfaces;
async function getInterfaces(){
    const res = await sql(`select * from interfaces;`);
    return res.data;
}
/***
*
*  get_items - Получает записи из таблицы и формирует из неё вид
*
*/
async function getTable(query, tableName) {
    interfaces = await getInterfaces();
    console.log(interfaces)
    let pk = await getPrimaryKey(tableName);
    query = query.replace('SELECT', 'SELECT '+pk+', ')
    const res = await sql(query);
    if (res.errors) console.log('Ошибка выполнения SQL-запроса')
    let data = res.data;

    table.innerHTML = ''; // Стираем предыдущую таблицу
    
    res.data.forEach((dataRow) => {
        let row = document.createElement('div');
        table.appendChild(row);
        
        row.classList.add('row');
        row.id = '' + dataRow[pk];

        for(let col_name in dataRow){
            setupCells(row, dataRow, pk, col_name, row[pk], tableName);
        };
    });

    return res.data;
}




/*
*
* getPrimaryKey - Определяет название ключевого столбца
*
*/
async function getPrimaryKey(tableName){
    const res = await sql(
        `SHOW KEYS FROM ${tableName} WHERE Key_name = 'PRIMARY' `  );
    return res.data[0]['Column_name'];
}


function getInterfaceValue(editor) {
    switch (editor.tagName){
        case 'input':
            return editor.value;
        default:
            return editor.innerHTML;
    }
}
/**
 * @brief Создаёт интерфейс по шаблону, заданному в виде строки html
 * 
 */
function getInterface(col_name, value, ifsType, data, tableName) {
    let interf = interfaces.find(
        elem => (elem.col == col_name && elem.tableName == tableName));
    
    
    if(interf == undefined) interf = interfaces.find(elem => elem.col == '__default');
    
    var div = document.createElement('div');
    if (tableName != 'interfaces'){
        div.innerHTML = eval("`"+interf[ifsType]+"`").trim();
    }else{
            div.innerHTML = `<textarea>${value}</textarea>`;
        }

    if (interf[ifsType] == undefined)
        return undefined;
    return div.firstChild;
}
/**
 * @brief Настройка интерфейсов отдельной ячейки таблицы
 * @param [in] Node     parent      - Родительский элемент ячейки (строка)
 * @param [in] String   value       - Отображаемое значение
 * @param [in] String   pk          - Название столбца с ключевыми полями
 * @param [in] String   col_name    - название столбца таблицы
 * @param [in] Int      rowid       - Уникальный идентефикатор записи в БД
 * @return Description of returned value.
 */
function setupCells(parent, data, pk, colName, rowid, tableName) {
    let cell = document.createElement('div');
    cell.classList.add('cell');
    parent.appendChild(cell);
   
    /// -----------------------------------    
    var view = getInterface(colName, data[colName], 'viewHtml', data, tableName);
    view.innerHTML = data[colName];
    view.classList.add('view')
    cell.appendChild(view);


    /// -----------------------------------    
    var editor = getInterface(
        colName, data[colName], 'editorHtml', data, tableName);
    if (!editor) return;
    
    editor.classList.add('hiddenView');
    editor.classList.add('editor')
    cell.appendChild(editor);
    editor.onblur = async function(e){
        editor.classList.toggle('hiddenView');
        view.classList.toggle('hiddenView');

        if(getInterfaceValue(editor) != data){
            changeValueQuery(view, editor, colName, pk, parent, rowid, tableName);
        }
    };
    editor.onkeydown = function(e) { if(e.key == 'Enter') editor.blur();}
    
    view.onclick = function (){
        view.classList.toggle('hiddenView');
        editor.classList.toggle('hiddenView');
        editor.focus();
    };
}

/***
*
*  changeValueQuery - Отправляет запрос на сервер на редактирование значения ячейки
*
*/
async function changeValueQuery(view, editor, col_name, pk, row, rowid, tableName) {
    view.innerHTML = editor.value;
    view.classList.toggle('changed');
    let ins_res = await sql(`UPDATE ${tableName} SET ${col_name} = "${editor.value}" where ${pk} = ${rowid} limit 1;`);

    if(!ins_res.errors){
        view.classList.toggle('changed');
    }else{
        console.error(ins_res)
        alert("Ошибка. Код  "+ins_res.errors.errno+"   \nСфотографируйте экран и нажмите ОК.")
        view.classList.toggle('error');
    }
    console.log('changed')
}        
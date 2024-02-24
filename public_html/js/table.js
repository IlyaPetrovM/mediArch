var table = document.getElementById('contentTable');
getTable();
const tableName = 'files';
const interface = [
    {
        col:'id',
        editor: `<input>`,
        view: ``
    },
    {
        col:'oldName',
        editor: ``,
        view: ``
    }
];

/***
*
*  get_items - Получает записи из таблицы и формирует из неё вид
*
*/
async function getTable() {
    let pk = await getPrimaryKey('files');
    
    const res = await sql(`SELECT ${pk}, oldName, name, fileType from files`,'');
    if (res.errors) console.log('Ошибка выполнения SQL-запроса')
    let data = res.data;

    table.innerHTML = ''; // Стираем предыдущую таблицу
    res.data.forEach((dataRow) => {
        console.log(dataRow);
        let row = document.createElement('div');
        table.appendChild(row);
        
        row.classList.add('row');
        row.id = '' + dataRow[pk];

        for(let col_name in dataRow){
            setupCells(row, dataRow[col_name], pk, col_name, row[pk]);
        };
    });

    console.log(`-- ГОТОВО --`);
    return res.data;
}




/*
*
* getPrimaryKey - Определяет название ключевого столбца
*
*/
async function getPrimaryKey(tableName){
    const res = await sql(  `SHOW KEYS FROM ${tableName} WHERE Key_name = 'PRIMARY' `  );
    return res.data[0]['Column_name'];
}



/*
*
*  setupCells - Настраивает ячейку таблицы
*
*/
function setupCells(row, dataCell, pk, col_name, rowid) {

    //Ячейка состоит из отображения и интерфейса редактирования
    let cell = setCell(row);
    let view = setView(cell, dataCell);
    let editor = setEditor(cell, dataCell);
    console.log(editor);

    // Взаимодействие
    view.onclick = function (){
        view.classList.toggle('hiddenView');
        editor.classList.toggle('hiddenView');
        editor.focus();
    };
    editor.onblur = async function(e){
        editor.classList.toggle('hiddenView');
        view.classList.toggle('hiddenView');

        if(editor.value != dataCell){
            changeValueQuery(view, editor, col_name, pk, row, rowid);
        }
    };
    editor.onkeydown = function(e) { if(e.key == 'Enter') editor.blur();}
}


function setCell(row) {
    let cell = document.createElement('div');
    cell.classList.add('cell');
    row.appendChild(cell);
    return cell;
}


function setView(cell, dataCell) {
    let view = document.createElement('div');
    view.innerHTML = dataCell;
    cell.appendChild(view);
    return view;
}


function setEditor(cell, dataCell) {
    //cell.innerHTML = cell.innerHTML +  `<input value='${dataCell}' >`;
    var editor = document.createElement('input')  
     cell.appendChild(editor)
    editor.value = dataCell;
    editor.classList.add('hiddenView');
    return editor;
}


/***
*
*  changeValueQuery - Отправляет запрос на сервер на редактирование значения ячейки
*
*/
async function changeValueQuery(view, editor, col_name, pk, row, rowid) {
    view.innerHTML = editor.value;
    view.classList.toggle('changed');
    let ins_res = await sql(`UPDATE files SET ${col_name} = "${editor.value}" where ${pk} = ${rowid} limit 1;`);

    if(!ins_res.errors){
        view.classList.toggle('changed');
    }else{
        console.error(ins_res)
        alert("Ошибка. Код  "+ins_res.errors.errno+"   \nСфотографируйте экран и нажмите ОК.")
        view.classList.toggle('error');
    }
    console.log('changed')
}        
const FORMAT_INFORMANTS_COLUMNS = [

    //  last_name
    {
        field: 'last_name',
        title: 'Фамилия',
        editor: 'list',
        editorParams: {
            autocomplete: "true",
            allowEmpty: true,
            listOnEmpty: true,
            valuesLookup: true,
            freetext: true
        },
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET last_name='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
        },
    },
    //  first_name
    {
        field: 'first_name',
        title: 'Имя',
        editor: 'list',
        editorParams: {
            autocomplete: "true",
            allowEmpty: true,
            listOnEmpty: true,
            valuesLookup: true,
            freetext: true
        },
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET first_name='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
        },
    },
    //  middle_name
    {
        field: 'middle_name',
        title: 'Отчество',
        editor: 'list',
        editorParams: {
            autocomplete: "true",
            allowEmpty: true,
            listOnEmpty: true,
            valuesLookup: true,
            freetext: true
        },
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET middle_name='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
            if (res.errors) alert('Не удалось обновить поле')
        },
    },
     //  birthYear
    {
        field: 'birthYear',
        title: 'Год рождения',
        editor: 'input',
        editorParams:{
            elementAttributes: {
                type:'search',
                step:'1',
                maxsize:'4',
                placeholder:'19..'
            }
        },
        cellEdited: async (cell) => {
            let newVal = "'"+cell.getValue()+"'";
            console.log(newVal)
            if (newVal === "''" || newVal == undefined || newVal.length < 3)
                newVal = 'NULL';
            console.log(newVal)
            let res = await sql(`UPDATE informants SET birthYear=${newVal} WHERE id=${cell.getRow().getData().id}`);
            if (res.errors){
                alert('Не удалось обновить поле. Вводите только 4 цифры года')
                cell.setValue(cell.getOldValue())
            }
        },
    },
    //  birth
    {
        field: 'birth',
        title: 'Дата рождения',
        editor: 'date',
        formatter:(cell) => {
            console.log(cell.getValue())
            if (cell.getValue() !== null )
                return luxon.DateTime.fromISO(cell.getValue()).toFormat('dd.MM.yyyy')
            else return null
        },
        editorParams:{
            format:"dd.MM.yyyy", // the format of the date value stored in the cell
//            elementAttributes: {
//                type:'date'
//            }
        },
        cellEdited: async (cell) => {

            let newVal = "'" + luxon.DateTime.fromFormat(cell.getValue(), "dd.MM.yyyy").toFormat("yyyy-MM-dd") + "'"
            console.log(newVal)
            if (newVal === "''" || newVal == "'Invalid DateTime'" || newVal.length < 3)
                newVal = 'NULL';
            console.log(newVal)
            let res = await sql(`UPDATE informants SET birth=${newVal} WHERE id=${cell.getRow().getData().id}`);
            if (res.errors){
                alert('Не удалось обновить поле')
                cell.setValue(cell.getOldValue())
            }
        }
    },
   //  comments
    {
        field: 'comments',
        title: 'Заметки',
        editor: 'input',
//        editorParams:{
//            elementAttributes:{
//                selectContents:true,
//                verticalNavigation:"editor", //navigate cursor around text area without leaving the cell
//                shiftEnterSubmit:true, //submit cell value on shift enter
//            }
//        },
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET comments='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
            if (res.errors) alert('Не удалось обновить поле')
        },
    },
    //  contacts
    {
        field: 'contacts',
        title: 'Контакты',
        editor: 'input',
//        editorParams:{
//            elementAttributes:{
//                selectContents:true,
//                verticalNavigation:"editor", //navigate cursor around text area without leaving the cell
//                shiftEnterSubmit:true, //submit cell value on shift enter
//            }
//        },
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET contacts='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
            if (res.errors) alert('Не удалось обновить поле')
        },
    },
    //  keywords  BUG!!! При использовании поля textarea почему то не удаётся ввести больше одной буквы
    {
        field: 'keywords',
        title: 'Ключевые слова',
        editor: 'input',
//        editorParams:{
//            elementAttributes:{
//                selectContents:true,
//                verticalNavigation:"editor", //navigate cursor around text area without leaving the cell
//                shiftEnterSubmit:true, //submit cell value on shift enter
//            }
//        },
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET contacts='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
            if (res.errors) alert('Не удалось обновить поле')
        },
    },
    //  hide
    {
        field: 'hide',
        title: 'Скрыть',
        width:16,
        formatter: () => {return 'X' },
        hozAlign:  "center",
        cellClick: async function(e,cell){
            let ans = confirm('Вы уверены, что хотите удалить запись о человеке?')
            if(!ans)return;
            let edit_result = await sql(
                `UPDATE informants SET hide = 1 WHERE id = ${cell.getRow().getData().id}`)
            if (edit_result.errors) {alert('Ошибка при сохранении описания метки в БД')}
            cell.getRow().delete()
        }

    },
    //  reporter
    {
        field: 'reporter',
        title: 'Знакомый собиратель',
        editor: 'input',
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET reporter='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
            if (res.errors) alert('Не удалось обновить поле')
        },
    },
    //  user_created
    {
        field: 'user_created',
        title: 'Кто записал',
    },
    //  date_updated
    {
        field: 'date_updated',
        title: 'Время обновления',
        formatter:(cell) => {
            console.log(cell.getValue())
            if (cell.getValue() !== null )
                return luxon.DateTime.fromISO(cell.getValue()).toFormat('dd.MM.yyyy hh:mm:ss')
            else return null
        }
    },
    //  date_created
    {
        field: 'date_created',
        title: 'Время создания',
        formatter:(cell) => {
            console.log(cell.getValue())
            if (cell.getValue() !== null )
                return luxon.DateTime.fromISO(cell.getValue()).toFormat('dd.MM.yyyy hh:mm:ss')
            else return null
        }
    },
];
var USER = ''

const QUERY_INFORMANTS = `SELECT * from informants WHERE hide is null ORDER BY last_name ASC`;

async function getUsername(){
    let user = ''
    let res = await fetch('/api/session/username',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },body:''
        })
    if(res.ok){
        return await res.json();
    }
}

async function runInformants(){
    let table = new Tabulator('#informantsTable',{
        height:'100%',
        placeholder: 'Введите фразу в поиске',
        autoColumns: true,
        autoColumnsDefinitions: FORMAT_INFORMANTS_COLUMNS
    });

    table.on('tableBuilt', function(e){
        table.setData("api/sql/dataOnly", {
        'query': QUERY_INFORMANTS,
        'inserts': ''
    }, "POST");
    });
    USER = (await getUsername()).data
    console.log(USER)

}
runInformants()


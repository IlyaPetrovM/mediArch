const FORMAT_INFORMANTS_COLUMNS = [
{
        field: 'id',
        width:24

    },
    //  last_name
    {
        field: 'last_name',
        title: 'Фамилия',
        editor: 'list',
        width:128,
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
        width:128,
        editorParams: {
            autocomplete: "true",
            allowEmpty: true,
            listOnEmpty: true,
            valuesLookup: true,
            freetext: true
        },
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET first_name='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
        }
    },
    //  middle_name
    {
        field: 'middle_name',
        title: 'Отчество',
        editor: 'list',
        width:128,
        editorParams: {
            autocomplete: "true",
            allowEmpty: true,
            listOnEmpty: true,
            valuesLookup: true,
            freetext: true
        },
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET middle_name='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
            if (res.errors) {alert('Не удалось обновить поле');}
        },
    },
     //  birthYear
    {
        field: 'birthYear',
        title: 'г/р',
        editor: 'input',
        width:64,
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
            if (newVal === "''" || newVal == undefined || newVal.length < 3){
                newVal = 'NULL';
            }
            console.log(newVal);
            let res = await sql(`UPDATE informants SET birthYear=${newVal} WHERE id=${cell.getRow().getData().id}`);
            if (res.errors){
                alert('Не удалось обновить поле. Вводите только 4 цифры года');
                cell.setValue(cell.getOldValue());
            }
        }
    },

    //  birth
    {
        field: 'birth',
        title: 'д/р',
        editor: 'date',
        width:100,
        editorParams:{
            format:"yyyy-MM-dd"
        },
        formatter:function(cell) {
            console.log(cell.getValue())
            if (cell.getValue() == null ) return null;
            return luxon.DateTime.fromISO(cell.getValue()).toFormat('dd.MM.yyyy');
//            if (cell.getValue() != null )
//                return luxon.DateTime.fromFormat('yyyy.MM.dd hh:mm:ss',cell.getValue()).toFormat('dd.MM.yyyy hh:mm:ss');
//            else return null;
        },
        cellEdited: async (cell) => {
            let newVal = "'" + luxon.DateTime.fromFormat(cell.getValue(), "yyyy-MM-dd").toFormat("yyyy-MM-dd") + "'"
            console.log(newVal)
            if (newVal === "''" || newVal == "'Invalid DateTime'" || newVal.length < 3)
                newVal = 'NULL';
            console.log(newVal)
            let res = await sql(`UPDATE informants SET birth=${newVal} WHERE id=${cell.getRow().getData().id}`);
            if (res.errors){
                alert('Не удалось обновить поле');
                cell.setValue(cell.getOldValue());
            }
            cell.getRow().getCell('birthYear').setValue(luxon.DateTime.fromFormat(cell.getValue(), "yyyy-MM-dd").toFormat("yyyy"));
        }
    },
   //  comments
    {
        field: 'comments',
        title: 'Заметки',
        editor: 'input',
        // BUG!!! При использовании поля textarea почему то не удаётся ввести больше одной буквы
        width:200,
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET comments='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
            if (res.errors) alert('Не удалось обновить поле');
        }
    },
    //  contacts
    {
        field: 'contacts',
        title: 'Контакты',
        editor: 'input',
        width:200,
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET contacts='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
            if (res.errors) alert('Не удалось обновить поле');
        }
    },
    //  keywords
    {
        field: 'keywords',
        title: 'Ключевые слова',
        editor: 'list',
        editorParams:{autocomplete:"true", allowEmpty:true,listOnEmpty:true, valuesLookup:true, freetext:true},
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET contacts='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
            if (res.errors) alert('Не удалось обновить поле');
        }
    },

    //  reporter
    {
        field: 'reporter',
        title: 'Знакомый собиратель',
        editor: 'input',
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET reporter='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
            if (res.errors) alert('Не удалось обновить поле');
        }
    },
    //  user_created
    {
        field: 'user_created',
        title: 'Кто записал'
    },
    //  date_updated -- BUG!! Перестал отображаться
    {
        field: 'date_updated',
        title: 'Время обновления',
        formatter:function(cell) {
            console.log(cell.getValue())
            if (cell.getValue() !== null )
                return luxon.DateTime.fromISO(cell.getValue()).toFormat('dd.MM.yyyy hh:mm:ss');
            else return null;
        }
    },
//      date_created
    {
        field: 'date_created',
        title: 'Время создания',
        formatter:(cell) => {
            if (cell.getValue() !== null )
                return luxon.DateTime.fromISO(cell.getValue()).toFormat('dd.MM.yyyy hh:mm:ss')
            else return null
        }
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
            if (edit_result.errors) {
                alert('Ошибка при сохранении описания метки в БД');
            }
            cell.getRow().delete();
        }
    }
];
var USER = ''

const QUERY_INFORMANTS = `SELECT * FROM informants`;

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

    var table = new Tabulator('#informantsTable',{
        height:'100%',
        placeholder: 'Введите фразу в поиске',
        ajaxContentType: "json",
        layout: "fitColumns",
        autoColumns: true,
        autoColumnsDefinitions: FORMAT_INFORMANTS_COLUMNS
    });
async function runInformants(){

    table.on('tableBuilt', function(e){
        table.setData("api/sql/dataOnly", {
        'query': QUERY_INFORMANTS,
        'inserts': ''
    }, "POST");
    });
    USER = (await getUsername()).data
    console.log(USER)

    document.getElementById('buttonAddInformant').addEventListener('click',function(){
        addInformant(table, USER)
    })
}
runInformants()

async function addInformant(tab, user){
    let res = await sql( `INSERT INTO informants (user_created) VALUES ('${user}')`)
    if(res.errors){
        alert("Ошибка при добавлении Иинформанта")
        return;
    }
    let row = tab.addRow({
        id: res.data.insertId,
        user_created: user,
        birth:null
    });
    tab.deselectRow();
    tab.selectRow(res.data.insertId);
}

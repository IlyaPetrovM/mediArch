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
        headerFilter:"input",
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
    //  last_name_at_birth
    {
        field: 'last_name_at_birth',
        title: 'Фамилия при рождении',
        editor: 'list',
        width:128,
        headerFilter:"input",
        editorParams: {
            autocomplete: "true",
            allowEmpty: true,
            listOnEmpty: true,
            valuesLookup: true,
            freetext: true
        },
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET last_name_at_birth='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
        },
    },

    //  first_name
    {
        field: 'first_name',
        title: 'Имя',
        headerFilter:"input",
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
        headerFilter:"input",
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
    //  nickname
    {
        field: 'nickname',
        title: 'Короткое имя',
        editor: 'input',
        width:128,
        headerFilter:"input",
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET nickname='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
        },
    },

     //  birthYear
    {
        field: 'birthYear',
        title: 'г/р',
        editor: 'input',
        headerFilter:"number",
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
        headerFilter:"input",
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
        headerFilter:"input",
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
        headerFilter:"input",
        cellEdited: async (cell) => {
            let res = await sql(`UPDATE informants SET reporter='${cell.getValue()}' WHERE id=${cell.getRow().getData().id}`);
            if (res.errors) alert('Не удалось обновить поле');
        }
    },
    //  user_created
    {
        field: 'user_created',
        title: 'Кто записал',
        headerFilter:"input"
    },
    //  date_updated -- BUG!! Перестал отображаться
    {
        field: 'date_updated',
        title: 'Время обновления',
        visible: false,
        formatter:function(cell) {
//            console.log(cell.getValue())
            if (cell.getValue() !== null )
                return luxon.DateTime.fromISO(cell.getValue()).toFormat('dd.MM.yyyy hh:mm:ss');
            else return null;
        }
    },
//      date_created
    {
        field: 'date_created',
        title: 'Время создания',
        visible: false,
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
        headerFilter:"tickCross",
//        editor:'tickCross',
        headerFilterParams:{initial:"true"},
//        headerFilterEmptyCheck:function(value){return value == ''},
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
getUsername().then(res => {
    USER = res.data
    userName.innerHTML = USER;
});

btnExit.onclick = () => {
    endSession().then(res => {
        window.location.reload()
    })
}

const QUERY_SELECT_FROM = `SELECT * FROM informants `;



/**
 * @brief Главная функция - для настройки таблицы и событий
 */
async function runInformants(){
    var table = new Tabulator('#informantsTable',{
        height:'100%',
        selectableRows:true,
        rowHeader: {
            headerSort: false,
            resizable: false,
            frozen: true,
            width: 20,
            headerHozAlign: "center",
            hozAlign: "center",
            formatter: "rowSelection",
            titleFormatter: "rowSelection",
            cellClick: function (e, cell) {
                cell.getRow().toggleSelect();
            }
        },
        placeholder: 'Введите фразу в поиске',
        ajaxContentType: "json",
        layout: "fitColumns",
        autoColumns: true,
        autoColumnsDefinitions: FORMAT_INFORMANTS_COLUMNS,
    });

    table.on('tableBuilt', function(e){
            table.setData("api/sql/dataOnly", {
            'query': QUERY_SELECT_FROM,
            'inserts': ''
        }, "POST");
    });
    table.on("dataProcessed", function(data){
        if(data.length>0) console.log(table.getColumn('hide').setHeaderFilterValue(false));
    });
    
    
//    console.log(USER)


    /// Обработка событий
    document.getElementById('buttonAddInformant').addEventListener('click',function(){
        // addInformant(table, USER)
        addInformantWithModal(table, USER);
    })
    document.getElementById('inputSearchInformant').addEventListener('keydown', function(e){
        if(e.code == 'Enter'){
            e.target.blur();
            searchInformants(table, e.target.value);
        }
    })
    document.getElementById('buttonSearchInformant').addEventListener('click', function(){
        searchInformants(table, document.getElementById('inputSearchInformant').value)
    })
}
runInformants();



/**
 * @brief Добавление нового информанта в таблицу
 * @param [in] Tabulator tab - таблица с данными информантов
 * @param [in] String    user - логин пользователя
 * @return Description of returned value.
 */
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

async function addInformantWithModal(tab, user){
    const modal = new bootstrap.Modal(document.getElementById('modalAddInformant'));
    
    const formElem = document.getElementById('formAddInformant');
    modal.toggle();
    
    document.getElementById('btnCloseModal').addEventListener('click', () => formElem.reset())
    
    document.getElementById('btnSaveModal').addEventListener('click', async (e) => {
        
        const form = new FormData(document.getElementById('formAddInformant'));
        form.forEach((v,k) => console.log(v,k))
        const res = await sql( `
            INSERT INTO informants (
                user_created, 
                nickname, 
                first_name, 
                middle_name, 
                last_name, 
                last_name_at_birth,
                birthYear,
                comments,
                contacts
            ) VALUES (
                 '${user}',
                 '${form.get('nickname')}',
                 '${form.get('first_name')}',
                 '${form.get('middle_name')}',
                 '${form.get('last_name')}',
                 '${form.get('last_name_at_birth')}',
                 ${form.get('birthYear') ? form.get('birthYear') : null},
                 '${form.get('comments')}',
                 '${form.get('contacts')}'
            )
        `)
        if(res.errors){
            alert('не удалось добавить информанта')
            return;
        }
        let row = tab.addRow({
            id: res.data.insertId, 
            user_created: user,
            first_name: form.get('nickname'), 
            middle_name: form.get('middle_name'), 
            last_name: form.get('last_name'), 
            last_name_at_birth: form.get('last_name_at_birth'),
            birthYear: form.get('birthYear'),
            comments: form.get('comments'),
            contacts: form.get('contacts')
        }, 1);
        
        formElem.reset();
        tab.deselectRow();
        tab.selectRow(res.data.insertId);
        console.log('Saved');
    })
    //open form
    //on close form --> add inf


}

/**
 * @brief Поиск информантов
 * @param [in] Tabulator tab - таблица с данными информантов
 */
function searchInformants(tab, val){
    console.log(val)
    let where = ''
    if(!(val === undefined || val === '')){
        where = ' WHERE '
        const FIELDS = ['last_name','last_name_at_birth','nickname', 'first_name', 'middle_name','comments', 'comments',  'contacts', 'keywords', 'reporter', 'user_created'];

        const WORDS = val.split(/ +|,+|;+/)

        for(let i in WORDS){
            if(WORDS[i]=='') continue;
            for (j in FIELDS){
                where += ` (${FIELDS[j]} LIKE '%${WORDS[i]}%') OR`
            }
        }
        where = where.substring(0, where.length-2)
        console.log(where)
    }
    tab.setData("api/sql/dataOnly", {
        'query': QUERY_SELECT_FROM + where,
        'inserts': ''
    }, "POST");
}



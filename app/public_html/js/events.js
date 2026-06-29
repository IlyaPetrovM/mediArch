(()=>{

  let USER = ''
  getUsername().then(res => {
      USER = res.data
      userName.innerHTML = USER;
      console.log(USER)
  });

  const table = new Tabulator('#eventsTable', {
    heigth: 'calc(100vh - 64px)',
    ajaxContentType: 'json',
    autoColumns: true,
    autoColumnsDefinitions: [
      {
        field: 'title',
        title: 'Название',
        editor: 'input',
        headerFilter:'input',
        cellEdited: (cell) => {
          const val = cell.getValue();
          const id = cell.getRow().getData().id;
          try {
            const res = sql(
              `UPDATE events SET title = '${val}' WHERE id = ${id}`
            );
            if (res.errors) {
              alert('Не удалось обновить поле');
            }
          } catch (e) {
            console.error(e);
          }
        },
      },
      {
        field: 'date_start',
        title: 'Дата',
        editor: 'date',
        width:100,
        cellEdited: (cell) => {
          const val = cell.getValue();
          console.log(val)
          const id = cell.getRow().getData().id;
          try {
            const res = sql(
              `UPDATE events SET date_start = '${val}' WHERE id = ${id}`
            );
            if (res.errors) {
              alert('Не удалось обновить поле');
            }
          } catch (e) {
            console.error(e);
          }
        },
        formatter: function (cell) {
          if (cell.getValue() !== null) return luxon.DateTime.fromISO(cell.getValue()).toFormat('dd.MM.yyyy');
          else return null;},
      },
      {
        field:'view_files',
        formatter:(cell)=>{ return `<a href='/files.html?event_id=${cell.getRow().getData().id}'> Смотреть файлы </a>` },
      },
    ],
  });

  table.on('tableBuilt', e =>{
    table.setData('api/sql/dataOnly',{
      'query': `select id, title, date_start, time_start, user_created, '>>>' as view_files , 'x' as del  FROM events ORDER BY date_start DESC`,
      'inserts': ''
    }, 'POST');
  });

  buttonAddEvent.onclick = addEventWithModal ; 
  // async ()=>{
  //   try{
  //     const res = await sql (`INSERT INTO events (user_created) VALUES ('${USER}') `);
  //     if(res.errors){
  //       alert('Ошибка при добавлении события в базу')
  //       console.log(res)
  //       return 
  //     }
  //     const row = table.addRow({
  //       id: res.data.insertId,
  //       user_created: USER,
  //     }, 1)
  //     table.deselectRow();
  //     table.selectRow(res.data.insertId);
  //     // await addEventWithModal();
  //   }catch(e){
  //     console.log(e)
  //     alert('Не удалось добавить событие')
  //   }
  // }

  async function addEventWithModal(){
    const modalAddEvent = document.getElementById('modalAddEvent');
    const modal = new bootstrap.Modal(modalAddEvent);
    const formElem = document.getElementById('formAddEvent');

    modal.toggle();

    document.getElementById('btnCloseModal').addEventListener('click', () => formElem.reset());
   
    document.getElementById('btnSaveModal').addEventListener('click', async (e) => {
      const form = new FormData(document.getElementById('formAddEvent'));
      if(form.get('date_start')==''){
        alert('Дата не указана! Укажите дату события.')
        return;
      }
      
      console.log(
        form.get('title'),
        form.get('date_start')
      )
      
      // Сохранение тут.
      try{
        const res = await sql (`INSERT INTO events (
              user_created,
              title,
              date_start
            ) 
            VALUES (
              '${USER}', 
              '${form.get('title')}', 
              '${form.get('date_start')}'
            ) `);
        if(res.errors) throw new Error(JSON.stringify(res.errors));

        const row = table.addRow({
          id:           res.data.insertId,
          user_created: USER,
          title:        form.get('title'),
          date_start:   form.get('date_start')
        }, 1)

        table.deselectRow();
        table.selectRow(res.data.insertId);
        
      }catch(e){
        console.error(e);
        alert('Не удалось добавить событие')
      }

      
      console.log('saved')
      formElem.reset();
      modal.toggle();
    })
  }

})();

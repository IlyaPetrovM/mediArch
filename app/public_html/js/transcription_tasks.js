(()=>{

  let USER = ''
  getUsername().then(res => {
      USER = res.data
      userName.innerHTML = USER;
  });

  btnExit.onclick = () => {
      endSession().then(res => {
          window.location.reload()
      })
  }

  const urlParams = new URLSearchParams(document.location.search)
  const FILE_ID = urlParams.get('file_id');

  let query = `SELECT 'Отмена' as cancel, file_id, task_id, status, created_at, updated_at, model_size, url, splitted_file_id, format, min_mark_duration_ms, error_message FROM transcribtion_tasks`;
  if (FILE_ID) query += ` WHERE file_id = ${FILE_ID}`;
  query += ` ORDER BY created_at DESC`;

  const formatDateTime = function (cell) {
    if (cell.getValue() !== null) return luxon.DateTime.fromISO(cell.getValue()).toFormat('dd.MM.yyyy HH:mm:ss');
    else return null;
  };

  async function cancelTask(cell) {
    const row = cell.getRow().getData();
    if (row.status === 'canceled') return;
    if (!confirm('Отменить задачу транскрибации?')) return;
    try {
      const res = await sql(
        `UPDATE transcribtion_tasks SET status = 'canceled' WHERE task_id = '${row.task_id}'`
      );
      if (res.errors) {
        alert('Не удалось отменить задачу');
        return;
      }
      cell.getRow().update({ status: 'canceled' });
    } catch (e) {
      console.error(e);
      alert('Не удалось отменить задачу');
    }
  }

  const FORMAT_COLUMNS = [
    {
      field: 'cancel',
      title: '',
      width: 90,
      hozAlign: 'center',
      headerSort: false,
      formatter: (cell) => `<button class="btn btn-sm btn-danger">Отмена</button>`,
      cellClick: (e, cell) => cancelTask(cell),
    },
    { field: 'file_id', title: 'ID файла', width: 90, headerFilter: 'input' },
    { field: 'task_id', title: 'ID задачи', headerFilter: 'input' },
    { field: 'status', title: 'Статус', width: 120, headerFilter: 'input' },
    { field: 'created_at', title: 'Запущена', width: 170, formatter: formatDateTime },
    { field: 'updated_at', title: 'Обновлена', width: 170, formatter: formatDateTime },
    { field: 'model_size', title: 'Модель', width: 110 },
    { field: 'url', title: 'URL' },
    { field: 'splitted_file_id', title: 'ID разбитого файла' },
    { field: 'format', title: 'Формат', width: 90 },
    { field: 'min_mark_duration_ms', title: 'Мин. длит. метки (мс)', width: 120 },
    { field: 'error_message', title: 'Ошибка' },
  ];

  const table = new Tabulator('#tasksTable', {
    height: 'calc(100vh - 64px)',
    ajaxContentType: 'json',
    autoColumns: true,
    autoColumnsDefinitions: FORMAT_COLUMNS,
  });

  table.on('tableBuilt', e =>{
    table.setData('api/sql/dataOnly',{
      'query': query,
      'inserts': ''
    }, 'POST');
  });

})();

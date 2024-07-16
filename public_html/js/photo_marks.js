// photomarks
(async () => {


  
    var anno = Annotorious.init({
      image: 'previewImg' // image element or ID
    });




  const urlParams = new URLSearchParams(document.location.search);
  const FILE_ID = urlParams.get('file_id');

  const QUERY_MARKS = `SELECT 
        p.id,
        p.title,
        rect_top, 
        rect_left, 
        rect_width,
        rect_height,
        f.name
      FROM photo_marks as p
      JOIN files f ON (f.id = file_id AND file_id = ${FILE_ID} )`;
  let where = '';

  const table = new Tabulator('#marksTable', {
    height: 'calc(100vh - 64px)',
    layout: 'fitColumns',
    ajaxContentType: 'json',
    layout: 'fitColumns',
    autoColumns: true,
    autoColumnsDefinitions: [
      {
        field: 'rect_top',
        visible: false,
      },
    ],
  });

  table.on('tableBuilt', function (e) {
    table.setData(
      'api/sql/dataOnly',
      {
        query: QUERY_MARKS + where,
        inserts: '',
      },
      'POST'
    );
  });
  let dataLoading = false;
  table.on('dataLoaded', async (data) => {
    
    console.log(data);
    
    if (!data) return;
    const file = data[0];
    playFile(null, file.name, true);
    try{
      const res_sql = await sql(`SELECT annotation FROM files WHERE id = ${FILE_ID}`);
      if(res_sql.errors) throw new Error(JSON.stringify(res_sql.errors));
      const a = JSON.parse(res_sql.data[0].annotation);
        console.log(a);
      anno.setAnnotations(a);
    }catch(err){
      console.error(err)
    }
    // anno.addAnnotation(annotation);
    
    anno.on('createAnnotation', async function(annotation) {
      // TODO adding annotation to DB
      let annot = JSON.stringify(annotation);
      try{
        if(!FILE_ID) return;
        const res = await sql(`UPDATE files SET annotation = '${annot}' WHERE id = ${FILE_ID}`)
        if(res.errors){
          throw new Error(JSON.stringify(res.errors))
        }
        console.log(annotation)
      }catch(err){
        console.error(err);
      }
    });
  });

      // anno.loadAnnotations('annotations.w3c.json'); // todo loading

    // Add event handlers using .on  



  function FORMAT_MARKS_COLUMNS() {
    return [
      {
        field: 'rect_top',
        visible: false,
      },
    ];
  }

})();

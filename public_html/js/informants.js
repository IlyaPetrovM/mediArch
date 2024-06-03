const FORMAT_INFORMANTS_COLUMNS = [

];
const QUERY_INFORMANTS = `SELECT * from informants WHERE hide is null ORDER BY last_name ASC`;

function runInformants(){
    let table = new Tabulator('#informantsTable',{
        height:'100%',
        placeholder: 'Введите фразу в поиске',
        autoColumns: true,
        autoColumnsDefinitions: FORMAT_INFORMANTS_COLUMNS
    })
    table.on('tableBuilt', function(e){
        table.setData("api/sql/dataOnly", {
        'query': QUERY_INFORMANTS,
        'inserts': ''
    }, "POST");
    });
}
runInformants()

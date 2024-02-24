/** 
    Выполнение запроса к серверу при помощи fetch 
*/
async function sql(query, inserts) {
    let response = await fetch('/api/sql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'query': query,
            'inserts': inserts
        })
    });
    if (response.ok) {
        return await response.json();
    }

}

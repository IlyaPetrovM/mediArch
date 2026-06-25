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

/**
 * @brief Определение какой пользователь авторизовался
 * @return JSON с именем пользователя в формате {username: <имя> }
 */
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

/**
 * @brief Выйти
 * @return JSON с именем пользователя в формате {username: <имя> }
 */
async function endSession(){
    let user = ''
    let res = await fetch('/api/session/end',{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },body:''
        })
    if(res.ok){
        return await res.json();
    }
}
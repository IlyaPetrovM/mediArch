// Единый пароль для всех пользователей (вход без ввода пароля)
const DEFAULT_PASSWORD = '1';

// Загрузка списка пользователей в выпадающий список
async function loadUsers(){
    let response = await fetch('/api/users');
    if(!response.ok) return;

    let res = await response.json();
    let select = document.getElementById('inputUsername');

    // Пустой нередактируемый пункт-заглушка
    let placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Выберите пользователя';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    (res.data || []).forEach(user => {
        let option = document.createElement('option');
        // авторизуемся по email, а показываем Фамилию и Имя
        option.value = user.email;
        option.textContent = (user.last_name + ' ' + user.first_name).trim() || user.email;
        select.appendChild(option);
    });
}
loadUsers();

document.getElementById('inputUsername').addEventListener('keydown', e => {
    if(e.code == 'Enter') login();
})

async function login(){

    let response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'username': document.getElementById('inputUsername').value,
                'password': DEFAULT_PASSWORD
            })
        });
        if (response.ok) {
        let res = await response.json();
        console.log(res)
        if(res.errors){
            msg.innerHTML = 'Не удалось войти. Попробуйте ещё раз';
            return;
        }
        window.location.href = "/files.html";
    }
}

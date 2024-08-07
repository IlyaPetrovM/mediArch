inputUsername.onfocus = ()=>{
    msg.innerHTML = ''
}

document.getElementById('inputPassword').addEventListener('keydown', e => {if(e.code == 'Enter') login();})
document.getElementById('inputUsername').addEventListener('keydown', e => {
    if(e.code == 'Enter') document.getElementById('inputPassword').focus();
})


async function login(){

    let response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'username': inputUsername.value.trim(),
                'password': inputPassword.value
            })
        });
        if (response.ok) {
        let res = await response.json();
        console.log(res)
        if(res.errors){
            msg.innerHTML = 'Пользователь не найден. Проверьте email/пароль';
            inputUsername.value = ''
            inputPassword.value = ''
            return;
        }
        window.location.href = "/files.html";
    }
}

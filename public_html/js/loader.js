uploadButton.addEventListener('click', load)

/** 
   Общее
    Печать в текстовом поле
*/
function print(t) {
    filesReadyList.innerHTML = t + '\n' + filesReadyList.innerHTML;
}


/** 
    Перехватываем событие отправки формы, чтобы нас не перенаправляло на другие страницы
*/
loaderForm.addEventListener('submit', (e) => {
    e.preventDefault(); // запрещаем распространение события после исполнения нашей функции
    return false;
})


/** 
Загрузка
    Загрузка нескольких файлов
*/
async function load() {
    let files = filesInput.files;
    print('-- ЗАГРУЖАЕМ --')

    for (let i = 0; i < files.length; i++) {
        let load_res = await loadFileXhr(files[i], progressPrint); // с помощью await ждём загрузки каждого файла по отдельности
        const sql_res = await sql('INSERT INTO ?? (??) VALUES ( ? ) ',
            ['files', ['oldName', 'name', 'filetype'],
                [files[i].name, transliterate(files[i].name), getUrlExtention(files[i].name)]]);

        if (load_res.errors) console.log('Ошибка загрузки файла')
        if (sql_res.errors) console.log('Ошибка выполнения SQL-запроса')

        print(`id ${sql_res.data.insertId}. ${load_res.data}\tOK`);
    }
    print(`-- ГОТОВО --`);

}

/**
* Определяет расширение файла
*/
function getUrlExtention( url ) {
  return url.split(/[#?]/)[0].split('.').pop().trim().toLowerCase();
}



/**
   Загрузка
    Вывод промежуточных результатов процесса загрузки 
*/
async function progressPrint(event, file) {
    progressOutput.value =
        Math.ceil((event.loaded / event.total) * 10000) / 100 + '%\t-->\t' + file.name + '\n';
};

/** 
    Способ загрузки #1. 
    Загрузка одного файла. async чтобы она происходила последовательно
*/
async function loadOneFile(file){    
    const formData = new FormData();
    formData.append('many_files', file);

    let result = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    if (result.ok){
        const data = await result.json()
        console.log(data)
        return data;
    }
}

/** 
    Способ загрузки #2. 
    В параметр onprogress необходимо передать функцию с двумя параметрами event и file 
      и она будет запускаться каждый раз при загрузке очередной порции
*/
function loadFileXhr(file, onprogress){     
    return new Promise((resolve, reject) =>{
        const formData = new FormData();
        formData.append('many_files', file);
        
        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');
        xhr.upload.onprogress = (event) => {onprogress(event, file); };
        
        xhr.onload = function(){
            resolve(JSON.parse(xhr.response))
        };

        xhr.onerror = function () {
            reject({
                errors: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send(formData);
    });
}   

const alphabet = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z","х":"h","ъ":"","Ф":"F","Ы":"I","В":"V","А":"A","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"","б":"b","ю":"yu", ' ':'_'};

function transliterate(word){
  return word.split('').map(function (char) { 
    return alphabet[char] || char; 
  }).join("");
}
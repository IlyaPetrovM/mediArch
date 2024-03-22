const config  = require('./config')
const fs = require('fs');
const path = require('path');

const { exec } = require('child_process');
var yandex_speech = require('yandex-speech');

// Пример использования
//
//recognizeAudio('public_html/uploads/Styopka_.mp3', 'temp_audio/', 10, function(res){
//    console.log('\n  Удалось обработать кусочки:', res)
//});

/**
 * @brief Разбивает большой аудиофайл на несколько фрагментов и распознаёт в них текст
 * @param [in] inputPath - путь к обрабатываемому файлу
 * @param [in] tempDir - папка для хранения временных файлов фрагментов
 * @param [in] segmentSize_sec - размеры фрагментов
 * @param [out] callback - функция, которая запускается, когда файлы обработаны
 * @return 
 */
function recognizeAudio(inputPath, tempDir, segmentSize_sec = 60, callback) {
    const fileName = path.basename(inputPath);

    const outputDir = tempDir + fileName + '/'
    if (!fs.existsSync(outputDir))
        fs.mkdirSync(outputDir)

    const command = `ffmpeg -i ${inputPath} -f segment -segment_time ${segmentSize_sec} -b:a 128k ${outputDir}FRG_${segmentSize_sec}sec_%05d.mp3`

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
        console.log(`Аудиофайл успешно разделен на фрагменты по ${segmentSize_sec}  секунд.`);
        recogAudioFragmInDir(outputDir).then(callback);
        console.log('ГОТОВО')
    });
}

/**
 * @brief Распознаёт текст в аудио файлах, лежащих в одной папке
 * @param [in] directoryPath - папка, где лежат файлы для распознавания
 * @return JSON с названиями файлов и распознаным текстом
 */
async function recogAudioFragmInDir(directoryPath) {
    return new Promise((resolve)=>{ 
        var res = {}
        fs.readdir(directoryPath, async function (err, files) {
        if (err) {
            console.error('Ошибка при чтении папки:', err);
            return;
        }
        console.log('Файлы в указанной папке:');
        for (let i in files){
            console.log('Обрабатываю файл', files[i])
            
            let r = await recog1MbAudio(directoryPath, files[i])
            res[r.filename] = r.result
            
            console.log(files[i], 'ГОТОВ\n\n')
            
            fs.unlink(directoryPath + files[i],  
                      err => {if (err) {console.error(`Ошибка при удалении файла ${directoryPath + files[i]}:`, err)} else {console.log(`Файл ${directoryPath + files[i]} успешно удален`)}})
        }
        resolve(res)
    })});
}

/**
 * @brief Распознаёт текст в файле размером не более 1 МегаБайта
 * @param [in] directoryPath - путь к папке, где лежит файл
 * @param [in] fileName - Название файла
 * @return Массив с названием файла (ячейка 0) и распознаным текстом (ячейка 1)
 */
async function recog1MbAudio(directoryPath, fileName){ //файлы не более чем 1 MB
    return new Promise(
        function(resolve){
            yandex_speech.ASR({
                developer_key: config.YANDEX_API,
                file: directoryPath + fileName
            },
            function (err, httpResponse, result) {
                if (err) console.error(err)
                else resolve( {'filename':fileName, 'result': result} )
            });
        });
}

module.exports = recognizeAudio
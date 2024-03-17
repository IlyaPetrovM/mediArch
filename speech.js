
var yandex_speech = require('yandex-speech');

//файлы не более чем 1 MB

yandex_speech.ASR({
    developer_key: 'c19623d5-58d2-4f9a-898f-bdabd39bb431',    
    file: 'audio-file2.mp3',
    }, function(err, httpResponse, result){
        if(err){
    		console.error(err);
    	}else{
    		console.log(httpResponse.statusCode, result)
    	}
    }
);
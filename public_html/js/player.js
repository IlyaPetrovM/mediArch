// player.js

const UPLOAD_PATH = 'uploads/'; // must en with '/'
const PREVIEW_PATH = 'uploads/preview/'; // must en with '/'
/**
*
*/
function getFilePath(filename, useProxy=true){
   return UPLOAD_PATH + filename;
}
/**
* Определяет расширение файла
*/
function getUrlExtention( url ) {
  return url.split(/[#?]/)[0].split('.').pop().trim().toLowerCase();
}


 /**
* Запуск просмотра файла в окне предпросмотра
* previewImg
* previewImg, previewVideo, peviewIframe - идентефикаторы элементов, где будут появляться предпросмотр
*/
function playFile(event, name, useProxy=false){
   let path = getFilePath(name, useProxy);
   let ext = getUrlExtention(path);
   console.log(path)
    
   previewImg.hidden = previewVideo.hidden = previewIframe.hidden = true;
   switch(ext){
      case 'mkv':
      case 'mov':
      case 'wav':
      case 'aac':
      case 'mp3':
      case 'mp4': 
        previewVideo.src = path; 
        previewVideo.hidden = false;
        break;
      case 'gif':
      case 'bmp':
      case 'svg':
      case 'png':
      case 'tif':
      case 'jpg':
        previewImg.src = path;
        previewImg.hidden = false;
        break;
      default:
        previewIframe.src = path;
        previewIframe.hidden = false;
   } 
}
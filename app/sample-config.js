const config = {
    YANDEX_API: 'xxxxxxx-xxxx-xxx-xxx-xxxxxxxxxxx',
    PORT: 3000,
    UPLOAD_PATH:__dirname + '/public_html/uploads/',
    CHUNKS_DIR:__dirname + '/public_html/upload_parts/',
    MASTER_WISPER_URL: process.env.MASTER_WISPER_URL || 'http://master-wisper:8000',
    FILE_STORAGE_URL: process.env.FILE_STORAGE_URL || 'http://file-storage-service:3001',
    DB:{
        host: process.env.DB_HOST || 'localhost',
        database: "mediarch",
        user: "mediarch_user",
        password: 'mediarch_password'
    }
}
module.exports = config
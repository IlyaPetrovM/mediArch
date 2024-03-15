const config = {
    PORT: 3000,
    UPLOAD_PATH:__dirname + '/public_html/uploads/',
    DB:{
        host: "localhost",
        database: "test_file_uploader",
        user: "YOUR_DATABASE_USER",
        password: 'YOUR_DATABASE_PASSWORD'
    }
}
module.exports = config
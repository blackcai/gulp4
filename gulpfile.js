const { src, dest, series, task, watch } = require('gulp')
const connect = require('gulp-connect')
const proxy = require('http-proxy-middleware')
const sass = require('gulp-sass')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const rename = require('gulp-rename')
const util = require('gulp-util')

// 文件目录位置
const javascript = './javascript/**/*.js',
      html = './src/**/*.html',
      scss = './scss/**/*.scss'

function server() {
    connect.server({
        root: './src', // 启动的根目录
        port: 3000, // 端口
        host: '127.0.0.1', // 运行时的 host
        name: 'Server', // 启动或者停止服务的时候输出的名字
        https: false, // 当 https 开启的时候，可以使用node文档中的任何一个参数，然后在内部使用一些默认的参数
        livereload: true, // 是否即时刷新，可以直接设置为true
        fallback: '',
        middleware: (connect, opt) => {
          /*
          * 简单的反向代理，具体请查看 http-proxy-middleware 插件说明文档
          * 如果觉得太麻烦
          * 将下面的 /api 改为你的请求接口的字段
          * 将下面的 target 改为你的请求接口地址
          */
          return [
            proxy('/api', {
              target: 'http://127.0.0.1',
              changeOrigin: true
            })
          ]
        },
        debug: false,
        index: true
      })
}

/* html */
function buildHtml() {
    return src(html).pipe(connect.reload())
}

/* javascript */
function buildJavascript() {
    return src(javascript)
    .pipe(babel()) // 转换为es-2015
    .pipe(dest('./src/js')) // 在压缩前先保存一个未压缩的文件
    .pipe(uglify()) // 压缩
    .pipe(rename({suffix: '.min'})) // 重命名
    .on('error', function (err) { // 错误打印演示
      util.log(util.colors.red('[Error]'), err.toString());
    })
    .pipe(dest('./src/js'))
    .pipe(connect.reload())
}

/* scss */
function buildScss() {
    return src(scss)
    .pipe(sass())
    .pipe(dest('./src/css'))
    .pipe(connect.reload())
}

/* watch */
const watcher = watch([javascript, html, scss])
watcher.on('change', (path, stats) => {
    buildHtml()
    buildJavascript()
    buildScss()
    console.log(`File ${path} was changed`)
})

watcher.on('add', function(path, stats) {
    buildJavascript()
    console.log(`File ${path} was added`)
})

watcher.on('unlink', function(path, stats) {
    buildJavascript()
    console.log(`File ${path} was removed`)
})

task('default', series(server, buildHtml, buildJavascript, buildScss))

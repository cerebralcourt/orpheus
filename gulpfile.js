const { src, dest, series, parallel, watch } = require("gulp")
const mode = require("gulp-mode")()
const webpack = require("webpack-stream")
const postcss = require("gulp-postcss")
const csso = require("gulp-csso")
const sourcemaps = require("gulp-sourcemaps")
const printSpaceSavings = require("gulp-print-spacesavings")
const del = require("del")

const paths = {
  public: "public/**/*",
  styles: "styles/index.css",
  js: "src/index.js",
}

function clean() {
  return del("build")
}

function public() {
  return src(paths.public)
    .pipe(dest("build"))
}

function styles() {
  return src(paths.styles)
    .pipe(mode.development(sourcemaps.init()))
    .pipe(postcss([
      require("autoprefixer"),
      require("tailwindcss"),
    ]))
    .pipe(mode.development(sourcemaps.write()))
    .pipe(mode.production(printSpaceSavings.init()))
    .pipe(mode.production(csso()))
    .pipe(mode.production(printSpaceSavings.print()))
    .pipe(dest("build"))
}

function js() {
  return src(paths.js)
    .pipe(mode.development(sourcemaps.init()))
    .pipe(webpack({
      mode: process.env.NODE_ENV,
      output: {
        filename: "index.js",
      },
      module: {
        rules: [
          {
            test: /\.jsx?$/,
            use: {
              loader: "babel-loader",
              options: {
                presets: ["solid"],
              },
            },
          },
        ],
      },
    }))
    .pipe(mode.development(sourcemaps.write()))
    .pipe(dest("build"))
}

module.exports = {
  public,
  styles,
  js,
  watch() {
    watch("public/**/*", public)
    watch("styles/**/*.css", styles)
    watch(["src/**/*.js", "src/**/*.jsx"], js)
  },
  build: series(clean, parallel(public, styles, js)),
}

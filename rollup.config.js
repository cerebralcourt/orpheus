import { babel } from "@rollup/plugin-babel"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import { uglify } from "rollup-plugin-uglify"
import copy from "rollup-plugin-copy"
import postcss from "rollup-plugin-postcss"
import analyze from "rollup-plugin-analyzer"

const prod = process.env.NODE_ENV === "production"
const plugins = [
  copy({
    targets: [
      { src: "index.html", dest: "build" },
      { src: "assets", dest: "build" },
    ],
  }),
  babel({ babelHelpers: "bundled" }),
  nodeResolve(),
  postcss({
  	extract: "style.css",
    plugins: [
      require("tailwindcss"),
      require("autoprefixer"),
      ...(prod ? [require("cssnano")] : []),
    ],
  })
]

if (prod) {
  plugins.push(uglify(), analyze())
}

export default {
  input: "src/index.js",
  output: {
    file: "build/main.js",
    format: "cjs",
  },
  plugins,
}

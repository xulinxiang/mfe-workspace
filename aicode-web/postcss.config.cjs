/** 源码写 px，构建时转 rem（root 16px），便于适配又不心算 rem */
module.exports = {
  plugins: [
    require('postcss-pxtorem')({
      rootValue: 16,
      unitPrecision: 5,
      propList: ['*'],
      selectorBlackList: [],
      replace: true,
      mediaQuery: true,
      minPixelValue: 2,
      exclude: /node_modules/i,
    }),
  ],
}

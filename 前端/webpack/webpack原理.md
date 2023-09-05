



# webpack原理

## 1.1 构建流程

- 初始化参数（shell语句）
- 加载配置并编译
- 确定入口文件
- 递归寻找模块依赖并编译模块（调用loader对模块进行翻译）
- 完成模块编译（获取翻译后的内容和依赖关系)
- 输出资源（返回chunk）
- 输出完成（根据配置将文件输出到指定路径）

## 1.2 构建细节

**监听模式下构建流程会在文件发生变化时重新编译并且输出**

![image-20230811092920219](C:\Users\TST\AppData\Roaming\Typora\typora-user-images\image-20230811092920219.png)

- 初始化（启动构建，读取合并配置参数，加载plugin，实例化compiler）

- 编译（从入口触发对每个模块调用对应的loader进行翻译，再递归寻找模块依赖进行编译处理）

- 输出（将编译后的模块组合成chunk，把chunk转换成文件输出到系统）

  ### 1.2.1 初始化阶段

  ![image-20230811093927467](C:\Users\TST\AppData\Roaming\Typora\typora-user-images\image-20230811093927467.png)

  ### 1.2.2 编译阶段

  ![image-20230811094353881](C:\Users\TST\AppData\Roaming\Typora\typora-user-images\image-20230811094353881.png)

  ### 1.2.3 complilation阶段会发生的小事件

  ![image-20230811094714484](C:\Users\TST\AppData\Roaming\Typora\typora-user-images\image-20230811094714484.png)

  ### 1.2.4 输出阶段

  ![image-20230811094801251](C:\Users\TST\AppData\Roaming\Typora\typora-user-images\image-20230811094801251.png)

## 1.3 编写Loader

### 1.3.1 Loader基础

> ```webpack运行在node.js之上，一个loader其实就是一个node模块，该模块需要导出一个函数，这个函数用来获取处理前的内容，然后返回处理过后的内容。```

```javascript
### 一个简单的Loader
const sass = require('node-sass');

module.exports = function(source){

	return sass(source)

}
```

### 1.3.2 Loader 进阶

#### 1.3.2.1 获取Loader中的options

```js
const loaderUtils = require('loader-utils');
module.exports = function(source){
    const options = loaderUtils.getOptions(this);
    return source;
}
```

#### 1.3.2.2 Loader返回额外的内容

​	上面内容只返回了原内容转换后的内容，某些情况下需要返回除原内容之外的东西，以babel-loader转换ES6内容为例，除了返回原内容还需要返回SourceMap文件来方便调试。

```js
module.exports = function(source){
    //通过callback方法告诉webpack返回的结果
    //使用callback方法时候loader函数必须返回undefined
    //目的是让webpack知道loader的结果在this.callback中
    this.callback(null,source,sourceMaps);
    return;
}
//this.callback是webpack向loader注入的API,方便loader和webpack通信
this.callback(
    //当无法转换原内容时webpack返回一个Error
	err:Error | null,
    //原内容转换后的内容
    content:string | Buffer,
    //转换后的原内容用于调试
    sourceMap?: SourceMap,
    //如本次转换生成了AST树则可以将这个AST返回，作用是让loader复用该AST提升性能
    abstractSyntaxTree?:AST
);
```

#### 1.3.2.3 同步和异步Loader

​	在某些场景下loader转换的步骤只能是异步完成，例如需要通过网络请求才能得出返回结果。

```js
//如果是异步转换可以这样处理
module.exports = function(source){
    //告诉webpack本次是异步转换,loader会在callback中回调结果
    var callback = this.async();
    someAsyncOperation(source,function(err,result,sourceMaps,ast){
        //通过callback返回异步执行后的结果
        callback(err,result,sourceMaps,ast);
    })
}
```

#### 1.3.2.4 缓存加速

​	某些情况下转换操作需要大量的计算，非常耗时，如果每次构建都重新执行重复的转换操作则构建会变得非常缓慢，因此webpack会默认缓存所有loader的处理结果，也就是文件或者依赖文件没发生变化的时候是不会重新调用对应loader去执行转换操作的。

```js
//关闭loader缓存功能
module.exports = function(source){
    this.cacheable(false);
    return source;
}
```

#### 1.3.2.5 加载本地Loader

​	为了测试编写的loader能否正常工作需要将它配置到webpack中才能调用，之前使用的loader都是npm安装的，如果想使用本地loader可以安装Npm link来调试本地Npm模块。

- 配置好Loader的package.json文件
- 本地模块根目录下执行npm link将本地模块注册到全局
- 在项目根目录下执行npm link loader-name
- 在webpack.config.js中配置本地loader的路径（之前模块都在node_modules中，需要配置resolveLoader属性，告诉webpack除了要去node_modules下寻找模块还要去xxx/自定义的loader文件夹下查找）

![image-20230811104629160](C:\Users\TST\AppData\Roaming\Typora\typora-user-images\image-20230811104629160.png)

## 1.4 编写Plugin

### 1.4.1 Plugin基础

> webpack会在运行周期中广播出很多事件，plugin可以监听这些事件(通过接收compiler对象来订阅事件)，在合适的时机通过webpack提供的api来改变输出结果。

### 1.4.2 一个简单的Plugin

```js
// BasicPlugin.js
class BasicPlugin{
	constructor(options){
	}
	apply(compiler){
		compiler.plugin('compilation',function(compilation){})
	}
}
module.exports = BasicPlugin;

//webpack.config.js
const BasicPlugin = require('./BasicPlugin.js');
module.export = {
    plugins:[
        new BasicPlugin(options),
    ]
}
```

​	webpack启动后在读取配置的过程中会先执行new BasicPlugin(options),初始化一个BasicPlugin获取其实例对象。在初始化compiler对象后调用basicPlugin.apply(compiler)为插件实例传入compiler对象。插件实例获取到对象后就可以通过compiler.plugin（事件名,回调函数）监听到webpack广播的事件，并且可以通过compiler对象去操作webpack。

### 1.4.3 Compiler和Compilation

​	在开发 Plugin 时最常用的两个对象就是 Compiler Compilation ，它们是 Plugin Webpack之间的桥梁。 Compiler Compilation 的含义如下：

- Compiler 对象包含了 Webpack 环境的所有配置信息，包含 options loaders plugins等信息。这个对象在 Webpack 启动时被实例化，它是全局唯一的，可以简单地将它理解为 Webpack 实例。
- Compilation 对象包含了当前的模块资源、编译生成资源、变化的文件等。当 Webpack以开发模式运行时，每当检测到一个文件发生变化，便有一次新的 Compilation被创建。 Compilation 对象也提供了很多事件回调供插件进行扩展。通过 Compilation也能读取到 Compiler 对象。
- Compiler Compilation 的区别在于： Compiler 代表了整个 Webpack 从启动到关闭的生命周期，而 Compilation 只代表一次新的编译。

### 1.4.4 事件流

​	webpack就像一条生产线，要经过一系列处理流程后才能将源文件转换成输出结果，产线上的每个流程的职责是单一的，多个流程之间存在依赖关系，只有在完成当前处理流程后才能给下一个流程处理，plugin如同插入产线中的某个功能，在特定时机对产线的资源进行处理。

​	webpack通过Tapable来组织生产线。webpack在运行中会广播事件，插件只需要监听它关心的事件就能加入到产线中去改变产线的运作。

​	webpack事件流使用了观察者模式，Compiler和Compilation都继承自Tapable，可以直接在它们身上广播和监听事件。

```js
//compiler的广播和监听,compilation同理
//广播
compiler.apply('event-name',params);
//监听
compiler.plugin('event-name',callback);
```

> webpack传给每个插件的compiler和compilation都是同一个引用，也就是如果修改了它们身上的属性就会影响到后面的插件。

​	有些事件是异步执行的，这些异步事件会有两个参数，第二个参数为回调函数，在插件处理完任务时需要手动调用回调函数通知webpack才会进入下一个流程。

```js
compiler.plugin('emit',function(compilation,callback){
    // 处理完后执行callback通知webpack
    // 如果不执行运行流程会卡在这里
    callback();
})
```

### 1.4.5 Plugin案例

​	接下来编写一个实际案例，插件名称为EndWebpackPlugin,作用是在webpack要退出的时候执行一些额外操作，例如编译成功和输出了文件后执行发布操作的功能。

```js
//webpack.config.js
const EndWebpackPlugin = require('./EndWebpackPlugin.js')
module.exports = {
    plugins:[
        new EndWebpackPlugin(()=>{
            //构建成功的回调
        },(err)=>{
            //构建失败的回调
            console.error(err);
        })
    ]
}
//EndWebpackPlugin.js
class EndWebpackPlugin{
    constructor(done,failed){
        this.done = done;
        this.failed = fail
    }
    //监听done、failed事件
    apply(compiler){
        compiler.plugin('done',(status)=>{
            this.done(status);
        });
        compiler.plugin('failed',(err)=>{
            this.failed(err);
        })
    }
}

module.exports = EndWebpackPlugin;
```

## 1.5 热更新

### 1.5.1 自动编译代码

- webpack的Watch Mode (观察模式)
- webpack-dev-server
- webpack-dev-middleware

观察模式 添加一个scripts 用npm run watch启动就可以保存代码的时候自动编译改动 缺点是需要手动刷新浏览器

```json
//package.json
"scripts":{
	"watch":"webpack --watch"
}
```

webpack-dev-server可以在代码保存后自动编译加载，并且运行后webpack不会将文件输出到目录,而是会把bundle保存在内存当中。

```json
//webpack-dev-server
npm install --save-dev webpack-dev-server

"scripts":{
	"watch":"webpack --watch",
	"start":"webpack serve --open"
}
```

**webpack-dev-middleware**

webpack-dev-middleware是一个封装器，可以把webpack处理过的文件发送到server。webpack-dev-server内部使用了它，它也可以单独作为一个package使用，示例：

```
npm install --save-dev express webpack-dev-middleware
```

修改webpack.config.js

```
output:{
	...
	publicPath:'/'
}
```

设置express server

```js
//server.js
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');

const app = express();
const config = require('./webpack.config.js');
const compiler = webpack(config);

// 告知 express 使用 webpack-dev-middleware，
// 以及将 webpack.config.js 配置文件作为基础配置。
app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
  })
);

// 将文件 serve 到 port 3000。
app.listen(3000, function () {
  console.log('Example app listening on port 3000!\n');
});
```

添加一个scripts 然后启动运行就可以在浏览器看到webpack程序运行了

```
"scripts":{
	"server":"node server.js"
}
```


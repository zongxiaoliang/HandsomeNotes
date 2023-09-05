### 一、Buffer

类似于Array的对象，表示固定长度的字节序列，译为缓冲区，本质是一段内存空间用来存储二进制数据

```js  
//创建一段参数长度的空间 创建前会清空旧内存空间数据 参数Number
let buf_1 = Buffer.alloc(10);
//非安全创建一段参数长度的空间 可能包含旧内存空间的数据 参数Number
let buf_2 = Buffer.allocUnsafe(211);
//将一个字符串或数组转为buffer 转换后的值对应16进制的ASCII码
let buf_3 = Buffer.from('node');
//buffer数组转字符串
let buf_4 = Buffer.from([105,108,109,111]);
buf_4.toString();
```

### 二、文件写入

| 方法                      | 说明     |
| ------------------------- | -------- |
| writeFile                 | 异步写入 |
| writeFileSync             | 同步写入 |
| appendFile/appendFileSync | 追加写入 |
| createWriteStream         | 流式写入 |

#### 2.1 writeFile异步写入

语法：```fs.writeFile(file,data,callback)```

参数说明：

- file：文件名/写入到的地方
- data：待写入的数据
- options：配置项(==可选==)
- callback ：回调函数（写入失败会传入错误对象，写入成功传入null）

返回值：```undefined```

代码示例：

```js
const fs = require('fs');

fs.writeFile('./test.txt','hello world',(err)=>{
	if(err){
		console.log(err);
		return;
	}
	console.log('写入成功');
});
```

#### 2.2 writeFileSync同步写入

语法：```fs.writeFileSync(file,data)```

参数说明：

- file：文件名/写入到的地方
- data：待写入的数据

返回值：```undefined```

备注：``` 异步写入不阻塞主线程，会把回调函数压入事件执行栈中，当文件写入完等待主线程执行完毕去执行栈中调用回调函数，同步写入会阻塞主线程,文件写入完之后才会继续执行后续代码```

#### 2.3 appendFile/appendFileSync追加写入

向文件中追加写入内容，同步异步的差异和writeFile一致

##### 2.3.1 appendFile异步追加

语法：```fs.appendFile(file,data,callback)```

参数说明：

- file：文件名/写入到的地方
- data：待写入的数据
- callback :回调函数（写入失败会传入错误对象，写入成功传入null）

返回值：```undefined```

##### 2.3.2 appendFileSync同步追加

语法：```fs.appendFileSync(file,data)```

参数说明：

- file：文件名/写入到的地方
- data：待写入的数据

返回值：```undefined```

#### 2.4 createWriteStream流式写入

语法：```fs.createWriteStream(path,options)```

参数说明：

- file：文件名/写入到的地方
- options：配置项(==可选==)

返回值：```Object```

示例:

```js
const fs = require('fs');
//返回一个Object
const ws = fs.createWriteStream('./text.txt');
//调用write方法持续写入内容
ws.write('哈哈哈');
ws.write('尊嘟假嘟');
//关闭连接 释放内存
ws.close();
```

### 三、文件读取

| 方法             | 说明     |
| ---------------- | -------- |
| readFile         | 异步读取 |
| readFileSync     | 同步读取 |
| createReadStream | 流式读取 |

#### 3.1 readFile异步读取

语法：```fs.readFile(path,options,callback)```

参数说明：

- file：读取文件名称
- options：配置项(==可选==)
- callback：回调函数

返回值：```undefined```

示例:

```js
const fs = require('fs');
//err是读取失败的错误信息，data是读取成功的数据是一个buffer
fs.readFile('./text.txt',(err,data)=>{
	if(err){
		throw err;
	}
	console.log(data);//<Buffer e5 93 88 e5 93 88 e5>
});
```

#### 3.2 readFileSync同步读取

语法：```fs.readFileSync(path,options)```

参数说明：

- file：读取文件名称
- options：配置项(==可选==)

返回值：```Buffer```

#### 3.3 createReadStream流式读取

语法：```fs.createReadStream(path,options)```

参数说明：

- file：读取文件名称
- options：配置项(==可选==)

返回值：```Object```

示例：

```js
const fs = require('fs');
//创建读取流
const rs = fs.createReadStream('./text.txt');
//创建写入流
const ws = fs.createWriteStream('./text-1.txt');
//监听读取流的data事件，每次读取到数据都会执行回调
rs.on('data',chunk=>{
    //chunk是buffer,向写入流写入buffer
	ws.write(chunk);
});
//监听读取流的end事件
rs.on('end',()=>{
    console.log('传输结束了');
})
```

### 四、文件移动与重命名

使用```rename```或```renameSync```来移动或重命名文件或者文件夹

语法：

```fs.rename(oldPath,newPath,callback)```

```fs.renameSync(oldPath,newPath)```

参数说明:

- oldPath：文件当前路径
- newPath：文件新的路径
- callback：操作后的回调函数

